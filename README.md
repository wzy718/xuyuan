# 拜拜小程序

基于 PRD 实现的微信小程序应用，当前采用 **微信云开发（CloudBase）**：前端小程序 + 云函数 + 云数据库。

## 项目结构

```
xuyuan/
├── frontend/        # 前端小程序（Taro）
│   ├── src/         # 源代码
│   │   ├── pages/   # 页面
│   │   ├── components/  # 组件
│   │   ├── utils/   # 工具函数
│   │   └── store/   # 状态管理
│   ├── config/      # 配置文件
│   ├── cloudfunctions/  # 云函数（纯云开发）
│   └── package.json
├── backend/          # 旧版：自建后端（Express + MySQL/Redis），纯云开发不再依赖
├── prd/             # 产品需求文档
└── demo/            # Demo文件
```

## 技术栈

### 前端
- Taro 3.x（跨端框架）
- React + TypeScript
- Zustand（状态管理）

### 云开发
- 云函数（统一入口：`frontend/cloudfunctions/api`）
- 云数据库（集合：`users` / `wishes` / `analyses` / `orders` / `unlock_logs`）

### 外部服务
- DeepSeek API（AI 分析与优化，仅在云函数中调用）

## 快速开始

### 1. 前端安装与构建

```bash
cd frontend

# 安装依赖
npm install

# 配置云环境 ID
# 编辑 config/dev.js 和 config/prod.js 中的 CLOUD_ENV_ID

# 启动开发（微信小程序）
npm run dev:weapp
```

### 2. 微信开发者工具配置（云开发）

1. 在微信公众平台注册小程序，获取 AppID，并开通云开发。
2. 用微信开发者工具导入项目目录：`frontend/`（不要导入 `dist/`）。
3. 在 `frontend/project.config.json` 中填入 AppID，并确认已配置 `"cloudfunctionRoot": "cloudfunctions/"`。
4. 在开发者工具中创建云环境，并将环境 ID 填入 `frontend/config/dev.js` 与 `frontend/config/prod.js` 的 `CLOUD_ENV_ID`。
5. 右键云函数 `cloudfunctions/api`，上传并部署（安装依赖）。

### 3. DeepSeek API 配置（云函数环境变量）

在云开发控制台为云函数配置环境变量：
- `DEEPSEEK_API_KEY`
- （可选）`DEEPSEEK_API_URL`

## 说明
- 纯云开发版不需要配置服务器域名（云函数调用走云开发通道），也不需要自建 MySQL/Redis。
- 支付目前保留“模拟参数”用于联调；正式接入微信支付需要补齐商户配置与回调处理。

## 核心功能

### 1. 用户认证
- 基于微信云开发身份（OPENID）
- 前端获取用户资料，云函数写入/更新用户信息

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

## 云函数 action（前端调用）
云函数统一入口为 `frontend/cloudfunctions/api`，通过 `Taro.cloud.callFunction({ name: 'api', data: { action, data } })` 调用。

- `auth.login`
- `wish.analyze` / `wish.optimize`
- `unlock.ad` / `unlock.share` / `unlock.status`
- `todos.list` / `todos.create` / `todos.update` / `todos.delete`
- `payment.create`

## 安全措施

1. **API Key保护**：DeepSeek API Key 仅在云函数中使用，禁止出现在前端
2. **内容安全**：云函数侧进行文本安全审核（含敏感词兜底）
3. **限流保护**：云函数侧按用户维度做简化频控（基于云数据库记录）
4. **解锁风控**：解锁 token 一次性 + 过期时间 + 频控

## 开发注意事项

1. **环境变量**：DeepSeek Key 通过云函数环境变量配置，禁止提交到仓库
2. **数据库权限**：建议默认仅云函数可写，客户端只读或受限读
3. **微信支付**：正式接入需配置商户号并实现回调幂等更新订单状态
4. **内容安全**：建议开通并启用云开发内容安全能力

## 部署

纯云开发部署请参考 `DEPLOYMENT.md`。

## 许可证

MIT
