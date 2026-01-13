# 部署文档

## 纯云开发部署（推荐）

### 1. 准备工作

- 在微信公众平台开通云开发并创建云环境
- 在云开发控制台为云函数配置环境变量：
  - `DEEPSEEK_API_KEY`
  - （可选）`DEEPSEEK_API_URL`
- 在 `frontend/config/dev.js`、`frontend/config/prod.js` 配置 `CLOUD_ENV_ID`

### 2. 部署云函数

在微信开发者工具中：
1. 导入项目目录：`frontend/`
2. 右键 `cloudfunctions/api` → 上传并部署（安装依赖）

### 3. 部署小程序前端

```bash
cd frontend
npm install
npm run build:weapp
```

在微信开发者工具中点击“上传”，并在微信公众平台提交审核发布。

### 4. 数据库

本项目使用云数据库集合：
- `users`
- `wishes`
- `analyses`
- `orders`
- `unlock_logs`

集合会在云函数首次写入时自动创建；如需权限策略，请在云开发控制台配置数据库权限（建议默认仅云函数可写）。

### 5. 支付说明

当前仓库内 `payment.create` 返回的是模拟支付参数，用于联调 UI。正式接入微信支付需：
- 配置商户信息
- 生成真实的支付参数（统一下单/JSAPI）
- 处理支付回调并做幂等更新订单状态

---

## 旧版：自建后端部署（不再作为默认方案）

> 以下内容保留用于对照和历史方案，纯云开发不需要自建服务器/MySQL/Redis。

## 后端部署

### 1. 服务器准备

- 操作系统：Linux (Ubuntu 20.04+ 推荐)
- Node.js：v16+ 
- MySQL：5.7+ 或 8.0+
- Redis：6.0+

### 2. 安装依赖

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL
sudo apt-get install mysql-server

# 安装 Redis
sudo apt-get install redis-server
```

### 3. 配置数据库

```bash
# 登录 MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE baibai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'baibai_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON baibai_db.* TO 'baibai_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 部署代码

```bash
# 克隆代码
git clone <your-repo-url>
cd xuyuan/backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置文件

# 初始化数据库
npm run init-db
```

### 5. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/index.js --name baibai-api

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs baibai-api
```

### 6. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## 前端部署

### 1. 构建小程序

```bash
cd frontend
npm install
npm run build:weapp
```

### 2. 上传到微信

1. 打开微信开发者工具
2. 导入项目，选择 `frontend/dist` 目录
3. 配置 AppID
4. 点击"上传"按钮
5. 在微信公众平台提交审核

### 3. 配置服务器域名

在微信公众平台配置：
- request合法域名：`https://your-api-domain.com`
- uploadFile合法域名：`https://your-api-domain.com`
- downloadFile合法域名：`https://your-api-domain.com`

## 环境变量配置

### 生产环境 .env

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=baibai_user
DB_PASSWORD=your_strong_password
DB_NAME=baibai_db

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

WECHAT_APPID=your_production_appid
WECHAT_SECRET=your_production_secret

JWT_SECRET=your_very_strong_jwt_secret_key
JWT_EXPIRE=2h
REFRESH_TOKEN_EXPIRE=7d

DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

WECHAT_PAY_MCHID=your_mchid
WECHAT_PAY_KEY=your_pay_key
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/payment/callback
```

## 监控和日志

### PM2 监控

```bash
# 查看实时日志
pm2 logs baibai-api

# 查看监控面板
pm2 monit

# 重启服务
pm2 restart baibai-api

# 停止服务
pm2 stop baibai-api
```

### 日志管理

建议使用日志管理工具（如 logrotate）定期清理日志文件。

## 备份

### 数据库备份

```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u baibai_user -p baibai_db > /backup/baibai_db_$DATE.sql

# 添加到 crontab（每天凌晨2点备份）
0 2 * * * /path/to/backup.sh
```

## 安全建议

1. **防火墙配置**：只开放必要端口（80, 443, 22）
2. **SSL/TLS**：强制使用 HTTPS
3. **密钥管理**：使用密钥管理服务（如 AWS KMS、阿里云 KMS）
4. **定期更新**：及时更新系统和依赖包
5. **访问控制**：限制数据库和Redis的访问IP
6. **监控告警**：配置异常监控和告警

## 故障排查

### 服务无法启动

1. 检查端口是否被占用：`lsof -i :3000`
2. 检查环境变量是否正确
3. 查看日志：`pm2 logs baibai-api`

### 数据库连接失败

1. 检查MySQL服务是否运行：`sudo systemctl status mysql`
2. 检查用户权限
3. 检查防火墙规则

### Redis连接失败

1. 检查Redis服务：`sudo systemctl status redis`
2. 检查密码配置
3. 检查网络连接
