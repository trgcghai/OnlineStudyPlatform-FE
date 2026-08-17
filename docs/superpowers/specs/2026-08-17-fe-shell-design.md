# FE Shell — layouts + placeholder pages (T0-04 leftover)

**Date:** 2026-08-17
**Task:** T0-04 (leftover acceptance criteria: role-based layouts + root pages, empty-state placeholders)
**Repo:** onlinestudyplatform-fe (feature branch `feature/t0-04-fe-shell`)

## Goal

Finish T0-04's two remaining acceptance criteria: per-role layouts (auth/learner/instructor/admin) and root pages (`/`, `/signin`, `/register`, `/courses`, `/instructor/*`, `/admin/*`) as empty-state placeholders — Vietnamese UI, Tailwind v4, no guards.

## Context

- Next.js 16.3.0 App Router, React 19, TS strict, Tailwind v4 (CSS-first, `@theme` in `app/globals.css`). No `src/` dir — routes in `app/`. Path alias `@/*` → repo root. Package manager pnpm.
- `app/page.tsx` is still the default create-next-app/Vercel landing page (to be replaced).
- Root `app/layout.tsx` already wires `ReduxProvider` + `TooltipProvider`; metadata still default ("Create Next App").
- API layer: single axios client `services/axios.ts` (done); 401 interceptor redirects to `/signin`.
- `authSlice` tracks only `isAuthenticated` — no role/user data yet, so **no route guards** in this task (they arrive with T0-05/T0-06).
- BE has **no auth endpoints yet** (T0-05/06 are future cards) — auth pages are pure placeholders, no forms wiring.
- shadcn stack is **Base UI** (components.json `base-maia`), icons from `@hugeicons/react`. ~30 primitives in `components/ui/` (card, button, separator, …).
- FE has **no test framework installed** (per AGENTS.md: do not add tests without installing one) → Global DoD's automated-test items do not apply; verification is lint + build + manual smoke.
- `api-calls.md` at repo root is **stale** (describes a different stack) — ignore it.

## Design

### Routes (route groups for shared layouts, no guards, no nav lists)

| Route | File | Layout group | Page content |
|---|---|---|---|
| `/` | `app/page.tsx` (replace) | root layout | Vietnamese hero + 2 CTAs |
| `/signin` | `app/(auth)/signin/page.tsx` | `(auth)` | Empty-state placeholder |
| `/register` | `app/(auth)/register/page.tsx` | `(auth)` | Empty-state placeholder |
| `/courses` | `app/(learner)/courses/page.tsx` | `(learner)` | Empty-state placeholder |
| `/instructor/courses` | `app/(instructor)/instructor/courses/page.tsx` | `(instructor)` | Empty-state placeholder |
| `/admin/users` | `app/(admin)/admin/users/page.tsx` | `(admin)` | Empty-state placeholder |

Notes:
- Route groups `(auth)`, `(learner)`, `(instructor)`, `(admin)` do **not** affect URLs — only provide layouts.
- `/signin` + `/register` match the existing 401-interceptor redirect (`redirect('/signin')` in services/axios.ts) — no client changes.
- `/courses` sits under the learner group (catalog = learner journey; guests may visit — bare wrapper, no guard).
- `/admin/users` matches the nearest pending card (T0-08 admin user management); `/instructor/courses` matches T0-09+ course work (T1-01).

### Layouts (bare wrappers — user choice)

Each group layout: header with the **area label** (Vietnamese) + centered children. No nav lists, no guards:

- `(auth)` — label approx. "Đăng nhập / Đăng ký"
- `(learner)` — label "Người học"
- `(instructor)` — label "Giảng viên" (note: label must not be confused with a nav; keep a single line)
- `(admin)` — label "Quản trị viên"

Minimal shape (shared styling per group, adjusted label):

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-sm font-medium text-foreground">Đăng nhập / Đăng ký</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">{children}</main>
    </div>
  );
}
```

(Header layout exactly as above or equivalent Tailwind; no extra features.)

### Landing page (replace `app/page.tsx`)

Vietnamese hero, CTAs link to `/courses` and `/signin`. Use `next/link` — Button may be used if `components/ui/button.tsx` supports an `asChild`/render-prop API (verify first; fallback to Link with button-like classes). No Vercel template remnants (`/next.svg`, `/vercel.svg` links removed).

```tsx
<section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
  <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
    Nền tảng học trực tuyến thông minh
  </h1>
  <p className="mt-4 max-w-xl text-lg text-muted-foreground">
    Khám phá các khóa học trực tuyến với hỗ trợ AI cá nhân hóa lộ trình của bạn.
  </p>
  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
    <Link href="/courses" className="...">Khám phá khóa học</Link>
    <Link href="/signin" className="...">Đăng nhập</Link>
  </div>
</section>
```

(Class styling at the implementer's discretion per Tailwind v4 + existing primitives.)

### Shared empty-state component

New `components/empty-state.tsx` — one clearly-responsible component reused by all 5 placeholder pages:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Tính năng đang được phát triển.
        </p>
      </CardContent>
    </Card>
  );
}
```

(Verify the exact exported names of `card.tsx` in this repo before writing — base-maia variant may differ; adjust imports to what exists.)

### Metadata

Root `app/layout.tsx` metadata → `title: "LMS – Nền tảng học trực tuyến"`-style Vietnamese title + short Vietnamese description. No per-page metadata needed (YAGNI).

### Conventions / acceptance

- UI strings **Vietnamese** (global DoD; landing hero, area labels, empty-state texts).
- Tailwind v4 classes + existing `components/ui` primitives only; no new dependencies.
- No route guards, no nav lists, no forms, no data fetching, no new state — scope is placeholders only.
- No test framework installed → verification: `pnpm lint` (exit 0), `pnpm build` green (standalone output produced), manual `pnpm dev` smoke: visit `/`, `/signin`, `/register`, `/courses`, `/instructor/courses`, `/admin/users` — each renders its placeholder/label without errors; 404 for unknown routes still default.

## Out of scope

- Login/register forms & BE wiring (T0-05/T0-06).
- Role data in `authSlice`, route guards, role-based nav (future cards).
- Instructor/admin dashboards with data (T2-03/T2-04).
- Tests (no framework installed — per FE AGENTS.md).