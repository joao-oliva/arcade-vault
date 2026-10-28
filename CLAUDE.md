# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault is an online platform for playing games and competing for the highest score. It is currently a fresh `create-next-app` scaffold (only `app/layout.tsx` and `app/page.tsx` exist). Development follows Spec Driven Design using the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills (install with `npx skills@latest add Klerith/fernando-skills`).

## Commands

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build (also performs type checking)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

No test framework is configured yet.

## Stack and non-obvious configuration

- **Next.js 16.4 / React 19.3, App Router only** (`app/`). This Next version has breaking changes relative to older knowledge — consult `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, etc.) before using any Next API.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `experimental.agentFeedback`. With Cache Components on, data fetching/caching semantics differ from classic Next (dynamic by default, opt into caching explicitly) — check the docs before writing data-loading code.
- **Tailwind CSS v4** is wired through a custom Turbopack rule (`@tailwindcss/turbopack` loader on `*.css`), not PostCSS. There is no `tailwind.config.*`; theme tokens live in `app/globals.css` via `@import "tailwindcss"` and `@theme inline`.
- Route props use Next's generated global types (e.g. `LayoutProps<"/">`, `PageProps<...>`) rather than hand-written prop interfaces.
- Path alias `@/*` maps to the repo root.
- TypeScript is `strict`.

## Skills
Usa siempre > /frontend-design para diseñar la interfaz de usuario