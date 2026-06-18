# 任务计划

## 目标
- 将现有 Worker API 迁移为 Cloudflare Pages Functions 同源 API。
- 让前端默认请求 `https://casual-games-90p.pages.dev/api/...`，避免浏览器直连 `*.workers.dev`。

## 范围
- `casual_games_backend/src/index.ts`
- `casual_games_vue3/functions/api/[[path]].ts`
- `casual_games_vue3/src/utils/request.ts`
- `casual_games_vue3/wrangler.toml`
- 相关构建、预览和部署脚本

## 非目标
- 不直接执行远程部署、修改 Cloudflare 生产配置或绑定生产资源。
- 不拆分现有后端路由为多个文件路由。
- 不调整数据库 schema。

## 阶段
1. 确认现有 Worker 入口、前端 API base 和 Cloudflare Pages Functions 模式。
2. 新增 Pages Functions catch-all API 路由，复用现有 API 处理器。
3. 新增前端 Pages 配置和构建脚本，默认 API 改为同源。
4. 运行构建/类型检查并记录手动部署步骤。

## 验收标准
- 前端 H5 构建通过。
- Pages Functions 入口可由 `wrangler pages dev` 加载。
- 本地或远程部署后 `/api/health` 返回 JSON。
- 非 `/api/*` 请求继续由 Pages 静态资源处理。
