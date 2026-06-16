# GitHub Actions 自动部署配置指南

## 🔐 第一步：创建新的 API Token（安全的）

### 1. 访问 Cloudflare API Tokens
https://dash.cloudflare.com/profile/api-tokens

### 2. 点击 "Create Token"

### 3. 选择 "Create Custom Token"

### 4. 配置权限（最小权限原则）

**Token 名称**: `GitHub Actions Deploy`

**权限设置**:
- Account | Cloudflare Pages | Edit
- Account | D1 | Edit
- Account | Workers KV Storage | Edit
- Account | Workers Scripts | Edit

**账户资源**:
- Include | Your Account

**TTL**: 永久（或设置过期时间）

### 5. 创建 Token
点击 "Continue to summary" → "Create Token"

### 6. 复制 Token
⚠️ **只会显示一次，立即复制保存！**

---

## 🔑 第二步：配置 GitHub Secrets

### 1. 访问你的 GitHub 仓库
https://github.com/zle0328/casual_games

### 2. 进入 Settings → Secrets and variables → Actions

### 3. 点击 "New repository secret"，添加以下 Secrets：

#### Secret 1: CLOUDFLARE_API_TOKEN
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Value**: 粘贴刚才创建的 API Token

#### Secret 2: CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Value**: `81d5b73148bf8fa53dd0c440eae8691f`

#### Secret 3: VITE_API_BASE_URL（后面填写）
- **Name**: `VITE_API_BASE_URL`
- **Value**: 先留空，等后端部署成功后填写

---

## 📋 第三步：配置 wrangler.toml

### 1. 创建 D1 数据库（本地执行一次）

在你的电脑上：
```bash
cd casual_games_backend
npx wrangler login
npx wrangler d1 create casual-games-db
```

会返回：
```
✅ Successfully created DB 'casual-games-db'
database_id = "xxxxx-xxxxx-xxxxx"
```

### 2. 创建 KV 命名空间
```bash
npx wrangler kv:namespace create KV
npx wrangler kv:namespace create KV --preview
```

会返回：
```
✅ id = "xxxxx"
✅ preview_id = "yyyyy"
```

### 3. 更新 wrangler.toml

编辑 `casual_games_backend/wrangler.toml`，填入上面的 ID：

```toml
name = "casual-games-backend"
main = "src/index.ts"
compatibility_date = "2024-11-27"

# 账户 ID
account_id = "81d5b73148bf8fa53dd0c440eae8691f"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "casual-games-db"
database_id = "填写你的database_id"

# KV 存储绑定
[[kv_namespaces]]
binding = "KV"
id = "填写你的kv_id"
preview_id = "填写你的preview_id"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.development]
vars = { ENVIRONMENT = "development" }
```

---

## 🚀 第四步：推送代码触发部署

### 1. 提交 GitHub Actions 配置
```bash
git add .github/
git commit -m "ci: 添加 GitHub Actions 自动部署"
git push origin master
```

### 2. 手动初始化数据库

访问：https://github.com/zle0328/casual_games/actions

1. 选择 "Initialize Database" workflow
2. 点击 "Run workflow"
3. 等待执行完成（初始化数据库表）

### 3. 触发自动部署

再次推送代码：
```bash
git commit --allow-empty -m "trigger: 触发自动部署"
git push origin master
```

或者在 GitHub Actions 页面手动运行 "Deploy to Cloudflare"

---

## 📝 第五步：获取部署 URL

### 1. 后端 Workers URL

部署成功后，在 GitHub Actions 日志中查找：
```
https://casual-games-backend.你的子域名.workers.dev
```

或访问 Cloudflare Dashboard:
https://dash.cloudflare.com/81d5b73148bf8fa53dd0c440eae8691f/workers-and-pages

### 2. 更新前端 API 地址

回到 GitHub Secrets，添加：
- **Name**: `VITE_API_BASE_URL`
- **Value**: `https://casual-games-backend.xxx.workers.dev`

### 3. 重新部署前端

推送一次代码或手动触发 workflow

### 4. 前端 Pages URL

访问：
```
https://casual-games.pages.dev
```

---

## 🎯 完整部署流程图

```
1. 撤销旧凭证 ✅
   ↓
2. 创建新的 API Token ✅
   ↓
3. 配置 GitHub Secrets ✅
   ↓
4. 本地创建 D1 + KV ✅
   ↓
5. 更新 wrangler.toml ✅
   ↓
6. 推送代码到 GitHub ✅
   ↓
7. 手动运行初始化数据库 ✅
   ↓
8. 自动部署后端 + 前端 ✅
   ↓
9. 获取 Workers URL ✅
   ↓
10. 更新 VITE_API_BASE_URL ✅
   ↓
11. 重新部署前端 ✅
   ↓
12. 访问 https://casual-games.pages.dev 🎉
```

---

## ⚠️ 重要提醒

### 必须先执行的本地操作

以下命令**必须在本地执行一次**（GitHub Actions 无法创建资源）：

```bash
# 1. 登录
npx wrangler login

# 2. 创建 D1
npx wrangler d1 create casual-games-db

# 3. 创建 KV
npx wrangler kv:namespace create KV
npx wrangler kv:namespace create KV --preview

# 4. 记录所有 ID 并填入 wrangler.toml
```

完成后，GitHub Actions 就可以自动部署了！

---

## 🆘 常见问题

### Q1: GitHub Actions 失败，提示 "Authentication error"
**解决**: 检查 `CLOUDFLARE_API_TOKEN` 是否正确配置在 GitHub Secrets

### Q2: 前端访问 API 报 404
**解决**: 检查 `VITE_API_BASE_URL` 是否设置为正确的 Workers URL

### Q3: 数据库表不存在
**解决**: 手动运行 "Initialize Database" workflow

---

## 📞 需要帮助？

遇到问题随时告诉我，我会帮你解决！

**下一步**: 先撤销旧凭证，然后创建新的 API Token 😊
