# 快速开始指南

## 前置要求

- Node.js 16+ 
- MySQL 5.7+ 或 8.0+
- Redis 6.0+
- 微信小程序 AppID 和 Secret
- DeepSeek API Key

## 5分钟快速启动

### 步骤1：克隆项目并安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 步骤2：配置后端

```bash
cd backend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，至少配置以下内容：
# - DB_PASSWORD（数据库密码）
# - WECHAT_APPID（微信小程序AppID）
# - WECHAT_SECRET（微信小程序Secret）
# - DEEPSEEK_API_KEY（DeepSeek API密钥）
# - JWT_SECRET（JWT密钥，建议使用强随机字符串）
```

### 步骤3：初始化数据库

```bash
# 确保MySQL已启动
# 创建数据库（如果不存在）
mysql -u root -p
CREATE DATABASE baibai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# 运行初始化脚本
npm run init-db
```

### 步骤4：启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

后端服务将在 `http://localhost:3000` 启动

### 步骤5：配置前端

```bash
cd ../frontend

# 编辑 config/dev.js，确保 API_BASE_URL 指向后端地址
# API_BASE_URL: '"http://localhost:3000/api"'

# 编辑 project.config.json，填入你的微信小程序 AppID
```

### 步骤6：启动前端开发

```bash
# 启动微信小程序开发模式
npm run dev:weapp
```

在微信开发者工具中打开 `frontend/dist` 目录

## 验证安装

### 1. 检查后端健康状态

```bash
curl http://localhost:3000/health
```

应该返回：
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. 测试数据库连接

后端启动日志应该显示：
```
✅ MySQL连接成功
✅ Redis连接成功
🚀 服务器运行在 http://localhost:3000
```

### 3. 测试前端

在微信开发者工具中：
1. 点击"登录"按钮
2. 输入愿望内容
3. 点击"开始分析"

## 常见问题

### Q: 数据库连接失败

**A:** 检查以下几点：
1. MySQL服务是否启动：`sudo systemctl status mysql`
2. 数据库用户和密码是否正确
3. 数据库是否已创建：`mysql -u root -p -e "SHOW DATABASES;"`

### Q: Redis连接失败

**A:** 
1. 检查Redis服务：`sudo systemctl status redis`
2. 如果Redis设置了密码，在 `.env` 中配置 `REDIS_PASSWORD`
3. 开发环境可以暂时注释掉Redis相关代码

### Q: 微信登录失败

**A:**
1. 确认 `WECHAT_APPID` 和 `WECHAT_SECRET` 配置正确
2. 检查小程序是否已发布（开发环境可以使用测试号）
3. 确认后端服务可以访问外网（需要调用微信API）

### Q: DeepSeek API调用失败

**A:**
1. 确认 `DEEPSEEK_API_KEY` 配置正确
2. 检查API余额是否充足
3. 查看后端日志了解具体错误信息

### Q: 前端无法连接后端

**A:**
1. 确认后端服务已启动
2. 检查 `config/dev.js` 中的 `API_BASE_URL` 配置
3. 在微信开发者工具中，设置 -> 项目设置 -> 不校验合法域名（开发环境）

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
