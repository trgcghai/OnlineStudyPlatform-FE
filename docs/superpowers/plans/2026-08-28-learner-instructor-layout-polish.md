# Learner And Instructor Layout Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align learner pages with the public header, add role/profile navigation to learner and instructor layouts, and replace table thumbnail background images with `next/image`.

**Architecture:** Extract the existing public header markup into a focused client component, then reuse it from both public and learner shells. Keep learner-specific links outside the shared header so the header remains visually identical. Update instructor top-bar profile display and table thumbnail rendering with minimal changes to existing pages.

**Tech Stack:** Next.js 16.3.0 App Router, React 19, TypeScript, Tailwind CSS v4, Redux auth selectors, shadcn/Base UI components, `next/image`.

---

## File Structure

- Create: `components/layout/public-header.tsx` - shared public-style header used by public and learner layouts.
- Modify: `components/layout/public-shell.tsx` - remove inline header and render `PublicHeader` while preserving footer/content.
- Modify: `app/(learner)/layout.tsx` - use `PublicHeader`, add compact learner navigation strip, keep `AuthGuard`.
- Create: `components/layout/instructor-topbar.tsx` - client top bar that reads Redux user and renders instructor profile actions.
- Modify: `app/(instructor)/layout.tsx` - render `InstructorTopbar` while keeping the route layout focused on shell structure.
- Modify: `app/(instructor)/instructor/courses/page.tsx` - replace thumbnail CSS background with `<Image>`.
- Modify: `app/(admin)/admin/courses/approvals/page.tsx` - replace thumbnail CSS background with `<Image>`.

---

### Task 1: Confirm Local Next And UI Guidance

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn`, `frontend-design`

**Files:**
- Read: `AGENTS.md`
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- Read: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
- Read: `components.json`
- Read: `components/ui/button.tsx`
- Read: `components/ui/sidebar.tsx`

- [ ] **Step 1: Verify branch and frontend status**

Run from `onlinestudyplatform-fe`:

```bash
git branch --show-current
git status --short
```

Expected: branch is not `main`. Existing uncommitted files are noted and not reverted.

- [ ] **Step 2: Read required local Next.js docs before editing**

Read the exact local docs listed in this task under `node_modules/next/dist/docs/`.

Expected: implementer confirms whether `next/image` still uses the same `fill`, `sizes`, and `alt` requirements in this installed Next.js version.

- [ ] **Step 3: Confirm shadcn/Base UI conventions**

Read `components.json`, `components/ui/button.tsx`, and `components/ui/sidebar.tsx`.

Expected: confirm this project uses Base UI `render` patterns and existing semantic Tailwind tokens. No new shadcn components are needed.

- [ ] **Step 4: Check implementation scope against the design spec**

Read:

```text
docs/superpowers/specs/2026-08-28-learner-instructor-layout-polish-design.md
```

Expected: implementation remains frontend-only and does not alter backend APIs or route structure.

---

### Task 2: Extract The Shared Public Header

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn`, `frontend-design`

**Files:**
- Create: `components/layout/public-header.tsx`
- Modify: `components/layout/public-shell.tsx`

- [ ] **Step 1: Create `PublicHeader` with the current public header markup**

Create `components/layout/public-header.tsx` with the header currently embedded in `PublicShell`:

```tsx
"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { CircleUserRound, GraduationCap, LogIn, UserPlus } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { buttonVariants } from "@/components/ui/button";
import { selectAuthUser, selectIsAuthenticated } from "@/lib/features/authSlice";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span>LMS AI</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/courses" className="hover:text-foreground">
              Khóa học
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          {isAuthenticated ? (
            <>
              <NotificationPopover />
              <Link
                href="/profile"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "hidden sm:inline-flex",
                )}
              >
                <CircleUserRound aria-hidden="true" />
                {user?.name ?? "Hồ sơ"}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className={buttonVariants({ variant: "outline" })}
              >
                <LogIn aria-hidden="true" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
              <Link href="/register" className={buttonVariants()}>
                <UserPlus aria-hidden="true" />
                <span className="hidden sm:inline">Tạo tài khoản</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Simplify `PublicShell` to use the shared header**

Replace the imports and component body in `components/layout/public-shell.tsx` so it only owns the shell/footer:

```tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/public-header";

interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />

      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">LMS AI</p>
            <p className="mt-1">
              Nền tảng học trực tuyến thông minh cho người học và giảng viên.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/courses" className="hover:text-foreground">
              Khám phá khóa học
            </Link>
            <Link href="/signin" className="hover:text-foreground">
              Đăng nhập
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Run a focused TypeScript check for import mistakes**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: no TypeScript errors from the extracted header. If unrelated pre-existing errors appear, record them and continue only if they do not come from this task.

- [ ] **Step 4: Check diff for exact header preservation**

Run:

```bash
git diff -- components/layout/public-header.tsx components/layout/public-shell.tsx
```

Expected: public header markup is moved, not redesigned. Footer remains in `PublicShell`.

---

### Task 3: Update Learner Layout To Use Public Header Plus Learner Links

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn`, `frontend-design`

**Files:**
- Modify: `app/(learner)/layout.tsx`

- [ ] **Step 1: Replace the custom learner header**

Update `app/(learner)/layout.tsx` to import `PublicHeader`, remove learner-specific header imports, and keep the `AuthGuard`:

```tsx
import Link from "next/link";
import { BookOpen, CircleUserRound } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PublicHeader } from "@/components/layout/public-header";
import { buttonVariants } from "@/components/ui/button";
import { USER_ROLES } from "@/services/api/users";
import { cn } from "@/lib/utils";

const LEARNER_ROLES = [USER_ROLES.LEARNER] as const;

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={LEARNER_ROLES}>
      <div className="flex min-h-dvh flex-col bg-background">
        <PublicHeader />
        <div className="border-b bg-muted/30">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-6 py-3">
            <Link
              href="/learner/courses"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              <BookOpen data-icon="inline-start" aria-hidden="true" />
              Khóa học của tôi
            </Link>
            <Link
              href="/profile"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <CircleUserRound data-icon="inline-start" aria-hidden="true" />
              Hồ sơ
            </Link>
          </div>
        </div>
        <main className="flex flex-1 justify-center p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Confirm header stays visually identical**

Compare `PublicHeader` usage in public and learner layouts.

Expected: learner layout does not add learner links inside `PublicHeader`; links are in the strip below it.

- [ ] **Step 3: Run TypeScript check**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: no TypeScript errors from `app/(learner)/layout.tsx`.

- [ ] **Step 4: Manual browser verification**

Run the app if needed:

```bash
pnpm dev
```

Expected: a logged-in learner sees the same public header and a compact strip with `Khóa học của tôi` and `Hồ sơ` below it. Public pages remain unchanged.

---

### Task 4: Add Instructor Profile Information To The Layout

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn`, `frontend-design`

**Files:**
- Create: `components/layout/instructor-topbar.tsx`
- Modify: `app/(instructor)/layout.tsx`

- [ ] **Step 1: Create a focused client top bar component**

Create `components/layout/instructor-topbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { CircleUserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { buttonVariants } from "@/components/ui/button";
import { selectAuthUser } from "@/lib/features/authSlice";
import { cn } from "@/lib/utils";

export function InstructorTopbar() {
  const user = useSelector(selectAuthUser);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Instructor console
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              Quản trị hệ thống học tập
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPopover />
          <Link
            href="/instructor/profile"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "max-w-44",
            )}
          >
            <CircleUserRound data-icon="inline-start" aria-hidden="true" />
            <span className="hidden truncate sm:inline">
              {user?.name ?? "Hồ sơ"}
            </span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Replace inline instructor header with `InstructorTopbar`**

Update `app/(instructor)/layout.tsx` so it keeps the shell and delegates the top bar:

```tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { InstructorTopbar } from "@/components/layout/instructor-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { USER_ROLES } from "@/services/api/users";

const INSTRUCTOR_ROLES = [USER_ROLES.INSTRUCTOR] as const;

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={INSTRUCTOR_ROLES}>
      <SidebarProvider className="min-h-full bg-muted/30">
        <InstructorSidebar />
        <SidebarInset className="bg-muted/30">
          <InstructorTopbar />
          <div className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: no TypeScript errors from the instructor layout or `InstructorTopbar`.

- [ ] **Step 4: Manual browser verification**

Run the app if needed:

```bash
pnpm dev
```

Expected: instructor pages keep the sidebar shell and show a profile action beside notifications/logout. On small screens, the icon remains visible and the name can hide.

---

### Task 5: Replace Instructor Course Thumbnail Background With `Image`

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn`

**Files:**
- Modify: `app/(instructor)/instructor/courses/page.tsx`

- [ ] **Step 1: Add `next/image` import**

Add this import near the existing `next/link` import:

```tsx
import Image from "next/image";
```

- [ ] **Step 2: Replace `CourseThumbnail` implementation**

Replace the existing `CourseThumbnail` function with:

```tsx
function CourseThumbnail({ course }: { course: Course }) {
  return (
    <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-xl bg-muted">
      {course.thumbnail ? (
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <ImageIcon
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: no errors from the instructor courses page. If `next/image` rejects remote MinIO URLs during `pnpm build`, inspect `next.config.ts` and add the minimal `remotePatterns` entry for the configured MinIO/public backend image host before rerunning the build.

- [ ] **Step 4: Manual browser verification**

Run the app if needed:

```bash
pnpm dev
```

Expected: instructor course rows display thumbnails with real image elements. Rows without thumbnails still display the fallback icon.

---

### Task 6: Replace Admin Course Approval Thumbnail Background With `Image`

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn`

**Files:**
- Modify: `app/(admin)/admin/courses/approvals/page.tsx`

- [ ] **Step 1: Add `next/image` import**

Add this import near the React import:

```tsx
import Image from "next/image";
```

- [ ] **Step 2: Replace `CourseThumbnail` implementation**

Replace the existing `CourseThumbnail` function with:

```tsx
function CourseThumbnail({ course }: { course: CourseApproval }) {
  return (
    <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-xl bg-muted">
      {course.thumbnail ? (
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: no errors from the admin approvals page.

- [ ] **Step 4: Manual browser verification**

Run the app if needed:

```bash
pnpm dev
```

Expected: admin approval rows display thumbnails with real image elements. Rows without thumbnails still display the fallback icon.

---

### Task 7: Final Formatting And Verification

**Related skills:** `verification-before-completion`, `nextjs`, `vercel-react-best-practices`, `shadcn`

**Files:**
- Verify: all modified frontend files

- [ ] **Step 1: Run lint**

Run from `onlinestudyplatform-fe`:

```bash
pnpm lint
```

Expected: exits 0. Note that this command may auto-fix files according to repo guidance.

- [ ] **Step 2: Run TypeScript check**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Run production build**

Run from `onlinestudyplatform-fe`:

```bash
pnpm build
```

Expected: exits 0.

- [ ] **Step 4: Inspect final diff**

Run from `onlinestudyplatform-fe`:

```bash
git diff -- "components/layout/public-header.tsx" "components/layout/public-shell.tsx" "components/layout/instructor-topbar.tsx" "app/(learner)/layout.tsx" "app/(instructor)/layout.tsx" "app/(instructor)/instructor/courses/page.tsx" "app/(admin)/admin/courses/approvals/page.tsx"
```

Expected: diff only contains the approved layout polish and image-rendering changes. Do not commit unless the user explicitly asks.

- [ ] **Step 5: Manual UI checklist**

Verify in browser:

```text
Public page: header/footer unchanged.
Learner page: public header is identical; learner strip shows Khóa học của tôi and Hồ sơ.
Instructor page: sidebar remains; top bar shows profile action next to notifications/logout.
Instructor courses table: thumbnail uses an image element and fallback icon works.
Admin approvals table: thumbnail uses an image element and fallback icon works.
Mobile width: header actions wrap or hide text without horizontal overflow.
```

Expected: all checklist items pass, or any failures are documented with the exact page and viewport.

---

## Implementation Notes

- Do not modify backend code for this plan.
- Do not add new dependencies.
- Do not add a new test framework; this frontend has no configured test script.
- Do not commit automatically; this workspace requires explicit user approval for commits.
- Preserve existing Vietnamese UI labels.
- Keep icons and colors aligned with existing semantic tokens and component variants.

## Self-Review Checklist

- Spec coverage: learner header reuse, learner profile/course links, instructor profile info, instructor/admin thumbnail `<Image>` conversion, and final verification are each covered by tasks.
- Placeholder scan: no incomplete implementation sections are intentionally left open.
- Type consistency: paths and component names match the inspected codebase.
- Scope check: frontend-only, no route or API contract changes.
