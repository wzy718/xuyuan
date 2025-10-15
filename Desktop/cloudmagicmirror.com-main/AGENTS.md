# Repository Guidelines
使用中文

## Project Structure & Module Organization
Application code lives in `src/app`, following the Next.js App Router (e.g., `src/app/page.tsx`, `src/app/product/page.tsx`). Shared UI resides in `src/components`, global styles in `src/app/globals.css`, and static assets in `public/`. Keep legal copy updates scoped to the `terms` and `privacy` route folders to simplify review.

## Build, Test, and Development Commands
Run `npm install` to sync dependencies. `npm run dev` launches the Turbopack dev server on port 3000, `npm run build` compiles for production, and `npm run start` serves the build. Always run `npm run lint` before submitting changes to catch TypeScript and accessibility issues enforced by `next lint`.

## Coding Style & Naming Conventions
- Write components in TypeScript (`.tsx`) and prefer functional components. Use two-space indentation, concise JSX, and Tailwind utility classes instead of custom CSS when practical. Name components in PascalCase (`Navigation.tsx`) and routes with lower-case, URL-friendly folders (`privacy/page.tsx`). Extend the existing ESLint flat config rather than introducing legacy `.eslintrc` files.
- 强制中文文档与注释

## Testing Guidelines
No automated test suite exists yet; ship new features with matching coverage. Store tests under `src/__tests__` or colocated `*.test.tsx` files, and add an `npm test` script if you introduce Vitest or Playwright. At minimum, run `npm run lint` and exercise the key routes (`/`, `/product`, `/terms`, `/privacy`) in light and dark themes before opening a pull request.

## Commit & Pull Request Guidelines
Follow the Conventional Commit pattern in history (`feat: …`, `docs: …`, `refactor: …`). Keep subject lines succinct; bodies may be in English or Chinese but must state user impact. For pull requests, provide a summary, link relevant issues, and attach screenshots or clips for UI updates. Note required follow-up work so maintainers can plan releases confidently.

## Security & Configuration Tips
Secrets (API keys, analytics tokens) belong in `*.env.local` files referenced via `process.env`; never commit them. Document config changes in `DEPLOYMENT.md` if deployment steps change. When adding third-party scripts or fonts, prefer Next.js `next/script` and host assets in `public/` to avoid unexpected network dependencies.

## 沟通
- 使用中文
- 每次编辑文件之前用中文简要说明更改的原因和目的
