# 拜拜小程序

基于架构设计和PRD实现的完整微信小程序应用，包含前端小程序和后端API服务。

## 项目结构

```
xuyuan/
├── backend/          # 后端API服务
│   ├── src/         # 源代码
│   │   ├── db/      # 数据库相关
│   │   ├── middleware/  # 中间件
│   │   ├── routes/  # 路由
│   │   ├── services/  # 服务层
│   │   └── utils/   # 工具函数
│   ├── scripts/     # 脚本
│   └── package.json
├── frontend/        # 前端小程序（Taro）
│   ├── src/         # 源代码
│   │   ├── pages/   # 页面
│   │   ├── components/  # 组件
│   │   ├── utils/   # 工具函数
│   │   └── store/   # 状态管理
│   ├── config/      # 配置文件
│   └── package.json
├── prd/             # 产品需求文档
└── demo/            # Demo文件
```

## 技术栈

### 后端
- Node.js + Express
- MySQL（数据存储）
- Redis（缓存和限流）
- JWT（认证）
- DeepSeek API（AI分析）

### 前端
- Taro 3.x（跨端框架）
- React + TypeScript
- Zustand（状态管理）

## 快速开始

### 1. 后端设置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置

# 初始化数据库
npm run init-db

# 启动开发服务器
npm run dev
```

### 2. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置API地址
# 编辑 config/dev.js 和 config/prod.js 中的 API_BASE_URL

# 启动开发（微信小程序）
npm run dev:weapp
```

### 3. 微信小程序配置

1. 在微信公众平台注册小程序，获取 AppID
2. 在 `frontend/project.config.json` 中填入 AppID
3. 在 `backend/.env` 中配置微信相关参数：
   - `WECHAT_APPID`
   - `WECHAT_SECRET`

### 4. DeepSeek API 配置

在 `backend/.env` 中配置：
- `DEEPSEEK_API_KEY`

## 环境变量说明

### 后端 (.env)

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=baibai_db

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 微信小程序配置
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=2h
REFRESH_TOKEN_EXPIRE=7d

# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

## 核心功能

### 1. 用户认证
- 微信登录（code2session）
- JWT token认证
- Token刷新机制

### 2. 愿望分析
- 调用DeepSeek API分析愿望
- 识别缺失要素和潜在原因
- 提供优化建议

### 3. 解锁功能
- 看广告解锁
- 分享解锁
- 风控机制

### 4. TODO管理
- 愿望列表CRUD
- 标记成功/失败
- 结构化字段记录

### 5. 支付功能
- 1元代许愿
- 微信支付集成
- 支付回调处理

## API接口

### 认证相关
- `POST /api/auth/login` - 微信登录
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/profile` - 获取用户信息

### 愿望分析
- `POST /api/wish/analyze` - 分析愿望
- `POST /api/wish/optimize` - AI优化愿望

### TODO管理
- `GET /api/todos` - 获取愿望列表
- `POST /api/todos` - 新增愿望
- `PUT /api/todos/:id` - 更新愿望
- `DELETE /api/todos/:id` - 删除愿望

### 解锁
- `POST /api/unlock/ad` - 看广告解锁
- `POST /api/unlock/share` - 分享解锁
- `GET /api/unlock/status` - 查询解锁状态

### 支付
- `POST /api/payment/create` - 创建支付订单
- `POST /api/payment/callback` - 支付回调

## 数据库表结构

- `users` - 用户表
- `wishes` - 愿望表
- `analyses` - 分析记录表
- `orders` - 订单表
- `user_sessions` - 用户会话表

详细表结构见 `backend/scripts/init-db.js`

## 安全措施

1. **API Key保护**：DeepSeek API Key仅在后端使用
2. **内容安全**：输入和输出内容审核
3. **限流保护**：用户级别和IP级别限流
4. **Token安全**：JWT签名验证，短过期时间
5. **解锁风控**：设备指纹、行为序列、频控

## 开发注意事项

1. **环境变量**：生产环境必须使用强密码和密钥
2. **数据库**：生产环境使用云数据库，启用SSL
3. **Redis**：生产环境配置密码
4. **微信支付**：需要配置商户号和支付密钥
5. **内容安全**：建议启用微信内容安全API

## 部署

### 后端部署

1. 使用PM2或类似工具管理进程
2. 配置Nginx反向代理
3. 使用云数据库和Redis
4. 配置HTTPS

### 前端部署

1. 使用Taro构建小程序
2. 在微信开发者工具中上传代码
3. 提交审核

## 许可证

MIT
