# 🎲 派对游戏小程序

专为聚会、酒局打造的趣味互动小程序，包含摇骰子和谁是卧底两大经典游戏。

## ✨ 功能特性

### 🎲 摇骰子
- 单机模式：本地摇骰子，比大小
- 联机模式：创建房间，多人同时玩
- 自定义惩罚规则（最小喝、最大喝、豹子等）
- 3D 骰子动画，摇一摇触发

### 🕵️ 谁是卧底
- 支持 3-10 人游戏
- 自定义卧底和白板数量
- 丰富的词条库
- 投票环节、发言计时
- 完整的游戏流程

### 📊 数据统计
- 游戏历史记录
- 胜率统计
- 个人成就展示

## 🏗️ 技术架构

### 前端
- **框架**: UniApp + Vue 3 + TypeScript
- **状态管理**: Pinia
- **构建工具**: Vite
- **支持平台**: H5、微信小程序

### 后端（Cloudflare 全栈）
- **计算**: Cloudflare Workers
- **数据库**: Cloudflare D1（SQLite）
- **KV 存储**: Workers KV（词条库）
- **托管**: Cloudflare Pages

## 📦 项目结构

```
casual_games/
├── casual_games_uniapp/      # 前端 UniApp 项目
│   ├── api/                  # API 接口封装
│   ├── components/           # 公共组件
│   ├── pages/                # 页面
│   │   ├── index/           # 首页
│   │   ├── dice-game/       # 摇骰子游戏
│   │   ├── spy-game/        # 谁是卧底游戏
│   │   ├── room/            # 游戏房间
│   │   └── profile/         # 我的页面
│   ├── stores/              # Pinia 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   └── static/              # 静态资源
│
├── casual_games_backend/     # 后端 Cloudflare Workers
│   ├── src/
│   │   ├── routes/          # 路由处理
│   │   │   ├── user.ts      # 用户相关
│   │   │   ├── room.ts      # 房间相关
│   │   │   └── game.ts      # 游戏相关
│   │   ├── types/           # 类型定义
│   │   ├── utils/           # 工具函数
│   │   └── index.ts         # 入口文件
│   ├── schema.sql           # 数据库表结构
│   └── wrangler.toml        # Cloudflare 配置
│
└── ui 图/                    # UI 设计稿

```

## 🚀 快速开始

### 前置要求

- Node.js >= 20
- npm >= 10
- Cloudflare 账号（免费）

### 1. 克隆项目

```bash
git clone https://github.com/zle0328/casual_games.git
cd casual_games
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd casual_games_uniapp
npm install

# 安装后端依赖
cd ../casual_games_backend
npm install
```

### 3. 配置后端（Cloudflare）

#### 3.1 安装 Wrangler CLI

```bash
npm install -g wrangler
```

#### 3.2 登录 Cloudflare

```bash
wrangler login
```

#### 3.3 创建 D1 数据库

```bash
cd casual_games_backend
wrangler d1 create casual-games-db
```

复制输出的 `database_id`，填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "casual-games-db"
database_id = "your-database-id-here"  # 替换这里
```

#### 3.4 创建 KV 命名空间（词条库）

```bash
wrangler kv:namespace create KV
wrangler kv:namespace create KV --preview
```

复制输出的 `id` 和 `preview_id`，填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-id-here"          # 替换这里
preview_id = "your-preview-id"   # 替换这里
```

#### 3.5 初始化数据库

```bash
# 本地开发环境
npm run db:local

# 生产环境（部署后）
npm run db:init
```

### 4. 启动开发

#### 4.1 启动后端（Cloudflare Workers 本地调试）

```bash
cd casual_games_backend
npm run dev
```

后端将运行在 `http://localhost:8787`

#### 4.2 启动前端（H5）

在新终端：

```bash
cd casual_games_uniapp
npm run dev
```

前端将运行在 `http://localhost:5173`

打开浏览器访问 `http://localhost:5173` 即可看到 H5 页面。

### 5. 部署

#### 5.1 部署后端到 Cloudflare Workers

```bash
cd casual_games_backend
npm run deploy
```

部署成功后会得到一个 Workers URL，例如：`https://casual-games-backend.your-subdomain.workers.dev`

#### 5.2 配置前端 API 地址

在 `casual_games_uniapp` 目录创建 `.env.production`：

```bash
VITE_API_BASE_URL=https://casual-games-backend.your-subdomain.workers.dev
```

#### 5.3 部署前端到 Cloudflare Pages

方式一：通过 GitHub 自动部署（推荐）

1. 提交代码到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Pages > Create a project > Connect to Git
4. 选择仓库 `casual_games`
5. 配置构建：
   - Build command: `cd casual_games_uniapp && npm install && npm run build:h5`
   - Build output directory: `casual_games_uniapp/dist/build/h5`
6. 点击 Deploy

方式二：通过 Wrangler CLI 手动部署

```bash
cd casual_games
npm run deploy:pages
```

## 📱 微信小程序支持

### 开发微信小程序

```bash
cd casual_games_uniapp
npm run dev:mp-weixin
```

使用微信开发者工具打开 `casual_games_uniapp/dist/dev/mp-weixin` 目录。

### 构建微信小程序

```bash
npm run build:mp-weixin
```

构建产物在 `casual_games_uniapp/dist/build/mp-weixin`。

### 注意事项

1. 需要在微信公众平台配置服务器域名（request 合法域名）
2. 将 Cloudflare Workers 的域名添加到白名单

## 🔧 开发指南

### API 接口文档

#### 用户相关

- `POST /api/user` - 创建/获取用户
- `GET /api/user/:userId` - 获取用户信息
- `GET /api/user/:userId/records` - 获取游戏记录

#### 房间相关

- `POST /api/room` - 创建房间
- `POST /api/room/join` - 加入房间
- `GET /api/room/:roomCode` - 获取房间信息
- `POST /api/room/start` - 开始游戏

#### 游戏相关

- `POST /api/game/result` - 保存游戏结果
- `GET /api/game/spy-words` - 获取谁是卧底词条
- `POST /api/game/spy-roles` - 分配谁是卧底角色

### 环境变量

#### 前端（.env）

```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:8787

# 生产环境（.env.production）
VITE_API_BASE_URL=https://your-workers-url.workers.dev
```

#### 后端（wrangler.toml）

已配置在 `wrangler.toml` 中，无需额外环境变量。

## 📊 数据库表结构

### users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 用户ID（主键）|
| nickname | TEXT | 昵称 |
| avatar | TEXT | 头像URL |
| total_games | INTEGER | 总游戏次数 |
| dice_games | INTEGER | 摇骰子次数 |
| spy_games | INTEGER | 谁是卧底次数 |
| spy_wins | INTEGER | 谁是卧底胜利次数 |

### rooms（房间表）

| 字段 | 类型 | 说明 |
|------|------|------|
| room_code | TEXT | 房间码（主键）|
| game_type | TEXT | 游戏类型 |
| creator_id | TEXT | 创建者ID |
| status | TEXT | 房间状态 |
| settings | TEXT | 游戏设置（JSON）|

### room_players（房间玩家表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 自增ID |
| room_code | TEXT | 房间码 |
| user_id | TEXT | 用户ID |
| role | TEXT | 角色（谁是卧底）|
| is_alive | INTEGER | 是否存活 |

### game_records（游戏记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 记录ID |
| room_code | TEXT | 房间码 |
| user_id | TEXT | 用户ID |
| game_type | TEXT | 游戏类型 |
| result | TEXT | 游戏结果 |
| details | TEXT | 详情（JSON）|

## 💰 成本估算

使用 Cloudflare 免费计划完全够用（日活 < 1000）：

- ✅ **Pages**: 无限静态请求
- ✅ **Workers**: 100,000 请求/天
- ✅ **D1**: 500 万行读取/天，10 万行写入/天
- ✅ **KV**: 100,000 读取/天，1000 写入/天

如需实时联机功能（WebSocket），需升级到 Workers Paid 计划（$5/月）使用 Durable Objects。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

## 📞 联系方式

- GitHub: https://github.com/zle0328/casual_games
- Issues: https://github.com/zle0328/casual_games/issues
