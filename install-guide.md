# dsh-balance-window 安装教程

Web 端与桌面端（dsh-desktop）使用同一套 `$DSH_HOME/profiles` 配置和插件机制，安装步骤完全一致。

## 前置条件

- 已安装 DeepSeek Harness（web 或桌面端），版本不过旧即可
- 已配置 `DEEPSEEK_API_KEY` 凭据（插件读取**你自己的** key 查询余额，不含任何密钥）

## 安装步骤

### 1. 找到你的 `$DSH_HOME`

默认位置：

| 平台 | 路径 |
| --- | --- |
| Windows | `C:\Users\<用户名>\AppData\Roaming\dsh-desktop\dsh-home`（桌面端）/ `~\.dsh`（CLI） |
| macOS / Linux | `~/.dsh` |

> 可通过环境变量确认：`echo $DSH_HOME`（Windows: `echo %DSH_HOME%`）

### 2. 复制插件包

把仓库中的 **`dsh-balance-window` 文件夹**（含 `package.json` 和 `lib/`）整个复制到：

```
$DSH_HOME/profiles/node_modules/dsh-balance-window/
```

最终结构应如下：

```
profiles/node_modules/dsh-balance-window/
├── package.json
└── lib/
    ├── index.js
    └── client.js
```

### 3. 注册插件

打开 `$DSH_HOME/profiles/web/cordis.patch.yml`（没有则新建，内容为 `[]`），加入：

```yaml
# 余额悬浮窗
- insert:
    - id: balance-window
      name: 'dsh-balance-window'
```

> 也可以把同样的注册行加到 home 级 `$DSH_HOME/cordis.patch.yml`（优先级更高）。

### 4. 生效

- 修改 `cordis.patch.yml` 会被**热加载**，无需重启
- 若未生效，刷新浏览器页面；若仍无，重启 harness

## 使用

- 窗口默认在左下角，**按住任意位置拖动**
- 每 60 秒自动刷新；点击窗口或 ↻ 按钮立即刷新
- 悬停查看详情（模型、估算基准、刷新时间）
- 拖动位置自动记忆，重启后保持

## 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 显示"未配置 DEEPSEEK_API_KEY 凭据" | 在 Harness 设置/Models 页面填入 DeepSeek API Key |
| 显示"余额响应格式异常" | 插件与 DeepSeek 接口版本不兼容，检查 dsh 版本 |
| 完全不显示 | 确认注册行格式（必须是 `insert:` 列表）；确认 `profiles/node_modules/dsh-balance-window` 路径正确 |
| token 估算不准 | 修改 `lib/index.js` 中 `PRICE_PER_MILLION`（默认 4，即 ¥4/百万 token 混合价） |

## 卸载

1. 从 `cordis.patch.yml` 删除注册行（热加载立即移除）
2. 删除 `profiles/node_modules/dsh-balance-window/` 文件夹
