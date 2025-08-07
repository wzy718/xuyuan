# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
总是使用中文回复
每次回复前说：好的，一哥

## Project Overview

This is "小约定 App" (XYD App), a Flutter-based cross-platform mobile application that helps users track and execute informal commitments. The app supports iOS, Android, and web platforms with a focus on relationship trust-building through structured commitment tracking.

## Technology Stack

- **Framework**: Flutter 3.27.3 with Dart SDK ^3.6.1
- **UI**: Material Design 3 (Material 3)
- **Platforms**: iOS, Android, Web, Linux, macOS, Windows
- **AI Integration**: Planned integration with Alibaba's lightweight on-device model (Qwen 0.6b)
- **Backend**: Firebase or Tencent Cloud/Alibaba Cloud (for user accounts and notifications)

## Development Commands

### Setup and Dependencies
```bash
# Install dependencies
flutter pub get

# Check Flutter environment
flutter doctor

# Upgrade dependencies
flutter pub upgrade --major-versions
```

### Running the Application
```bash
# Run on iOS simulator
flutter run -d "iPhone 16 Pro"

# Run on real iOS device
flutter run -d "王哲一的iPhone"

# Run on Android
flutter run -d android

# Run on web
flutter run -d chrome

# Run with hot reload (default)
flutter run
```

### Building for Production
```bash
# Build iOS release
flutter build ios

# Build Android APK
flutter build apk

# Build Android App Bundle
flutter build appbundle

# Build for web
flutter build web
```

### Code Quality and Testing
```bash
# Run static analysis
flutter analyze

# Run tests
flutter test

# Run widget tests specifically
flutter test test/widget_test.dart
```

## Project Structure

- `lib/main.dart` - Main application entry point with Material App setup
- `ios/` - iOS-specific platform code and configurations
- `android/` - Android-specific platform code and configurations
- `web/` - Web platform assets and configuration
- `test/` - Test files including widget tests
- `pubspec.yaml` - Flutter project configuration and dependencies

## Key Features (MVP Scope)

1. **Commitment Creation**: Users can create structured commitments with participants, deadlines, and execution standards
2. **Two Modes**: Soft reminder mode vs. hard execution mode with proof requirements
3. **Witness System**: 1-3 witnesses can be invited to verify commitment completion
4. **Template Support**: Pre-built templates for couples, parent-child, self-discipline, and group commitments
5. **AI Assistance**: On-device AI to help structure natural language into clear commitments

## Development Guidelines

- Follow Material Design 3 principles for UI consistency
- Use Flutter's recommended widget patterns and state management
- Maintain cross-platform compatibility
- The app currently uses the default Flutter counter demo - main features are yet to be implemented
- Support minimum iOS 18.4+ and Android API 21+
- Lint rules are configured via `flutter_lints` package in `analysis_options.yaml`

## Product Context

This is an MVP for a commitment tracking app targeting couples, families, self-improvement users, and social groups. The core value proposition is turning informal verbal agreements into structured, trackable commitments with social accountability mechanisms.