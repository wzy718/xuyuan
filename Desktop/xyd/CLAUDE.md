# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
总是使用中文回复
每次回复前说：好的，一哥

## 项目概述

"小约定 App" (XYD App) 是一个基于 Flutter 的跨平台移动应用，帮助用户将口头约定转化为结构化、可追踪的承诺。核心特色是关系型UI/UX设计体系，为不同关系类型（情侣、亲子、健身伙伴、读书会等）提供专属的视觉主题和交互体验。

## 项目状态

- **当前阶段**: MVP开发初期（项目刚初始化）
- **版本号**: 1.0.0+1
- **代码状态**: 仅有Flutter默认计数器示例，核心功能待实现

## 技术栈

- **框架**: Flutter 3.27.3，Dart SDK ^3.6.1
- **UI设计**: Material Design 3 + 关系型主题系统
- **支持平台**: iOS、Android、Web、Linux、macOS、Windows
- **AI集成**: 阿里千问 0.6B 量化模型（强制部署，约600MB）
- **状态管理**: BLoC模式（待实现）
- **架构模式**: Clean Architecture（待实现）
- **后端服务**: Firebase 或 腾讯云/阿里云
- **本地存储**: SQLite（主存储）+ Hive（缓存）
- **代码规范**: flutter_lints ^5.0.0

## 开发命令

### 环境设置
```bash
# 安装依赖
flutter pub get

# 检查Flutter环境
flutter doctor

# 升级依赖包
flutter pub upgrade --major-versions
```

### 运行应用
```bash
# iOS模拟器
flutter run -d "iPhone 16 Pro"

# iOS真机
flutter run -d "王哲一的iPhone"

# Android
flutter run -d android

# Web浏览器
flutter run -d chrome

# 带热重载运行（默认）
flutter run
```

### 构建发布版
```bash
# iOS发布版
flutter build ios

# Android APK
flutter build apk

# Android App Bundle
flutter build appbundle

# Web版本
flutter build web
```

### 代码质量
```bash
# 静态代码分析
flutter analyze

# 运行测试
flutter test

# 运行特定测试
flutter test test/widget_test.dart
```

## 项目架构

### 当前结构
```
xyd/
├── CLAUDE.md              # 项目AI助手指南
├── prd/                   # 产品需求文档
│   ├── prd.md            # MVP需求文档
│   ├── design.md         # 设计总览
│   └── design_detail/    # 详细设计文档
│       ├── 01_功能架构.md
│       ├── 02_约定状态管理.md
│       ├── 03_通知系统.md
│       ├── 04_信誉系统.md
│       ├── 05_数据同步机制.md
│       ├── 06_AI集成方案.md
│       └── 07_关系型约定设计体系.md
└── xyd_app/              # Flutter项目主目录
    ├── lib/              # Dart源代码
    │   └── main.dart     # 应用入口
    ├── test/             # 测试文件
    ├── ios/              # iOS平台代码
    ├── android/          # Android平台代码
    └── pubspec.yaml      # 项目配置
```

### 规划的架构（Clean Architecture + BLoC）
```
lib/
├── core/                 # 核心功能
│   ├── themes/          # 关系型主题系统
│   ├── constants/       # 常量定义
│   ├── utils/           # 工具类
│   └── services/        # 核心服务
├── features/            # 功能模块
│   ├── commitment/      # 约定管理
│   ├── relationship/    # 关系管理
│   ├── notification/    # 通知系统
│   ├── ai_assistant/    # AI辅助
│   └── user/           # 用户管理
└── shared/             # 共享组件
    ├── widgets/        # 通用组件
    ├── models/         # 数据模型
    └── repositories/   # 数据仓库
```

## 核心功能（MVP范围）

### 1. 关系型约定系统
- **多关系支持**: 情侣、亲子、健身伙伴、读书会等
- **专属UI主题**: 每种关系类型有独特的视觉语言和交互模式
- **智能识别**: AI自动识别关系类型并推荐合适主题

### 2. 约定生命周期管理
- **7种状态**: 草稿→待确认→进行中→暂停→完成/失败/终止
- **双模式**: 软提醒模式 vs 硬执行模式（需要上传凭证）
- **见证人系统**: 1-3位见证人验证完成情况

### 3. AI辅助功能（强制）
- **模型**: 阿里千问0.6B量化版（INT8）
- **功能**: 自然语言转结构化约定、智能模板推荐、关系类型识别
- **部署**: 首次启动强制下载，本地持久化存储

### 4. 数据同步机制
- **离线优先**: 本地SQLite为主，云端同步为辅
- **冲突解决**: 版本向量时钟算法
- **增量同步**: 仅同步变更数据

## 关系型UI/UX设计体系

### 主题示例

#### 亲子关系 - "成长花园"
- **色调**: 温暖粉色、淡黄、薄荷绿
- **元素**: 成长树、勋章墙、时光相册
- **交互**: 语音鼓励、涂鸦互动、虚拟宠物

#### 情侣关系 - "爱的时光机"
- **色调**: 浪漫紫、玫瑰金、樱花粉
- **元素**: 爱心能量条、时光轴、情侣相册
- **交互**: 每日签到、惊喜约定、爱的密语

#### 健身伙伴 - "能量竞技场"
- **色调**: 活力橙、运动蓝、能量绿
- **元素**: 能量环、排行榜、数据图表
- **交互**: 实时PK、成就系统、数据同步

#### 读书会 - "知识星球"
- **色调**: 知性蓝、书卷棕、墨水黑
- **元素**: 3D书架、星座图、笔记本
- **交互**: 共读进度、笔记分享、话题讨论

## 开发指南

### 代码规范
- 遵循 Material Design 3 设计原则
- 使用 Flutter 推荐的 Widget 模式
- 保持跨平台兼容性
- 遵循 flutter_lints 规则

### 重要约束
- **最低版本**: iOS 18.4+, Android API 21+
- **AI模型**: 必须集成，不可降级或跳过
- **数据安全**: 本地优先，隐私保护
- **主题系统**: 支持动态切换和个性化

### 待实现依赖
```yaml
# 需要添加的核心依赖
dependencies:
  flutter_bloc: ^8.1.3        # 状态管理
  dio: ^5.3.2                 # 网络请求
  sqflite: ^2.3.0             # 本地数据库
  hive: ^2.2.3                # 缓存存储
  tflite_flutter: ^0.10.4     # AI模型运行
  go_router: ^12.1.3          # 路由导航
  get_it: ^7.6.4              # 依赖注入
  json_annotation: ^4.8.1     # JSON序列化
  permission_handler: ^11.0.1  # 权限管理
  path_provider: ^2.1.1       # 文件路径
  image_picker: ^1.0.4        # 图片选择
  flutter_local_notifications: ^16.1.0  # 本地通知
  dynamic_color: ^1.6.8       # 动态主题
```

## 产品特色

### 目标用户
- 💕 情侣（主要用户群体）
- 👨‍👩‍👧 亲子家庭
- 🎯 自律提升人群
- 👥 兴趣小组

### 设计原则
1. **情感优先**: 功能服务于情感需求
2. **故事思维**: 每个约定都是关系故事的一部分
3. **适度游戏化**: 激励但不过度娱乐化
4. **隐私保护**: 关系数据绝对私密
5. **简约不简单**: 界面简洁但功能强大

## 开发优先级

### 第一阶段：基础架构
- 搭建Clean Architecture结构
- 实现BLoC状态管理
- 配置路由和依赖注入

### 第二阶段：核心功能
- 约定创建和管理
- 状态流转机制
- 基础UI组件

### 第三阶段：特色功能
- 关系型主题系统
- AI模型集成
- 见证人机制

### 第四阶段：完善体验
- 通知系统
- 数据同步
- 性能优化

## 注意事项

- 项目目前仅有默认模板代码，所有功能待开发
- AI模型集成是强制功能，不可跳过
- 优先考虑用户体验和情感化设计
- 保持代码的可维护性和可测试性

---
*最后更新：2025年8月8日*