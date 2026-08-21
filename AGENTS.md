<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Setup

- Next.js 16.3.0 App Router, React 19, TypeScript (strict), Tailwind CSS v4. Online-study-platform frontend.
- Package manager is **pnpm** (11.9.0, `pnpm-lock.yaml`). Use `pnpm` — not npm/yarn, despite the README listing all of them.
- `.env` is gitignored; dev requires `NEXT_PUBLIC_API_URL` set (copy the local `.env` if it goes missing).

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build (also runs type checking)
- `pnpm start` — `next start`; the Docker production stage is what runs `node server.js` from `.next/standalone`
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`); standalone typecheck: `pnpm exec tsc --noEmit`
- **No test framework is installed.** Do not run or add test commands without installing one.

## Architecture

- No `src/` dir: app code lives in `app/` (`app/layout.tsx` is the root layout, `app/page.tsx` the home page). Path alias `@/*` maps to the repo root.
- State: Redux Toolkit + redux-persist. Store is `lib/store/index.ts` (persist whitelist `["auth"]`, SSR-safe noop storage); slices in `lib/features/` (`authSlice.ts` today). `ReduxProvider` wraps the root layout. Shared state goes through slices, not component-local state.
- React Query is already mounted in `app/layout.tsx` via `components/providers/query-provider.tsx`; app hooks live in `hooks/` and API functions in `services/api/`.
- API layer: use the single axios instance in `services/axios.ts`. It strips a trailing `/api` from `NEXT_PUBLIC_API_URL`, sends cookies with `withCredentials: true`, attaches the persisted bearer token, refreshes via `/auth/refresh` with a retry queue, and redirects to `/signin` on refresh failure. Do not use raw axios for backend calls.
- `api-calls.md` is **stale**: it references Vite/TanStack Query/manga-app details that do not match this frontend. Do not use it as an endpoint source of truth.
- shadcn stack is Base UI, not Radix: `components.json` uses style `base-maia`, `@base-ui/react` primitives, and Hugeicons. Adding components via the shadcn CLI pulls from that registry; don't assume default Radix-based shadcn output.

## Conventions

- Tailwind v4 uses CSS-first config: no `tailwind.config.*` — theme tokens go in `@theme` in `app/globals.css`.
- No CI or git hooks in this repo yet.
- `CLAUDE.md` only contains `@AGENTS.md` — keep guidance here, not there.

## Deploy / Build Quirks

- `next.config.ts` sets `output: "standalone"`, so `next build` also emits `.next/standalone`.
- Deployment is Docker-based: the multi-stage `Dockerfile` (deps → dev → build → production) is the production path; the production stage runs `node server.js` from `.next/standalone` with `.next/static` and `public` copied separately.
- `pnpm-workspace.yaml` sets `allowBuilds: { sharp: false, unrs-resolver: false }` — pnpm blocks dependency postinstall scripts by default. Any new dependency with a build script needs an `allowBuilds` entry to build its native bindings.
