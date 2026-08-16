/**
 * 余额悬浮窗 —— client 半
 * 注册到全局悬浮层 shell.overlay，通过同源 fetch 调用 host 半的 /api/balance。
 * 该文件由 clientModules 直接作为 bundle 服务（/plugins/dsh-balance-window/client.js）。
 */
window.__ModuleLoader__.load({
  id: 'dsh-balance-window',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    let React = require('react');

    //#region styles
    const CSS = `
.balwin {
  position: fixed;
  pointer-events: auto;
  z-index: 40;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,.28));
  background: var(--dsw-alias-bg-overlay, #fff);
  border-radius: 10px;
  box-shadow: 0 4px 18px rgba(0,0,0,.18);
  padding: 8px 10px;
  font: inherit;
  color: var(--dsw-alias-label-primary, #222);
  user-select: none;
  cursor: grab;
  min-width: 158px;
  max-width: 280px;
}
.balwin.dragging { cursor: grabbing; }
.balwin-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
}
.balwin-label { color: var(--dsw-alias-label-secondary, #888); }
.balwin-value { font-weight: 600; font-variant-numeric: tabular-nums; }
.balwin-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #2f9e44);
  animation: balwin-pulse 2s ease infinite;
  flex: none;
}
.balwin-dot.err { background: var(--dsw-alias-state-error-primary, #e03131); animation: none; }
.balwin-dot.stale { background: var(--dsw-alias-state-warn-primary, #f08c00); animation: none; }
.balwin-dot.idle { background: var(--dsw-alias-label-secondary, #888); animation: none; }
@keyframes balwin-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .35; }
}
.balwin-refresh {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #888);
  cursor: pointer;
  border-radius: 6px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex: none;
}
.balwin-refresh:hover {
  background: var(--dsw-alias-bg-layer-2, rgba(128,128,128,.14));
  color: var(--dsw-alias-label-primary, #222);
}
.balwin-hint {
  font-size: 10px;
  color: var(--dsw-alias-label-secondary, #888);
  margin-top: 3px;
}
.balwin-error {
  font-size: 10px;
  line-height: 1.4;
  color: var(--dsw-alias-state-warn-primary, #f08c00);
  margin-top: 3px;
  white-space: normal;
  word-break: break-all;
}
.balwin-error.fatal {
  color: var(--dsw-alias-state-error-primary, #e03131);
}
`;
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-balance-window"]') === null) {
      const tag = document.createElement('style');
      tag.setAttribute('data-plugin-css', 'dsh-balance-window');
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }
    //#endregion

    const inject = ['slots', 'timer'];

    function apply(ctx) {
      ctx.effect(() => ctx.slots.inject('shell.overlay', () => ctx.slots.register(
        { name: 'shell.overlay', id: 'balance-window', order: 0, label: '余额' },
        (props) => {
          const [status, setStatus] = React.useState(null);
          const [error, setError] = React.useState(null);
          const [stale, setStale] = React.useState(false);
          const [pos, setPos] = React.useState(() => {
            try {
              const raw = localStorage.getItem('dsh-balance-window-pos');
              if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
              }
            } catch (e) { /* 位置记忆为可选项 */ }
            return null;
          });
          const [dragging, setDragging] = React.useState(false);
          const dragRef = React.useRef(null);

          const refresh = React.useCallback(async () => {
            try {
              const res = await fetch('/api/balance');
              const data = await res.json();
              if (data && data.ok) {
                setStatus(data);
                setStale(false);
                setError(null);
              } else if (data && data.stale) {
                setStatus(data);
                setStale(true);
                setError(data.error ? '刷新失败：' + data.error : '刷新失败，显示上次数据');
              } else {
                setStatus(null);
                setStale(false);
                setError(data && data.error ? data.error : '获取失败');
              }
            } catch (e) {
              setStatus(null);
              setStale(false);
              setError(String((e && e.message) || e));
            }
          }, []);

          React.useEffect(() => {
            refresh();
            return ctx.interval(refresh, 5000);
          }, [refresh]);

          const onPointerDown = (e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = {
              sx: e.clientX,
              sy: e.clientY,
              bx: pos ? pos.x : 16,
              by: pos ? pos.y : 72,
            };
            setDragging(true);
          };
          const onPointerMove = (e) => {
            const d = dragRef.current;
            if (!d) return;
            const next = { x: d.bx + (e.clientX - d.sx), y: d.by - (e.clientY - d.sy) };
            setPos(next);
          };
          const onPointerUp = (e) => {
            const d = dragRef.current;
            dragRef.current = null;
            setDragging(false);
            if (d) {
              if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 4) {
                refresh();
              } else {
                const next = {
                  x: d.bx + (e.clientX - d.sx),
                  y: d.by - (e.clientY - d.sy),
                };
                try {
                  localStorage.setItem('dsh-balance-window-pos', JSON.stringify(next));
                } catch (e2) { /* 位置记忆为可选项 */ }
              }
            }
          };

          const fmtTokens = (n) => {
            if (n == null || !Number.isFinite(n)) return '--';
            if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
            if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
            return String(Math.round(n));
          };

          const cur = (status && status.currency === 'CNY') ? '¥' : ((status && status.currency) ? status.currency + ' ' : '¥');
          const balanceText = status ? cur + status.balance.toFixed(2) : '--';
          const tokenText = status ? '≈' + fmtTokens(status.estTokens) + ' tok' : '--';
          const dotClass = error ? (stale ? 'balwin-dot stale' : 'balwin-dot err') : (status ? 'balwin-dot' : 'balwin-dot idle');
          const tip = status
            ? `DeepSeek 余额 ${balanceText}${status.model ? ' · ' + status.model : ''} · 预计剩余 ${fmtTokens(status.estTokens)} tokens（按 ¥${status.pricePerMillion}/百万估算）· 每 5s 实时刷新`
            : (error ? '余额获取失败：' + error + '（点击重试）' : '余额加载中…');

          const style = {
            left: (pos ? pos.x : 16) + 'px',
            bottom: (pos ? pos.y : 72) + 'px',
          };

          const children = [
            React.createElement('div', { className: 'balwin-row' },
              React.createElement('span', { className: dotClass }),
              React.createElement('span', { className: 'balwin-label' }, '余额'),
              React.createElement('span', { className: 'balwin-value' }, balanceText),
              React.createElement('button', {
                type: 'button',
                className: 'balwin-refresh',
                title: '立即刷新',
                'aria-label': '立即刷新',
                onPointerDown: (e) => e.stopPropagation(),
                onClick: (e) => { e.stopPropagation(); refresh(); },
              }, '↻'),
            ),
            React.createElement('div', { className: 'balwin-row' },
              React.createElement('span', { className: 'balwin-label' }, '预计剩余'),
              React.createElement('span', { className: 'balwin-value' }, tokenText),
            ),
          ];
          if (error) {
            children.push(React.createElement('div', {
              className: stale ? 'balwin-error' : 'balwin-error fatal',
              key: 'err',
            }, error));
          }
          children.push(React.createElement('div', { className: 'balwin-hint', key: 'hint' }, '按住拖动 · 实时刷新'));

          return React.createElement('div', {
            className: dragging ? 'balwin dragging' : 'balwin',
            style,
            title: tip,
            'aria-label': tip,
            onPointerDown,
            onPointerMove,
            onPointerUp,
          }, children);
        },
      )), 'balance-window: overlay slot');
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
