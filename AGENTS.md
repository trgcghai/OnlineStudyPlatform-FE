<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Setup

- Next.js 16.3.6 App Router, React 19.2.8, strict TypeScript, Tailwind CSS v4.
- Use `pnpm` 11.9.0 from `packageManager`/`pnpm-lock.yaml`; README still shows generic npm/yarn/bun examples.
- Real backend calls need `NEXT_PUBLIC_API_URL`; `services/axios.ts` uses it directly as Axios `baseURL`.
- Optional `NEXT_PUBLIC_ENV` is `development` or `production`; Docker build defaults it to `production`.

## Commands

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev`
- Lint: `pnpm lint` (flat ESLint config in `eslint.config.mjs`)
- Typecheck: `pnpm exec tsc --noEmit`
- Production build: `pnpm build` (also emits standalone output)
- Start built app locally: `pnpm start` (`next start`); Docker production runs `node server.js` from `.next/standalone` instead.
- There is no `test` script or test framework in `package.json`; do not invent test commands.
- Husky `pre-commit` runs `pnpm lint-staged`; staged JS/TS/TSX get `eslint --fix` then `prettier --write`.

## Architecture

- No `src/` directory. App Router files live under `app/`; `@/*` maps to the repo root.
- Route groups split public, auth, and RBAC areas: `app/(public)`, `app/(auth)`, `app/(admin)`, `app/(instructor)`, `app/(learner)`, `app/(learning)`. Admin/instructor/learner/learning layouts wrap pages with `AuthGuard` and `USER_ROLES` from `services/api/users.ts`.
- Root providers are wired in `app/layout.tsx`: `ThemeProvider` -> `ReduxProvider` -> `QueryProvider` -> `NuqsAdapter`, then `NotificationRealtimeListener`, `TooltipProvider`, and `Toaster`.
- Client state is Redux Toolkit + redux-persist in `lib/store/index.ts`; persisted slices are `auth`, `activeLearningLesson`, and `videoPlayback`; SSR uses a noop storage.
- Server state uses TanStack Query. Query keys are centralized in `lib/query-keys.ts`; hooks live in `hooks/`; typed backend functions live in `services/api/`.
- Use the shared `axiosClient` from `services/axios.ts` for backend calls. It sends cookies, attaches the persisted bearer token, queues refreshes through `/auth/refresh`, and redirects to `/signin` on refresh failure.
- `api-calls.md` documents another Vite/manga project and is stale for this frontend; do not use it as endpoint truth.

## UI And Styling

- Tailwind v4 is CSS-first: there is no `tailwind.config.*`; tokens belong in `@theme` in `app/globals.css`.
- shadcn is configured for Base UI, not Radix: `components.json` uses style `base-maia`, `@base-ui/react`, and Hugeicons.

## Build And Deploy

- `next.config.ts` sets `output: "standalone"`; Docker copies `.next/standalone`, `.next/static`, and `public` into the production image.
- Docker uses `node:22-alpine`; production starts the standalone server with `node server.js`.
- Next image config whitelists Unsplash, `http://localhost:9000/**`, and `https://vietqr.app/**`, with local IP images allowed.
- `pnpm-workspace.yaml` blocks dependency build scripts via `allowBuilds` (`sharp: false`, `unrs-resolver: false`); native/build-step dependencies may need this file updated.
- No CI workflows are present. `CLAUDE.md` only points to `AGENTS.md`; keep repo guidance here.
