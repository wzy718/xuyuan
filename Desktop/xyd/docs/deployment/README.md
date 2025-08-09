# 部署发布指南

## 构建配置

### 环境变量
```javascript
// config/dev.js - 开发环境
module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    API_BASE_URL: '"http://localhost:3000/api"'
  }
}

// config/prod.js - 生产环境
module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    API_BASE_URL: '"https://api.xyd-app.com/api"'
  }
}
```

## 微信小程序发布

### 1. 构建准备
```bash
# 安装依赖
npm install

# 构建小程序
npm run build:weapp
```

### 2. 配置检查
- 确认 `project.config.json` 中的 appid
- 检查域名白名单配置
- 验证分包大小（主包<2MB，总包<20MB）
- 注意：分包数量限制为20个
- 单个分包大小<2MB
- 订阅消息（替代模板消息）：
  - 配置并校验订阅消息模板 ID（至少在测试号/正式号后台完成配置）
  - 真机验证 `Taro.requestSubscribeMessage` 授权弹窗及回调
  - 审核前准备：在体验版完成一次完整订阅→触达链路自测

### 3. 上传代码
1. 打开微信开发者工具
2. 导入 `dist` 目录
3. 点击"上传"按钮
4. 填写版本号和备注

### 4. 提交审核
- 登录[微信公众平台](https://mp.weixin.qq.com)
- 版本管理 → 提交审核
- 填写审核信息
- 等待审核（1-7天）

### 5. 发布上线
- 审核通过后发布
- 灰度发布（可选）
- 全量发布

## H5 部署

### 1. 构建
```bash
npm run build:h5
```

### 2. 部署方案

#### Nginx配置
```nginx
server {
    listen 80;
    server_name xyd-app.com;
    
    root /var/www/xyd/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3000;
    }
}
```

#### CDN部署
1. 上传到OSS/COS
2. 配置CDN加速
3. 设置缓存策略

## iOS/Android 发布

### iOS (App Store)

#### 1. 构建
```bash
npm run build:rn
cd ios
pod install
```

#### 2. 打包
1. Xcode打开项目
2. 选择 Generic iOS Device
3. Product → Archive
4. 上传到App Store Connect

#### 3. 发布
1. 填写应用信息
2. 上传截图
3. 提交审核
4. 发布

### Android (应用市场)

#### 1. 构建
```bash
npm run build:rn
cd android
./gradlew assembleRelease
```

#### 2. 签名
```bash
jarsigner -verbose -sigalg SHA1withRSA \
  -digestalg SHA1 -keystore my-release-key.keystore \
  app-release-unsigned.apk myalias
```

#### 3. 发布
- 华为应用市场
- 小米应用商店
- OPPO软件商店
- Google Play

### React Native监控配置

#### Sentry集成
```typescript
// 安装
npm install @sentry/react-native

// 配置 App.tsx
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
      tracingOrigins: ['localhost', /^https:\/\/yourapp\.com\/api/],
    }),
  ],
})

// 包装根组件
export default Sentry.wrap(App)
```

#### 符号表上传
```bash
# iOS sourcemaps
npx sentry-cli react-native xcode \
  --force-foreground \
  upload-sourcemaps

# Android sourcemaps
npx sentry-cli react-native gradle \
  --bundle app/build/generated/assets/react/release/index.android.bundle \
  --sourcemap app/build/generated/sourcemaps/react/release/index.android.bundle.map
```

#### 错误边界
```typescript
// ErrorBoundary.tsx
import * as Sentry from '@sentry/react-native'

class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } }
    })
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackComponent />
    }
    return this.props.children
  }
}

## CI/CD 配置

### GitHub Actions
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build:weapp
      - run: npm run build:h5
```

## 监控与维护

### 错误监控
- Sentry 错误追踪
- 自定义错误上报

### 性能监控
- 页面加载时间
- API响应时间
- 资源加载监控

### 日志系统
```typescript
class Logger {
  log(level: string, message: string, extra?: any) {
    if (process.env.NODE_ENV === 'production') {
      // 上报到日志服务器
      reportToServer({ level, message, extra })
    }
    console.log(`[${level}] ${message}`, extra)
  }
}
```

## 版本管理

### 版本号规范
- 主版本号.次版本号.修订号
- 例: 1.2.3

### 更新策略
- 强制更新: 重大bug修复
- 建议更新: 新功能发布
- 静默更新: 小优化

## 备份与恢复

### 数据备份
- 定期数据库备份
- 用户数据导出
- 配置文件备份

### 灾难恢复
- 服务降级方案
- 数据恢复流程
- 应急响应机制

## 相关文档
- [环境配置](./environment.md)
- [发布流程](./release-process.md)
- [运维手册](./operations.md)