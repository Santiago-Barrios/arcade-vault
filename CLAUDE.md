# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — an online arcade platform where users play games and compete on points. Currently a fresh, unmodified `create-next-app` scaffold (App Router, `app/page.tsx`, `app/layout.tsx`); no custom features implemented yet.

## Commands

- `npm run dev` — start dev server (also regenerates `AGENTS.md`, see below)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)

No test runner is configured yet.

## Next.js version

This repo pins `next@16.3.4`, which is newer than the training data of most models and has breaking changes vs. familiar Next.js APIs. Before writing App Router code, consult `node_modules/next/dist/docs/01-app/` (resolve the path relative to this file's directory — in a monorepo the `next` package may not be visible from the repo root). Docs are split into `01-getting-started`, `02-guides`, `03-api-reference`.

## Workflow: Spec Driven Design

This project follows spec-driven development using the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills. Install with:

```bash
npx skills@latest add Klerith/fernando-skills
```

Expect features to be defined as specs before implementation.
