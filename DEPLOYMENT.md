# 部署到 Cloudflare Pages 指南

本指南将帮助您将网站部署到 cloudmagicmirror.com 域名。

## 🚀 方法一：Cloudflare Pages（推荐）

### 步骤 1：推送代码到 GitHub

1. 在 GitHub 上创建一个新仓库
2. 将本地代码推送到 GitHub：

```bash
# 添加远程仓库（替换为您的 GitHub 仓库地址）
git remote add origin https://github.com/yourusername/your-repo-name.git

# 推送代码
git branch -M main
git push -u origin main
```

### 步骤 2：在 Cloudflare 中设置 Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择您的域名 `cloudmagicmirror.com`
3. 在左侧菜单中点击 "Pages"
4. 点击 "Create a project"
5. 选择 "Connect to Git"
6. 授权 Cloudflare 访问您的 GitHub 账户
7. 选择您刚创建的仓库

### 步骤 3：配置构建设置

在 Cloudflare Pages 设置页面中：

- **Project name**: `cloudmagicmirror-website`
- **Production branch**: `main`
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (如果代码在根目录)

### 步骤 4：环境变量（如果需要）

如果您的应用需要环境变量，在 "Environment variables" 部分添加：

```
NODE_VERSION=18
```

### 步骤 5：部署

1. 点击 "Save and Deploy"
2. Cloudflare 将自动构建和部署您的网站
3. 部署完成后，您会得到一个 `.pages.dev` 的临时域名

### 步骤 6：配置自定义域名

1. 在 Pages 项目设置中，点击 "Custom domains"
2. 点击 "Set up a custom domain"
3. 输入 `cloudmagicmirror.com`
4. Cloudflare 会自动配置 DNS 记录

## 🔧 方法二：使用 Cloudflare Workers Sites

如果您想要更多控制，可以使用 Workers Sites：

### 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 登录 Cloudflare

```bash
wrangler login
```

### 创建 wrangler.toml 配置文件

```toml
name = "cloudmagicmirror-website"
compatibility_date = "2024-07-17"

[site]
bucket = ".next"
entry-point = "workers-site"

[env.production]
route = "cloudmagicmirror.com/*"
zone_id = "your-zone-id"
```

### 部署

```bash
npm run build
wrangler publish
```

## 📋 部署前检查清单

- [ ] 代码已推送到 Git 仓库
- [ ] 构建命令测试成功 (`npm run build`)
- [ ] 所有页面路由正常工作
- [ ] 响应式设计在不同设备上测试通过
- [ ] SEO 元数据已正确设置

## 🔍 故障排除

### 构建失败

如果构建失败，检查：
1. Node.js 版本是否兼容（推荐 18+）
2. 依赖是否正确安装
3. 环境变量是否正确设置

### 路由问题

确保在 Cloudflare Pages 设置中：
- 启用了 "Single Page Application" 模式
- 或者配置了正确的重定向规则

### 性能优化

部署后可以在 Cloudflare 中启用：
- Auto Minify (CSS, JS, HTML)
- Brotli 压缩
- Browser Cache TTL
- Always Online

## 📞 需要帮助？

如果在部署过程中遇到问题，请检查：
1. Cloudflare Pages 文档
2. Next.js 部署指南
3. 或联系技术支持

## 🎉 部署完成后

部署成功后，您的网站将在以下地址可用：
- 主域名: https://cloudmagicmirror.com
- 备用域名: https://your-project.pages.dev

记得测试所有页面和功能是否正常工作！
