# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault is an online platform for playing games and competing for the highest score. The repo is currently a fresh Create Next App scaffold (`app/layout.tsx`, `app/page.tsx` are still the template defaults).

Development follows **Spec Driven Design** using the `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills), installed with:

```bash
npx skills@latest add Klerith/fernando-skills
```

Write a spec before implementing a feature, then implement from it.

## Commands

```bash
npm run dev      # next dev (Turbopack); also regenerates the Next.js block in AGENTS.md
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint (flat config: next core-web-vitals + typescript)
npx tsc --noEmit # type-check
```

No test framework is configured yet.

## Stack and non-default configuration

- **Next.js 16.4 (App Router) + React 19.3 + TypeScript (strict)**. APIs differ from older Next.js — consult `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`) before writing Next.js code.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching` (Cache Components / PPR model: dynamic data must be inside `<Suspense>` or explicitly cached with `"use cache"`), plus `experimental.agentFeedback`.
- **Tailwind CSS v4** is wired through a Turbopack loader rule (`@tailwindcss/turbopack` on `*.css` in `next.config.ts`), not PostCSS — there is no `postcss.config` or `tailwind.config`. Theme tokens live in `app/globals.css` via `@import "tailwindcss"` and `@theme inline`.
- Route prop types use Next's generated global helpers (e.g. `LayoutProps<"/">`, `PageProps<...>`) rather than hand-written prop interfaces.
- Path alias: `@/*` maps to the repo root.

## Skills
Usa siempre /frontend-design para diseñar la interfaz de usuario.
