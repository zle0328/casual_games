# Cloudflare Pages Functions 迁移说明

## 目标

让前端和 API 都走同一个 Pages 域名：

- 页面：`https://casual-games-90p.pages.dev/`
- API：`https://casual-games-90p.pages.dev/api/health`

## 代码结构

- Pages 前端项目：`casual_games_vue3`
- Pages Functions 入口：`casual_games_vue3/functions/api/[[path]].ts`
- 复用后端处理器：`casual_games_backend/src/index.ts`
- Pages 配置：`casual_games_vue3/wrangler.toml`

`functions/api/[[path]].ts` 会接住所有 `/api/*` 请求，并转交给现有 Worker 路由处理。

## Cloudflare Pages 配置

Pages 项目继续使用 GitHub 自动部署，配置应为：

- Root directory: `casual_games_vue3`
- Build command: `npm run build:h5`
- Build output directory: `dist/build/h5`
- Environment variable: 删除 `VITE_API_BASE_URL`，或保持为空

Functions 绑定需要在 Pages 项目中配置同名资源：

- D1 binding: `DB` -> `casual-games-db`
- KV binding: `KV` -> 现有词条 KV namespace
- Variable: `ENVIRONMENT=production`

## 验证

部署后访问：

```bash
curl https://casual-games-90p.pages.dev/api/health
```

期望返回：

```json
{"status":"ok","timestamp":...}
```

本地验证：

```bash
cd casual_games_vue3
npm run build:h5
npm run pages:dev -- --port 8788 --show-interactive-dev-session=false
```

然后访问：

```bash
curl http://127.0.0.1:8788/api/health
```
