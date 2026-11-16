# Responsive Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the learner cart usable on small screens and turn cart/notification popovers into direct page links below the `sm` breakpoint.

**Architecture:** Keep cart and notification data fetching in the existing client components, but render CSS-selected mobile links and desktop popovers from the same fetched state. Refine the cart page with mobile-first Tailwind classes and make shared pagination wrap without changing URL or pagination behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, TanStack Query hooks, existing Button/Pagination primitives.

---

### Task 1: Make cart and notification controls responsive

**Files:**
- Modify: `components/cart/cart-popover.tsx`
- Modify: `components/notifications/notification-popover.tsx`

- [ ] **Step 1: Add the mobile cart link beside the existing desktop popover**

Keep the existing `useCart` query and `count` calculation. Replace the single
`<Popover>` return with a fragment containing:

```tsx
<Link
  href="/learner/cart"
  className={cn(
    buttonVariants({ variant: "ghost", size: "icon-sm" }),
    "relative sm:hidden",
  )}
  aria-label="Giỏ hàng"
>
  <ShoppingCart aria-hidden="true" />
  {count > 0 ? (
    <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  ) : null}
</Link>
<div className="hidden sm:block">
  <Popover>
    {/* Keep the current PopoverTrigger and PopoverContent unchanged here. */}
  </Popover>
</div>
```

Use the existing `buttonVariants` and `cn` imports. The popover remains mounted
only in the desktop CSS branch, and the mobile branch navigates directly.

- [ ] **Step 2: Add the mobile notification link beside the existing popover**

Keep the existing notification hooks and `unreadCount`. Add a mobile link using
the same icon and unread badge logic:

```tsx
<Link
  href="/learner/notifications"
  className={cn(
    buttonVariants({ variant: "ghost", size: "icon-sm" }),
    "relative sm:hidden",
  )}
  aria-label="Thông báo"
>
  {unreadCount > 0 ? <BellDot aria-hidden="true" /> : <Bell aria-hidden="true" />}
  {unreadCount > 0 ? (
    <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  ) : null}
</Link>
<div className="hidden sm:block">
  <Popover>
    {/* Keep the current PopoverTrigger and PopoverContent unchanged here. */}
  </Popover>
</div>
```

Import `Link`, `buttonVariants`, and `cn` if not already present. Do not
duplicate the notification query hooks or alter notification marking behavior
inside the desktop popover.

- [ ] **Step 3: Run focused component checks**

Run from `F:\Cntt\KLTN\onlinestudyplatform-fe`:

```powershell
pnpm exec eslint components/cart/cart-popover.tsx components/notifications/notification-popover.tsx
pnpm exec prettier --write components/cart/cart-popover.tsx components/notifications/notification-popover.tsx
pnpm exec prettier --check components/cart/cart-popover.tsx components/notifications/notification-popover.tsx
```

Expected: ESLint exits successfully and Prettier reports all files formatted.

### Task 2: Refine the learner cart layout for narrow screens

**Files:**
- Modify: `app/(learner)/learner/cart/page.tsx`

- [ ] **Step 1: Make the heading and summary stack on mobile**

Change the heading wrapper to `flex-col gap-5 sm:flex-row sm:items-start
sm:justify-between sm:gap-4`. Give the summary card `w-full shrink-0 sm:w-auto`
and use responsive padding:

```tsx
<div className="w-full shrink-0 rounded-2xl bg-muted p-4 sm:w-auto">
  <p className="text-muted-foreground">Tổng tạm tính</p>
  <p className="mt-1 text-2xl font-bold">
    {formatCoursePrice(cart?.summary.totalPrice ?? 0)}
  </p>
  {items.length > 0 ? (
    <Link
      href="/learner/checkout"
      className={buttonVariants({ className: "mt-4 w-full sm:min-w-48" })}
    >
      Xem lại đơn hàng
    </Link>
  ) : null}
</div>
```

- [ ] **Step 2: Make each cart item mobile-first**

Use a responsive item container and smaller phone thumbnail:

```tsx
<article
  key={item.id}
  className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:flex sm:gap-4 sm:p-4"
>
  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24 sm:rounded-2xl">
    {item.course.thumbnail ? (
      <Image
        src={item.course.thumbnail}
        unoptimized
        alt={item.course.title}
        fill
        className="object-cover"
        sizes="(min-width: 640px) 96px, 80px"
      />
    ) : (
      <BookOpen
        className="m-6 size-8 text-muted-foreground sm:m-8"
        aria-hidden="true"
      />
    )}
  </div>
  <div className="min-w-0 sm:flex-1">
    <Link
      href={`/courses/${item.courseId}`}
      className="line-clamp-2 text-base font-semibold hover:text-primary sm:text-lg"
    >
      {item.course.title}
    </Link>
    <p className="mt-1 text-sm text-muted-foreground">
      {item.course.instructor?.name ?? "Giảng viên đang cập nhật"}
    </p>
    <p className="mt-3 font-semibold">
      {formatCoursePrice(item.course.price)}
    </p>
  </div>
  <Button
    type="button"
    variant="destructive"
    size="icon-sm"
    className="self-start"
    aria-label={`Xóa ${item.course.title} khỏi giỏ hàng`}
    disabled={removeCartItem.isPending}
    onClick={() => removeCartItem.mutate(item.courseId)}
  >
    <Trash2 className="size-4" aria-hidden="true" />
  </Button>
</article>
```

Change the fallback icon margin from `m-8` to `m-6 sm:m-8`, change the course
title to `text-base sm:text-lg`, and retain `min-w-0`/line clamping so long
titles cannot widen the viewport.

- [ ] **Step 3: Make empty/loading/error states use mobile-safe gutters**

Use `px-4 py-12 sm:px-6 sm:py-16` for the empty state and `p-4 sm:p-6` for
error content. Keep all existing messages, links, loading behavior, and route
actions unchanged.

- [ ] **Step 4: Run cart-page checks**

Run:

```powershell
pnpm exec eslint "app/(learner)/learner/cart/page.tsx"
pnpm exec prettier --write "app/(learner)/learner/cart/page.tsx"
pnpm exec prettier --check "app/(learner)/learner/cart/page.tsx"
```

Expected: no lint errors and formatted output.

### Task 3: Make shared pagination wrap safely

**Files:**
- Modify: `components/ui/pagination.tsx`

- [ ] **Step 1: Apply responsive wrapping to the pagination root**

Change the root class to:

```tsx
className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4"
```

Give the summary group `min-w-0 flex-wrap`, and give the controls
`max-w-full flex-wrap justify-end` so controls can wrap rather than causing
horizontal scrolling. Keep button sizes, labels, tooltips, and callbacks
unchanged.

- [ ] **Step 2: Run pagination checks**

Run:

```powershell
pnpm exec eslint components/ui/pagination.tsx
pnpm exec prettier --write components/ui/pagination.tsx
pnpm exec prettier --check components/ui/pagination.tsx
```

Expected: no lint errors and formatted output.

### Task 4: Validate the complete responsive cart change

**Files:**
- Verify: `app/(learner)/learner/cart/page.tsx`
- Verify: `components/cart/cart-popover.tsx`
- Verify: `components/notifications/notification-popover.tsx`
- Verify: `components/ui/pagination.tsx`

- [ ] **Step 1: Run the frontend lint suite**

Run:

```powershell
pnpm lint
```

Expected: exit code 0; pre-existing unrelated warnings may remain, but no new
errors should be introduced.

- [ ] **Step 2: Run TypeScript validation**

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Review the final diff**

Run:

```powershell
git diff --check
git diff -- "app/(learner)/learner/cart/page.tsx" components/cart/cart-popover.tsx components/notifications/notification-popover.tsx components/ui/pagination.tsx
```

Confirm that the cart and notification hooks are not duplicated, mobile links
use the correct learner routes, desktop popovers remain interactive, and no
backend, dependency, or route changes were introduced.

- [ ] **Step 4: Manually inspect responsive widths when a browser is available**

Check approximately 375px, 639px, 640px, tablet, and desktop widths. Confirm
that the cart summary stacks, cart cards do not overflow, pagination wraps,
mobile cart/notification buttons navigate directly, and desktop popovers still
open normally.
