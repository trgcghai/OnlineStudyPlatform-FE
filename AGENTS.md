<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Setup

- Next.js 16.3.0 App Router, React 19, strict TypeScript, Tailwind CSS v4.
- Use `pnpm` 11.9.0 (`packageManager` and `pnpm-lock.yaml`); ignore README examples for npm/yarn/bun.
- `NEXT_PUBLIC_API_URL` is required by `services/axios.ts`; it strips a trailing `/api` before making backend calls.

## Commands

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev`
- Lint: `pnpm lint` (flat ESLint config in `eslint.config.mjs`)
- Typecheck: `pnpm exec tsc --noEmit`
- Production build: `pnpm build` (also emits standalone output)
- Start built app locally: `pnpm start`; Docker production runs `node server.js` from `.next/standalone` instead.
- No test script or test framework is configured in `package.json`; do not invent test commands.
- Pre-commit runs `pnpm lint-staged`; staged JS/TS/TSX files get `eslint --fix` then `prettier --write`.

## Architecture

- No `src/` directory. App Router files live under `app/`; `@/*` maps to the repo root.
- Route groups split public, auth, and RBAC areas: `app/(public)`, `app/(auth)`, `app/(admin)`, `app/(instructor)`, `app/(learner)`. Admin/instructor/learner layouts wrap pages with `AuthGuard` and role constants from `services/api/users.ts`.
- Root providers are wired in `app/layout.tsx`: `ThemeProvider` -> `ReduxProvider` -> `QueryProvider` -> `TooltipProvider` plus `Toaster`.
- Client auth state is Redux Toolkit + redux-persist in `lib/store/index.ts`; only `auth` is persisted and SSR uses a noop storage.
- Server state uses TanStack Query. Hooks live in `hooks/`; typed backend functions live in `services/api/`.
- Use the shared `axiosClient` from `services/axios.ts` for backend calls. It sends cookies, attaches the persisted bearer token, queues refreshes through `/auth/refresh`, and redirects to `/signin` on refresh failure.
- `api-calls.md` documents another Vite/manga project and is stale for this frontend; do not use it as endpoint truth.

## UI And Styling

- Tailwind v4 is CSS-first: there is no `tailwind.config.*`; tokens belong in `@theme` in `app/globals.css`.
- shadcn is configured for Base UI, not Radix: `components.json` uses style `base-maia`, `@base-ui/react`, and Hugeicons.

## Build And Deploy

- `next.config.ts` sets `output: "standalone"`; Docker copies `.next/standalone`, `.next/static`, and `public` into the production image.
- `pnpm-workspace.yaml` blocks dependency build scripts by default via `allowBuilds` (`sharp: false`, `unrs-resolver: false`). New dependencies with native/build steps may need this file updated.
- No CI workflows are present. `CLAUDE.md` only points to `AGENTS.md`; keep repo guidance here.
