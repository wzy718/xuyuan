# 开发指南

## 环境搭建

### 系统要求
- Node.js >= 16.0.0
- npm >= 7.0.0
- 微信开发者工具（最新版）

### 安装步骤

```bash
# 1. 克隆项目
git clone [repository-url]
cd xyd

# 2. 安装依赖
npm install

# 3. 安装Taro CLI
npm install -g @tarojs/cli

# 4. 检查环境
taro info

# 5. React Native额外配置
# iOS
cd ios && pod install

# Android - 配置gradle.properties加速
echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m" >> android/gradle.properties
```

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