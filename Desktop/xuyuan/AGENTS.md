# Repository Guidelines

## 项目结构与模块组织
- `prd/`：产品需求文档（当前以 `prd/prd.md` 为主），任何需求变更先更新这里，便于评审与追踪。
- `demo/`：网页 Demo/原型资源（目前为空）。建议按页面或功能拆分目录，并保持可直接打开或可一键启动。
- `public/`、`src/`：如后续引入前端工程，建议遵循 Next.js App Router 结构：`src/app/`（路由）、`src/components/`（共享组件）、`src/app/globals.css`（全局样式）、`public/`（静态资源）。

## 构建、测试与本地开发命令
当前仓库以文档为主；如新增 Node/Next.js 工程，请在对应目录提供并维护以下脚本：
- `npm install`：安装依赖。
- `npm run dev`：本地开发（建议默认端口 `3000`）。
- `npm run build`：生产构建。
- `npm run start`：运行生产构建产物。
- `npm run lint`：运行 `next lint`/ESLint（提交前必跑）。

## 编码风格与命名约定
- 统一使用 TypeScript（`.ts/.tsx`），函数式组件优先；缩进 2 空格。
- 路由目录使用小写、URL 友好命名（示例：`src/app/privacy/page.tsx`）。
- 组件文件用 PascalCase（示例：`src/components/Navigation.tsx`）。
- 样式优先使用 Tailwind 工具类（若引入），避免无必要的自定义 CSS。
- 文档与代码注释必须使用中文。

## 测试指南
当前暂无测试框架。若引入测试，请将用例放在 `src/__tests__/` 或 `*.test.ts(x)`，并提供 `npm test` 脚本；至少保证核心路径（如 `/`、`/product`、`/terms`、`/privacy`）的基本覆盖与可回归。

## 提交与 PR 规范
- 提交信息遵循 Conventional Commits：`feat: ...`、`fix: ...`、`docs: ...`、`refactor: ...`。
- PR 需包含：变更摘要、关联 issue（如有）、UI 变更截图/录屏、风险与回滚说明（如涉及线上行为）。

## 安全与配置提示
- 机密信息放入 `*.env.local` 并通过 `process.env` 读取，禁止提交到仓库。
- 若新增部署步骤或第三方脚本依赖，请同步更新部署说明文档（如 `DEPLOYMENT.md`）。

## Agent 协作约定
- 每次编辑文件前，用中文简要说明“为什么改、改什么”，便于审阅与对齐预期。

