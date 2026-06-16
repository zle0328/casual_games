# 快速启动指南

## 🚀 5分钟快速启动

### 前置条件
- Node.js >= 20
- npm >= 10

---

## 方式一：本地开发（推荐新手）

### 1. 克隆项目
```bash
git clone https://github.com/zle0328/casual_games.git
cd casual_games
```

### 2. 安装依赖
```bash
# 安装所有依赖（根目录 + 前后端）
npm install
```

### 3. 启动前端（H5）
```bash
cd casual_games_uniapp
npm run dev
```

打开浏览器访问 `http://localhost:5173`

**注意**: 此时 API 请求会失败，因为后端还未启动。先体验前端页面效果，后端可稍后配置。

---

## 方式二：完整开发（前端 + 后端）

### 步骤 1: 配置 Cloudflare（首次需要）

#### 1.1 安装 Wrangler CLI
```bash
npm install -g wrangler
```

#### 1.2 登录 Cloudflare
```bash
wrangler login
```
会打开浏览器，用 Cloudflare 账号登录（免费注册：https://dash.cloudflare.com/sign-up）

#### 1.3 创建 D1 数据库
```bash
cd casual_games_backend
wrangler d1 create casual-games-db
```

**输出示例**:
```
✅ Successfully created DB 'casual-games-db'!
database_id = "xxxx-xxxx-xxxx-xxxx"
```

复制 `database_id`，打开 `wrangler.toml`，填入：
```toml
[[d1_databases]]
binding = "DB"
database_name = "casual-games-db"
database_id = "粘贴你的 database_id"
```

#### 1.4 创建 KV 命名空间
```bash
wrangler kv:namespace create KV
wrangler kv:namespace create KV --preview
```

**输出示例**:
```
✅ id = "xxx"
✅ preview_id = "yyy"
```

填入 `wrangler.toml`：
```toml
[[kv_namespaces]]
binding = "KV"
id = "粘贴你的 id"
preview_id = "粘贴你的 preview_id"
```

#### 1.5 初始化数据库表
```bash
npm run db:local
```

### 步骤 2: 启动后端
```bash
cd casual_games_backend
npm run dev
```

后端运行在 `http://localhost:8787`

### 步骤 3: 启动前端
在**新终端**：
```bash
cd casual_games_uniapp
npm run dev
```

前端运行在 `http://localhost:5173`

### 步骤 4: 验证
打开浏览器访问 `http://localhost:5173`，尝试点击游戏卡片，应该能正常加载。

---

## 🐛 常见问题

### Q1: `npm install` 失败
**解决**: 检查 Node 版本 >= 20
```bash
node --version  # 应该显示 v20.x 或更高
```

### Q2: 前端访问 API 报错 "Network Error"
**原因**: 后端未启动或地址错误  
**解决**: 
1. 确认后端 `npm run dev` 正在运行
2. 检查 `casual_games_uniapp/.env` 中的 `VITE_API_BASE_URL` 是否为 `http://localhost:8787`

### Q3: Wrangler 登录失败
**解决**: 
1. 检查网络连接
2. 手动访问 https://dash.cloudflare.com 确认能打开
3. 使用 `wrangler login --browser=false` 获取手动授权链接

### Q4: D1 数据库创建失败
**解决**: 
1. 确认已登录 Cloudflare: `wrangler whoami`
2. 确认账号已验证邮箱
3. 重试: `wrangler d1 create casual-games-db --force`

---

## 📱 微信小程序开发

### 启动小程序开发模式
```bash
cd casual_games_uniapp
npm run dev:mp-weixin
```

### 使用微信开发者工具
1. 下载微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 打开工具，选择"导入项目"
3. 项目目录选择: `casual_games_uniapp/dist/dev/mp-weixin`
4. AppID: 测试号（或填写你的小程序 AppID）

---

## 🚢 部署到生产环境

### 部署后端
```bash
cd casual_games_backend
npm run db:init  # 初始化生产数据库
npm run deploy
```

会得到 Workers URL，例如: `https://casual-games-backend.xxx.workers.dev`

### 更新前端 API 地址
创建 `casual_games_uniapp/.env.production`:
```
VITE_API_BASE_URL=https://your-workers-url.workers.dev
```

### 部署前端到 Cloudflare Pages
```bash
cd ..
npm run deploy:pages
```

---

## 📖 完整文档

- [完整开发文档](./README.md)
- [开发计划](./DEVELOPMENT.md)

---

## 💬 需要帮助？

- GitHub Issues: https://github.com/zle0328/casual_games/issues
- 查看 README.md 获取详细说明
