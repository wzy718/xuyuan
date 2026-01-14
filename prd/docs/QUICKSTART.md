# 快速开始指南

## 前置要求

- Node.js 16+
- 微信小程序 AppID（已开通云开发）
- DeepSeek API Key

## 5分钟快速启动

### 步骤1：安装前端依赖并启动构建

```bash
cd frontend
npm install

# 启动微信小程序开发模式（持续构建到 dist）
npm run dev:weapp
```

### 步骤2：配置云环境 ID

编辑：
- `frontend/config/dev.js`
- `frontend/config/prod.js`

将 `CLOUD_ENV_ID` 改为你的云环境 ID。

### 步骤3：微信开发者工具导入与云函数部署

1. 打开微信开发者工具，导入项目目录：`frontend/`（不要导入 `dist/`）。
2. 在 `frontend/project.config.json` 中填写 AppID。
3. 创建云环境，并确保环境 ID 与 `CLOUD_ENV_ID` 一致。
4. 右键云函数 `cloudfunctions/api` → 上传并部署（安装依赖）。

### 步骤4：配置云函数环境变量（DeepSeek）

在云开发控制台为云函数配置环境变量：
- `DEEPSEEK_API_KEY`
- （可选）`DEEPSEEK_API_URL`

## 验证安装

### 测试前端

在微信开发者工具中：
1. 点击"登录"按钮
2. 输入愿望内容
3. 点击"开始分析"

## 常见问题

### Q: 云函数调用失败

**A:**
1. 是否已开通云开发并创建环境
2. `CLOUD_ENV_ID` 是否填写正确
3. 云函数 `cloudfunctions/api` 是否已上传并部署（安装依赖）

### Q: DeepSeek API调用失败

**A:**
1. 确认云函数环境变量 `DEEPSEEK_API_KEY` 已配置
2. 检查 API 余额是否充足
3. 查看云函数日志了解具体错误信息

## 下一步

- 阅读 [README.md](./README.md) 了解完整功能
- 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解生产部署
- 查看 [prd/架构设计.md](./prd/架构设计.md) 了解架构细节

## 开发建议

1. **使用Git管理代码**：及时提交，写好commit message
2. **环境隔离**：开发、测试、生产环境使用不同的配置
3. **日志记录**：重要操作记录日志，便于排查问题
4. **错误处理**：前端和后端都要做好错误处理和用户提示
5. **安全第一**：生产环境必须使用强密码和HTTPS
