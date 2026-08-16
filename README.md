# dsh-balance-window（余额悬浮窗）

为 DeepSeek Harness（dsh）桌面端/Web 端打造的**左下角余额悬浮窗**：实时显示 DeepSeek 账户余额与预计剩余 token 量，可随意拖动，自动刷新。

![plugin](docs/screenshot.png)

## ✨ 功能

- 🪟 悬浮小窗默认位于左下角，**按住任意位置可拖动**到屏幕任何地方
- 💰 实时余额：调用 DeepSeek 官方 `GET /user/balance` 接口
- 🔢 预计剩余 token：按当前模型与设定单价（默认 ¥4/百万 token 混合价）估算
- 🔄 每 60 秒自动刷新，点击窗口或 ↻ 按钮立即刷新
- 🟢 绿色呼吸圆点 = 数据正常；失败自动重试，不会闪断
- 💾 拖动位置记忆（localStorage），重启后还在原位
- 🔒 隐私安全：API Key 只在使用者自己的环境中读取，插件不含任何密钥

## 📦 安装

- 完整安装教程见 [install-guide.md](install-guide.md)（Web 端与桌面端通用）
- 注册配置示例见 [cordis.patch.example.yml](cordis.patch.example.yml)

## 🔧 自定义

- 修改 `lib/index.js` 中的 `PRICE_PER_MILLION` 可调整 token 估算单价
- 修改 `lib/client.js` 中的刷新间隔（默认 60000ms）与默认位置
- 改完保存即可热加载，无需重启

## 📄 License

[MIT](LICENSE)
