<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project setup

- Next.js 16.3.0 App Router, React 19, TypeScript (strict), Tailwind CSS v4.
- Package manager is **pnpm** (11.9.0, `pnpm-lock.yaml`). Use `pnpm` — not npm/yarn, despite the README listing all of them.

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build (also runs type checking)
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`)
- Typecheck standalone: `npx tsc --noEmit`
- **No test framework is installed.** Do not run or add test commands without installing one.

## Conventions

- No `src/` dir: app code lives in `app/` (`app/layout.tsx` is the root layout, `app/page.tsx` the home page). Path alias `@/*` maps to the repo root.
- Tailwind v4 uses CSS-first config: there is no `tailwind.config.*` — theme tokens go in `@theme` in `app/globals.css`.
- No CI or git hooks in this repo yet.
- `CLAUDE.md` only contains `@AGENTS.md` — keep guidance here, not there.

## Deploy / build quirks

- `next.config.ts` sets `output: "standalone"`, so `next build` also emits `.next/standalone`; `pnpm start` runs the standalone server (`node server.js`).
- Deployment is Docker-based: the multi-stage `Dockerfile` (deps → dev → build → production) is the production path; the production stage runs `node server.js` from `.next/standalone` with `.next/static` and `public` copied separately.
- `pnpm-workspace.yaml` sets `allowBuilds: { sharp: false, unrs-resolver: false }` — pnpm blocks dependency postinstall scripts by default. Any new dependency with a build script needs an `allowBuilds` entry to build its native bindings.
