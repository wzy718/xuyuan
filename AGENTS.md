# Repository Guidelines

## 项目结构与模块组织
- `prd/`：产品需求文档（以 `prd/prd.md` 为入口），需求变更先更新 PRD，便于评审与追踪。
- `frontend/`：微信小程序前端（Taro + React + TypeScript）。
- `frontend/cloudfunctions/`：微信云开发云函数（当前使用 `cloudfunctions/api` 作为统一入口）。
- `backend/`：旧版自建后端（Express + MySQL/Redis），纯云开发模式不再作为默认依赖。
- `demo/`：Demo/原型资源（目前为空），建议按页面或功能拆分目录并保持可直接打开或可一键启动。

## 构建、测试与本地开发命令
### 前端（`frontend/`）
- `npm install`：安装依赖。
- `npm run dev:weapp`：本地开发（微信小程序）。
- `npm run build:weapp`：构建微信小程序产物。
- `npm run lint`：ESLint（提交前必跑）。

### 云函数（`frontend/cloudfunctions/`）
- 在微信开发者工具中右键云函数目录上传并部署（安装依赖）。

### 旧版后端（`backend/`，可选）
- `npm install`：安装依赖。
- `npm run dev`：本地开发（默认端口 `3000`）。
- `npm run start`：启动服务。
- `npm run init-db`：初始化 MySQL 表结构。
- `npm run lint`：ESLint（提交前必跑）。

## 编码风格与命名约定
- 前端统一使用 TypeScript（`.ts/.tsx`），函数式组件优先；缩进 2 空格。
- 后端当前为 Node.js（`.js`），保持现有风格与结构，不在无需求时做大规模 TS 迁移。
- 样式以现有 SCSS 为主，避免无必要的全局样式污染。
- 文档与代码注释必须使用中文。

## 测试指南
当前暂无测试框架。若引入测试：
- 后端建议使用 `*.test.js`/`*.test.ts`（并提供 `npm test` 脚本）。
- 前端建议覆盖核心路径与流程：分析、解锁、TODO、新增愿望、支付弹窗等关键交互。

## 提交与 PR 规范
- 提交信息遵循 Conventional Commits：`feat: ...`、`fix: ...`、`docs: ...`、`refactor: ...`。
- PR 需包含：变更摘要、关联 issue（如有）、UI 变更截图/录屏、风险与回滚说明（如涉及线上行为）。

## 安全与配置提示
- 机密信息放入云函数环境变量/构建期常量并通过 `process.env`/编译期常量读取，禁止提交到仓库。
- 若新增部署步骤或第三方脚本依赖，请同步更新部署说明文档（如 `DEPLOYMENT.md`）。

## Agent 协作约定
- 每次编辑文件前，用中文简要说明“为什么改、改什么”，便于审阅与对齐预期。
