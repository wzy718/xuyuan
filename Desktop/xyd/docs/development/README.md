# 小约定App开发指南

## 📋 项目状态

✅ **P0立即执行任务已完成** (2025-08-09)
- [x] 目录结构补全
- [x] 跨端适配层实现（platform.ts, storage.ts, request.ts）
- [x] Webpack 5构建缓存启用
- [x] RN端基础设施配置（metro.config.js, babel.config.js）
- [x] AI API集成架构（统一后端网关，移除云函数依赖）
- [x] 基础Hooks和TypeScript类型定义

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0
- 微信开发者工具（小程序开发）
- React Native环境（RN开发，可选）

### 依赖安装

**推荐方式（使用安装脚本）：**
```bash
./scripts/install-deps.sh
```

**手动安装：**
```bash
# 1. 修复npm权限（如果遇到权限问题）
sudo chown -R $(whoami) ~/.npm

# 2. 安装依赖
npm install --legacy-peer-deps

# 3. 验证安装
npm run build:h5  # 测试H5构建
```

### 开发命令

```bash
# 微信小程序
npm run dev:weapp    # 开发模式
npm run build:weapp  # 构建

# H5网页  
npm run dev:h5       # 开发模式
npm run build:h5     # 构建

# React Native（可选）
npm run dev:rn       # 开发模式
npm run build:rn     # 构建
```

### 代码质量工具

```bash
npm run lint         # ESLint检查
npm run lint:fix     # 自动修复
npm run format       # Prettier格式化  
npm run test         # 运行测试
npm run test:coverage # 测试覆盖率
```

## 环境搭建

### React Native环境配置

#### Reanimated 3配置
```javascript
// babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // Reanimated必须放在最后
    'react-native-reanimated/plugin',
  ],
}

// metro.config.js
module.exports = {
  resolver: {
    extraNodeModules: {
      'react-native-reanimated': path.resolve(__dirname, 'node_modules/react-native-reanimated'),
    },
  },
}
```

#### iOS配置
```ruby
# ios/Podfile
platform :ios, '12.4'

# 添加Reanimated配置
pod 'RNReanimated', :path => '../node_modules/react-native-reanimated'

# 启用Hermes
:hermes_enabled => true
```

#### Android配置
```gradle
// android/app/build.gradle
android {
  ...
  packagingOptions {
    pickFirst '**/libc++_shared.so'
    pickFirst '**/libjsc.so'
  }
}

// 启用Hermes
project.ext.react = [
  enableHermes: true,
]
```

#### 常见问题修复
```bash
# iOS构建失败
cd ios && pod deintegrate && pod install

# Android构建失败 - 清理缓存
cd android && ./gradlew clean
cd .. && npx react-native start --reset-cache

# Reanimated报错 - 重置Metro
npx react-native start --reset-cache
```

## 开发命令

### 启动开发服务器

```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5

# 支付宝小程序
npm run dev:alipay

# React Native
npm run dev:rn
```

### 构建生产版本

```bash
# 微信小程序
npm run build:weapp

# H5
npm run build:h5

# iOS/Android
npm run build:rn
```

## 调试技巧

### 微信小程序调试
1. 运行 `npm run dev:weapp`
2. 打开微信开发者工具
3. 导入项目，选择 `dist` 目录
4. 使用开发者工具的调试面板

### H5调试
- Chrome DevTools
- React Developer Tools扩展
- Redux DevTools（如使用Redux）

### 跨端兼容性检查

```typescript
// 平台判断
if (process.env.TARO_ENV === 'weapp') {
  // 微信小程序特有逻辑
} else if (process.env.TARO_ENV === 'h5') {
  // H5特有逻辑
}
```

## 代码规范

### TypeScript
- 使用严格模式
- 明确定义接口和类型
- 避免使用 any

### React
- 使用函数组件 + Hooks
- 组件名使用 PascalCase
- 保持组件职责单一

### 样式
- 使用 CSS Modules
- 遵循 BEM 命名规范
- 使用设计变量系统

## 常见问题

### Q: 依赖安装失败
```bash
# 清理缓存重试
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Q: 小程序预览白屏
- 检查 app.config.ts 中的页面路径
- 确认 dist 目录已生成
- 查看控制台错误信息

### Q: 样式不一致
- 使用 Taro 规范的样式单位（px自动转rpx）
- 避免使用平台特有样式
- 使用条件编译处理差异

## 相关文档
- [项目架构](../architecture/README.md)
- [API文档](./api.md)
- [组件文档](./components.md)