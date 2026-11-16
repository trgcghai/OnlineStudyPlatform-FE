# Responsive Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public header and learner navigation responsive and touch-friendly from narrow mobile screens through desktop widths.

**Architecture:** Keep `PublicHeader` as the client-owned responsive public menu. Extract the learner toolbar into a small client component so the server `LearnerLayout` can render desktop links and a mobile Sheet without becoming client-rendered. Reuse the existing Base UI Sheet and button primitives; do not change routes, authentication state, or backend behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, existing `@base-ui/react` Sheet/Button wrappers, Lucide icons.

---

### Task 1: Add the responsive public-header menu

**Files:**
- Modify: `components/layout/public-header.tsx`

- [ ] **Step 1: Read the local Next.js guidance needed for client navigation changes**

Run from `F:\Cntt\KLTN\onlinestudyplatform-fe`:

```powershell
Get-ChildItem node_modules\next\dist\docs -Recurse -File |
  Select-String -Pattern "client component|use client|Link" |
  Select-Object -First 20
```

Confirm the implementation remains a client component and continues to use
`next/link` for internal navigation.

- [ ] **Step 2: Extend the icon imports and Sheet/Button imports**

Add the menu icon and existing Sheet primitives:

```tsx
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
```

Use the repository's existing close behavior through `SheetContent`; do not
manually manage overlay state or add a new dependency.

- [ ] **Step 3: Add the mobile menu while preserving desktop actions**

Keep the current desktop navigation and authenticated/unauthenticated action
rendering behind `sm:flex`/`sm:inline-flex`. Add a `sm:hidden` menu trigger next
to the theme toggle. The Sheet content should render the same route actions in
stacked full-width links/buttons:

```tsx
<Sheet>
  <SheetTrigger
    render={
      <Button variant="outline" size="icon" aria-label="Mở menu điều hướng" />
    }
  >
    <Menu aria-hidden="true" />
  </SheetTrigger>
  <SheetContent side="right" className="w-[min(88vw,22rem)]">
    <SheetHeader>
      <SheetTitle>Điều hướng</SheetTitle>
    </SheetHeader>
    <nav className="flex flex-col gap-2 px-6 pb-6">
      <SheetClose
        render={
          <Link
            href="/courses"
            className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
          />
        }
      >
        Khóa học
      </SheetClose>
      {isAuthenticated ? (
        <>
          {isLearner ? (
            <SheetClose
              render={
                <Link
                  href="/learner/cart"
                  className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
                />
              }
            >
              Giỏ hàng
            </SheetClose>
          ) : null}
          <NotificationPopover />
          <SheetClose
            render={
              <Link
                href="/profile"
                className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              />
            }
          >
            {user?.name ?? "Hồ sơ"}
          </SheetClose>
          <LogoutButton />
        </>
      ) : (
        <>
          <SheetClose
            render={
              <Link
                href="/signin"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              />
            }
          >
            Đăng nhập
          </SheetClose>
          <SheetClose
            render={
              <Link href="/register" className={cn(buttonVariants(), "w-full")} />
            }
          >
            Tạo tài khoản
          </SheetClose>
        </>
      )}
    </nav>
  </SheetContent>
</Sheet>
```

Use `SheetClose` around each internal link so the menu closes after navigation.
For authenticated learners include cart, notifications, profile, and logout;
for unauthenticated users include sign in and register. Keep `ModeToggle`
outside the Sheet so it remains immediately available in the compact header.

- [ ] **Step 4: Make the header spacing safe at narrow widths**

Change the header container to use `px-4 sm:px-6`, reduce the inter-group gap
at mobile widths, and add `min-w-0` to the logo group so the brand does not
force action controls off-screen. Keep the existing `max-w-7xl`, sticky
position, and desktop visual treatment.

- [ ] **Step 5: Run focused static checks**

Run:

```powershell
pnpm exec eslint components/layout/public-header.tsx
pnpm exec prettier --check components/layout/public-header.tsx
```

Expected: both commands pass without modifying unrelated files.

### Task 2: Extract responsive learner navigation

**Files:**
- Create: `components/layout/learner-navigation.tsx`
- Modify: `app/(learner)/layout.tsx`

- [ ] **Step 1: Define the shared learner navigation item model**

Create a client component with a single ordered item list:

```tsx
"use client";

type LearnerNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const LEARNER_NAVIGATION_ITEMS: LearnerNavigationItem[] = [
  { href: "/learner/dashboard", label: "Tổng quan", icon: CircleUserRound },
  { href: "/learner/notifications", label: "Thông báo", icon: Bell },
  { href: "/learner/courses", label: "Khóa học của tôi", icon: BookOpen },
  { href: "/learner/certificates", label: "Chứng chỉ", icon: Award },
  { href: "/learner/cart", label: "Giỏ hàng", icon: ShoppingCart },
  { href: "/learner/payments", label: "Thanh toán", icon: CreditCard },
  { href: "/profile", label: "Hồ sơ của tôi", icon: CircleUserRound },
];
```

Import `LucideIcon` from `lucide-react` and keep the labels and route order
identical to the current layout.

- [ ] **Step 2: Render desktop and mobile variants from the same item list**

Render a desktop `<nav>` with `hidden items-center gap-2 sm:flex` and map each
item to the current ghost small button shape. Render a mobile trigger with
`sm:hidden`, then a right-side Sheet containing a vertical `<nav>` of
full-width `SheetClose` links. Use `aria-label="Mở menu học viên"` on the
trigger and give each link an icon with `data-icon="inline-start"` plus the
existing Vietnamese label.

The mobile Sheet should use the existing primitive:

```tsx
<Sheet>
  <SheetTrigger
    render={
      <Button variant="outline" className="w-full justify-between">
        <span className="inline-flex items-center gap-2">
          <Menu aria-hidden="true" />
          Menu học viên
        </span>
        <ChevronRight aria-hidden="true" />
      </Button>
    }
  />
  <SheetContent side="right" className="w-[min(88vw,22rem)]">
    <SheetHeader>
      <SheetTitle>Menu học viên</SheetTitle>
    </SheetHeader>
    <nav className="flex flex-col gap-2 px-6 pb-6">
      {LEARNER_NAVIGATION_ITEMS.map(({ href, label, icon: Icon }) => (
        <SheetClose
          key={href}
          render={
            <Link
              href={href}
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}
            />
          }
        >
          <Icon data-icon="inline-start" aria-hidden="true" />
          {label}
        </SheetClose>
      ))}
    </nav>
  </SheetContent>
</Sheet>
```

- [ ] **Step 3: Replace the inline learner toolbar in the layout**

Import `LearnerNavigation` in `app/(learner)/layout.tsx` and replace the
current seven-link block with:

```tsx
<div className="border-b bg-muted/30">
  <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
    <LearnerNavigation />
  </div>
</div>
```

Keep `AuthGuard`, `PublicHeader`, the border/background treatment, and route
group layout unchanged.

- [ ] **Step 4: Tune mobile main-content spacing**

Change the layout main element from fixed `p-6` to responsive padding such as
`px-4 py-5 sm:p-6`, while retaining the centered `max-w-7xl` container and
flex-growth behavior.

- [ ] **Step 5: Run focused static checks**

Run:

```powershell
pnpm exec eslint components/layout/learner-navigation.tsx "app/(learner)/layout.tsx"
pnpm exec prettier --check components/layout/learner-navigation.tsx "app/(learner)/layout.tsx"
```

Expected: both commands pass.

### Task 3: Validate the complete frontend change

**Files:**
- Verify: `components/layout/public-header.tsx`
- Verify: `components/layout/learner-navigation.tsx`
- Verify: `app/(learner)/layout.tsx`

- [ ] **Step 1: Run the frontend lint command**

Run:

```powershell
pnpm lint
```

Expected: ESLint exits successfully. Do not stage or revert unrelated
pre-existing changes in `app/(public)/page.tsx`.

- [ ] **Step 2: Run the TypeScript check**

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: TypeScript exits successfully with no errors.

- [ ] **Step 3: Review the final diff and responsive invariants**

Run:

```powershell
git diff --check
git diff -- components/layout/public-header.tsx components/layout/learner-navigation.tsx "app/(learner)/layout.tsx"
```

Confirm:

- Desktop links remain visible at `sm` and above.
- Mobile triggers are hidden at `sm` and above.
- All seven learner routes remain present and ordered.
- Mobile Sheet links close the Sheet through `SheetClose`.
- No route, Redux, API, or dependency changes were introduced.

- [ ] **Step 4: Manually verify viewport behavior when a browser is available**

Check approximately 320px,  sm breakpoint width, tablet width, and desktop width.
At narrow width, confirm the header has no horizontal overflow, the Sheet is
usable with touch-sized controls, and the learner menu does not push content
outside the viewport. At desktop width, confirm the existing toolbar and header
actions remain in one row.
