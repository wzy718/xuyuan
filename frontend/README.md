# 拜拜小程序前端

基于 Taro 3.x + React + TypeScript 开发的微信小程序。

## 目录结构

```
frontend/
├── src/
│   ├── pages/          # 页面
│   │   └── index/     # 主页面
│   ├── components/    # 组件（可选）
│   ├── utils/         # 工具函数
│   │   └── api.ts    # API封装
│   ├── store/         # 状态管理
│   │   └── index.ts  # Zustand store
│   ├── types/         # 类型定义
│   ├── app.tsx        # 应用入口
│   └── app.config.ts  # 应用配置
├── config/            # 构建配置
│   ├── dev.js        # 开发环境
│   ├── prod.js       # 生产环境
│   └── index.js      # 主配置
└── package.json
```

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式（微信小程序）
npm run dev:weapp

# 构建生产版本
npm run build:weapp
```

## 配置

### 1. API地址配置

编辑 `config/dev.js` 和 `config/prod.js`：

```javascript
defineConstants: {
  API_BASE_URL: '"http://localhost:3000/api"'  // 开发环境
  // API_BASE_URL: '"https://your-api-domain.com/api"'  // 生产环境
}
```

### 2. 微信小程序配置

编辑 `project.config.json`：

```json
{
  "appid": "your_wechat_appid"
}
```

## 核心功能

### 1. 用户登录

使用微信登录API，自动获取code并调用后端登录接口。

### 2. 愿望分析

- 输入愿望内容
- 调用后端分析接口
- 显示缺失要素和潜在原因
- 解锁后显示完整分析结果

### 3. TODO管理

- 愿望列表展示
- 新增愿望
- 标记成功/失败
- 成功后触发支付弹窗

### 4. 解锁功能

- 看广告解锁
- 分享解锁
- 解锁状态管理

### 5. 支付功能

- 创建支付订单
- 调起微信支付
- 支付结果处理

## 状态管理

使用 Zustand 进行全局状态管理：

```typescript
import { useAppStore } from '../../store'

const { user, isLoggedIn, setUser } = useAppStore()
```

## API调用

所有API调用都封装在 `src/utils/api.ts` 中：

```typescript
import { wishAPI } from '../../utils/api'

const response = await wishAPI.analyze(wishText, deity, profile)
```

## 开发规范

1. **组件命名**：使用PascalCase
2. **文件命名**：使用kebab-case
3. **类型定义**：统一在 `src/types/index.ts`
4. **样式**：使用SCSS，遵循BEM命名
5. **错误处理**：统一使用Taro.showToast提示

## 构建和发布

### 1. 构建

```bash
npm run build:weapp
```

构建产物在 `dist/` 目录

### 2. 上传

1. 在微信开发者工具中打开 `dist/` 目录
2. 点击"上传"按钮
3. 填写版本号和项目备注

### 3. 提交审核

在微信公众平台提交审核

## 注意事项

1. **域名配置**：生产环境需要在微信公众平台配置服务器域名
2. **HTTPS**：生产环境必须使用HTTPS
3. **代码大小**：小程序代码包不能超过2MB
4. **图片资源**：建议使用CDN或云存储
