# CLAUDE.md - AI助手指南

总是使用中文回复，每次回复前说：好的，一哥

## 项目概述

**小约定 App (XYD App)** - 基于 Taro + React 的跨平台应用，MVP支持微信小程序、H5、React Native。
帮助用户将口头约定转化为结构化、可追踪的承诺，特色是关系型UI/UX设计体系。

- **当前版本**: 1.0.0
- **主技术栈**: Taro 3.6 + React 18 + TypeScript + MobX
- **支持平台**: 
  - 微信小程序（主入口）
  - H5 Web
  - React Native（iOS/Android）
- **项目结构**: 
  - `/src` - Taro源码（小程序/H5）
  - `/ios` - iOS原生工程（RN）
  - `/android` - Android原生工程（RN）

## 快速参考

### 📚 详细文档

- [开发指南](./docs/development/README.md) - 环境搭建、开发命令、调试技巧
- [架构设计](./docs/architecture/README.md) - 项目结构、技术选型、设计模式
- [功能特性](./docs/features/README.md) - 核心功能、关系主题、AI集成
- [部署发布](./docs/deployment/README.md) - 构建配置、发布流程、运维指南
- [最佳实践](./docs/best-practices/README.md) - 代码规范、性能优化、组件设计
- [Design Token](./docs/design-tokens.md) - 统一设计变量系统

### ⚡ 统一命令矩阵

```bash
# 开发命令
npm run dev:weapp    # 微信小程序开发
npm run dev:h5       # H5浏览器开发
npm run dev:rn       # React Native开发

# 构建命令
npm run build:weapp  # 构建微信小程序
npm run build:h5     # 构建H5
npm run build:rn     # 构建React Native

# 代码质量
npm run lint         # ESLint检查
npm run lint:fix     # 自动修复
npm run format       # Prettier格式化
npm run test         # 运行测试
npm run test:coverage # 测试覆盖率
```

### 🏗️ RN端首次运行

```bash
# iOS (需要Mac环境)
cd ios && pod install
npm run dev:rn
# 在另一个终端
npx react-native run-ios

# Android
npm run dev:rn
# 在另一个终端
npx react-native run-android
```

### 🎯 核心原则

1. **Design Token驱动** - 统一设计变量，分端映射实现
2. **跨端一致性** - 体验统一，技术分端优化
3. **AI智能降级** - 小程序云函数/H5服务端/RN暂不做端侧
4. **隐私优先** - 本地存储为主，云端同步为辅
5. **性能优先** - 分端优化策略，确保60fps

### 📦 技术栈矩阵

| 功能 | 微信小程序/H5 | React Native |
|-----|-------------|--------------|
| UI组件库 | NutUI React | React Native Paper |
| 导航 | Taro Router | React Navigation |
| 状态管理 | MobX | MobX |
| 长列表 | VirtualList | FlashList |
| 存储 | Taro Storage | MMKV |
| 动画 | CSS/Taro | Reanimated 3 |
| 图片缓存 | 默认 | FastImage |
| 权限 | Taro API | RN Permissions |

### 🚀 当前任务

查看 [开发计划](./docs/development/roadmap.md) 了解项目进度和待办事项。

---
*更多详情请查看相关文档*