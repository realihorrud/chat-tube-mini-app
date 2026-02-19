# Copilot Instructions for Telegram Mini App

## Project Overview

This is a **Telegram Mini App (TMA)** built with React, TypeScript, and Vite. It runs inside the Telegram client and integrates with the Telegram platform via `@tma.js/sdk-react`.

## Tech Stack

- **Framework**: React 18 (functional components with hooks)
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite with SWC (`@vitejs/plugin-react-swc`)
- **TMA SDK**: `@tma.js/sdk-react` v3 — Telegram Mini Apps SDK
- **UI Library**: `@telegram-apps/telegram-ui` v2
- **Routing**: `react-router-dom` v6 with `HashRouter`
- **Blockchain**: `@tonconnect/ui-react` for TON wallet integration
- **Linting**: ESLint with `typescript-eslint` (type-checked) + React/React Hooks plugins

## Path Aliases

Use `@/` to reference files inside `src/`:

```ts
import { Page } from '@/components/Page';
```

Configured in `tsconfig.json` (`paths`) and resolved by `vite-tsconfig-paths`.

## Architecture & Patterns

### Component Structure

- Components live in `src/components/` — each in its own file or folder.
- Pages live in `src/pages/` — each page is a route target.
- Use **functional components** with hooks. Class components only when required (e.g., `ErrorBoundary`).
- Wrap page content with the `<Page>` component to get automatic back-button integration.

### TMA SDK Usage

- SDK initialization happens in `src/init.ts` — do not initialize SDK elsewhere.
- Use hooks from `@tma.js/sdk-react` (e.g., `useLaunchParams()`, `useSignal()`).
- Access TMA components via SDK imports: `backButton`, `miniApp`, `themeParams`, `viewport`, `initData`.
- Theme and viewport CSS variables are bound automatically via `bindCssVars()`.

### Routing

- Routes are defined in `src/navigation/routes.tsx` as an array of `{ path, Component, title?, icon? }`.
- Uses `HashRouter` — all routes are hash-based (required for TMA).
- Unknown routes redirect to `/`.

### Styling

- Follow **BEM methodology** using the helper in `src/css/bem.ts`.
- Use `bem('block-name')` which returns `[blockClassName, elementClassName]` functions.
- Use the `classnames()` utility from `src/css/classnames.ts` for conditional class composition.
- Leverage Telegram UI's `AppRoot` for theming — appearance is `dark` or `light` based on `miniApp.isDark` signal.

### Error Handling

- Use `ErrorBoundary` component to wrap sections that may fail.
- `EnvUnsupported` component handles graceful degradation for unsupported Telegram clients.

## Code Style

- **TypeScript strict mode** — no implicit `any`, no unused locals/parameters.
- Prefer `type` over `interface` for object shapes unless extending is needed.
- Use named exports (not default exports).
- Keep components small and focused — extract logic into custom hooks when appropriate.
- ESLint rule: `@typescript-eslint/no-unused-expressions` is disabled.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run dev:https` | Start dev server with HTTPS |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to GitHub Pages |

## Important Notes

- The app must run inside Telegram — it uses `retrieveLaunchParams()` to detect the environment.
- Debug mode (`eruda`) is enabled for development builds.
- Platform detection (`ios` vs `base`) affects UI rendering via `@telegram-apps/telegram-ui`.
- Build target is `esnext` with `terser` minification.
