# Repository Guidelines（仓库指南）

## 项目结构与模块组织
- 应用代码位于 `src/app/`，使用 Next.js App Router（例如 `src/app/page.tsx`、`src/app/product/page.tsx`）。
- 共享 UI 组件放在 `src/components/`。
- 全局样式在 `src/app/globals.css`；静态资源放在 `public/`。
- 法务文案更新请限定在 `src/app/terms/` 与 `src/app/privacy/`，便于审阅与回溯。
- 测试（如有）放在 `src/__tests__/`，或与实现同目录的 `*.test.ts(x)`。

## 构建、测试与本地开发命令
- `npm install`：安装/同步依赖。
- `npm run dev`：启动开发服务器（Turbopack），默认 `http://localhost:3000`。
- `npm run build`：构建生产产物。
- `npm run start`：启动生产服务（基于构建产物）。
- `npm run lint`：运行 `next lint`（提交 PR 前必须通过）。

## 代码风格与命名约定
- 优先使用 TypeScript：`.ts`/`.tsx`；React 组件优先函数式写法。
- 缩进：2 空格；JSX 保持简洁清晰。
- 样式：优先使用 Tailwind 工具类，尽量避免新增自定义 CSS。
- 命名：组件使用 PascalCase（如 `Navigation.tsx`）；路由目录使用小写、URL 友好（如 `privacy/page.tsx`）。
- ESLint：在现有 flat config 基础上扩展，不要新增旧式 `.eslintrc*`。
- 强制中文文档与注释：面向用户/维护者的文档与代码注释请使用中文。

## 测试指南
- 当前不强制要求自动化测试；若引入 Vitest/Playwright，请同时增加 `npm test` 脚本，并将测试放入 `src/__tests__/`（或 `*.test.tsx`）。
- 至少执行 `npm run lint`，并手动验证关键路由：`/`、`/product`、`/terms`、`/privacy`（含浅色/深色主题）。

## 提交与 PR 规范
- Commit message 遵循 Conventional Commits（例如 `feat: …`、`docs: …`、`refactor: …`）。
- PR 需要包含：变更摘要（强调用户影响）、关联 issue 链接、UI 变更的截图/录屏，并明确后续待办事项。

## 安全与配置提示
- 不要提交任何密钥；使用 `*.env.local` 并通过 `process.env` 读取。
- 如部署步骤有变化，请同步更新 `DEPLOYMENT.md`。

## Agent 专用说明
- 使用中文沟通；每次编辑文件之前，用中文简要说明更改原因与目的。
- 每次遇到问题时候，先记录问题，找到问题根因和解决方案，记录成文档，保存为“0125 XXX问题描述.md”保存到/Users/wangzheyi/Desktop/识别器/docs/待解决问题
