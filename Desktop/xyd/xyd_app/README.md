# XYD App

一个基于Flutter开发的跨平台移动应用，支持iOS和Android平台。

## 项目结构

```
xyd_app/
├── lib/                    # Dart源代码目录
│   └── main.dart          # 应用主入口文件
├── ios/                   # iOS平台相关文件
├── android/               # Android平台相关文件
├── test/                  # 测试文件目录
├── pubspec.yaml           # 项目依赖配置
└── README.md              # 项目说明文档
```

## 开发环境要求

- Flutter SDK 3.6.1+
- Dart SDK
- Xcode (用于iOS开发)
- Android Studio (用于Android开发，可选)

## 运行项目

### iOS平台
```bash
# 在iOS模拟器上运行
flutter run -d "iPhone 16 Pro"

# 在真机上运行
flutter run -d "王哲一的iPhone"
```

### Android平台
```bash
# 在Android模拟器上运行
flutter run -d android

# 在真机上运行
flutter run
```

### Web平台
```bash
flutter run -d chrome
```

## 构建发布版本

### iOS
```bash
flutter build ios
```

### Android
```bash
flutter build apk
```

## 项目特性

- 跨平台支持 (iOS/Android)
- Material Design 3 主题
- 热重载开发体验
- 响应式UI设计

## 开发指南

1. 确保Flutter环境已正确配置
2. 运行 `flutter doctor` 检查环境状态
3. 使用 `flutter pub get` 安装依赖
4. 使用 `flutter run` 启动开发服务器

## 注意事项

- 项目使用Flutter 3.27.3版本
- 支持iOS 18.4+和Android API 21+
- 使用Material 3设计语言
