/**
 * 余额悬浮窗 —— host 半
 * 提供 /api/balance 路由：查询 DeepSeek 余额并估算剩余 token。
 * 运行在真实 Node 环境（静态插件），直接使用全局 fetch，跨平台可用。
 */
export const name = 'dsh-balance-window'

export const inject = ['credentials', 'webServer']

// 估算基准：混合价（输入 ¥2 + 输出 ¥8）/ 2 = ¥4 / 百万 token
const PRICE_PER_MILLION = 4
const BALANCE_URL = 'https://api.deepseek.com/user/balance'

export function apply(ctx) {
  let cache = null
  let cacheAt = 0

  async function queryOnce() {
    const cred = await ctx.credentials.resolve('DEEPSEEK_API_KEY')
    if (!cred) throw new Error('未配置 DEEPSEEK_API_KEY 凭据')
    const resp = await fetch(BALANCE_URL, {
      headers: { Authorization: `Bearer ${cred.value}` },
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`余额接口 HTTP ${resp.status}: ${String(text).slice(0, 120)}`)
    }
    const data = await resp.json()
    const info = (data.balance_infos || [])[0] || {}
    const balance = Number.parseFloat(info.total_balance)
    if (!Number.isFinite(balance)) throw new Error('余额响应格式异常')
    const estTokens = Math.floor(balance / (PRICE_PER_MILLION / 1e6))
    let model = null
    try {
      const sel = ctx.get('agentDefaultModel')?.currentSelection()
      model = (sel && sel.model) || null
    } catch (e) { /* model 展示为可选项 */ }
    return {
      ok: true,
      balance,
      currency: info.currency || 'CNY',
      isAvailable: data.is_available !== false,
      estTokens,
      model,
      pricePerMillion: PRICE_PER_MILLION,
      fetchedAt: Date.now(),
    }
  }

  async function status() {
    const now = Date.now()
    // 5 秒缓存：近实时轮询，避免每次请求都打 DeepSeek 接口
    if (cache && now - cacheAt < 5000) return cache
    try {
      const payload = await queryOnce()
      cache = payload
      cacheAt = now
      return payload
    } catch (e1) {
      // 偶发失败：立即自动重试一次
      try {
        const payload = await queryOnce()
        cache = payload
        cacheAt = Date.now()
        return payload
      } catch (e2) {
        // 仍失败：若之前成功过，返回上次数据 + stale 标记
        if (cache) {
          return {
            ...cache,
            stale: true,
            error: String((e2 && e2.message) || e2).slice(0, 200),
          }
        }
        return { ok: false, error: String((e2 && e2.message) || e2).slice(0, 200) }
      }
    }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/balance',
    handler: async (_req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      try {
        const payload = await status()
        res.end(JSON.stringify(payload))
      } catch (e) {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, error: String((e && e.message) || e).slice(0, 200) }))
      }
    },
  }), 'balance-window: /api/balance route')
}
