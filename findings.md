# 发现记录

## 关键证据
- `casual_games_vue3/package.json` 提供 `dev:h5`、`build:h5`、`dev:mp-weixin`、`build:mp-weixin`。
- `casual_games_vue3/src/pages/dice-game/index.vue` 已有 `uni.startAccelerometer`、`uni.onAccelerometerChange` 和 iOS `DeviceMotionEvent.requestPermission` 处理。
- H5 当前没有直接监听浏览器 `devicemotion`，如果 `uni` H5 加速度封装不可用或不触发，摇一摇会失效。
- `npm.cmd run build:h5` 和 `npm.cmd run build:mp-weixin` 均通过。

## 决策
- 保留 `uni` 加速度计作为小程序/App 主路径。
- H5 在授权后额外注册原生 `devicemotion` 监听，并共用现有阈值判断。
- 不调整根 workspace 指向，避免把“修传感器”扩大成项目结构迁移。

## 低风险优化建议
- 用户已确认 `casual_games_uniapp` 无实际使用；后续开发优先看 `casual_games_vue3`，并可统一根脚本以减少误跑命令。
- Sass 构建有 `legacy-js-api` 依赖警告，后续升级 Sass/uni 工具链时可处理。
