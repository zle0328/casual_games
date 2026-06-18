# 发现记录

## 关键证据
- `casual_games_backend/src/index.ts` 当前导出标准 `fetch(request, env)` Worker 处理器，便于 Pages Functions 复用。
- `casual_games_backend/wrangler.toml` 已有 D1 绑定 `DB` 和 KV 绑定 `KV`，Pages 项目需要配置同名绑定。
- `casual_games_vue3/src/utils/request.ts` 使用 `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'`。
- Cloudflare Pages Functions 可使用 `functions` 目录文件路由；`functions/api/[[path]].ts` 会覆盖 `/api/*`。

## 决策
- 不拆分为多个 `functions/api/*.ts` 文件，避免重复维护现有路由判断。
- 新增单个 catch-all Pages Functions 入口：`/api/*` 交给现有后端 Worker，其他路径继续由 Pages 静态资源处理。
- 前端默认 API base 改为空字符串，实现同源相对路径请求。
- 不在 `build:h5` 手动生成 `_worker.js`；Cloudflare Pages Git 自动部署会基于 `functions` 目录处理 Functions。

## 风险
- Pages 项目必须配置同名 D1/KV 绑定，否则 `/api/*` 中访问 `env.DB` 或 `env.KV` 会失败。
- Cloudflare Pages 后台如仍设置 `VITE_API_BASE_URL` 指向 workers.dev，会覆盖同源默认值，需要删除或改为空。
