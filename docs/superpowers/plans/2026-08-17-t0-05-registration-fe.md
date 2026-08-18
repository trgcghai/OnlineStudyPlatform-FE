# T0-05 Registration (FE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `/register` page to the BE `POST /users` endpoint — react-hook-form + zod validation with Vietnamese inline errors, 409 duplicate handling, success feedback, and redirect to `/signin`, per card T0-05.

**Architecture:** The existing `(auth)` route group layout hosts a new client-component register form (shadcn Card/Input/Label/Button/Alert primitives). A zod schema (in `lib/schemas/`) mirrors the BE rules and drives `react-hook-form` via `@hookform/resolvers`. The shared axios client (`services/axios.ts`) posts to `/users`; 409 maps to the email field ("Email đã được đăng ký"), 400 maps BE English messages to Vietnamese field errors, success shows an inline Alert then `router.push('/signin?registered=1')`. The axios baseURL is fixed to drop the non-existent `/api` prefix, and the landing hero gains a "Tạo tài khoản" entry link.

**Tech Stack:** Next.js 16.3.0 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/Base UI primitives in `components/ui/`, react-hook-form + zod + @hookform/resolvers, pnpm.

**Context:** Work in `F:\Cntt\KLTN\onlinestudyplatform-fe`. **No branch exists yet — create `feature/t0-05-register-page` first (repo rule: never work on `main`).** No `src/` dir — routes live in `app/`. No test framework installed (per repo AGENTS.md) — verification is `pnpm lint` + `pnpm build` + runtime smoke. UI strings MUST be Vietnamese. Spec: `online-study-platform-be/docs/superpowers/specs/2026-08-17-t0-05-registration-design.md` (section 6). Read `AGENTS.md` + `node_modules/next/dist/docs/` before writing Next.js code (Next.js 16 has breaking changes vs training data). Port 3000 is held by Docker — run dev on `PORT=3010`. The BE must be reachable at `http://localhost:3001` (compose `be` service or `pnpm start:dev` with a valid `.env` — CORS is already enabled by the BE `configureApp` helper).

---

### Task 1: Feature branch + deps + axios baseURL fix

**Skills:** none required — mechanical setup; verify with `pnpm`.

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (via pnpm)
- Modify: `services/axios.ts` (baseURL line)

- [ ] **Step 1: Create the feature branch**

Run:

```bash
git switch -c feature/t0-05-register-page
```

Expected: on branch `feature/t0-05-register-page`, working tree clean.

- [ ] **Step 2: Install form deps**

Run: `pnpm add react-hook-form zod @hookform/resolvers`
Expected: exits 0; `package.json` gains the three deps.

- [ ] **Step 3: Fix the axios baseURL**

In `services/axios.ts`, change:

```typescript
baseURL: process.env.NEXT_PUBLIC_API_URL,
```

into (single line — the `.env.local` value `http://localhost:3001/api` has an `/api` suffix the BE does not serve; drop it):

```typescript
baseURL: (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api$/, ""),
```

- [ ] **Step 4: Verify**

Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml services/axios.ts
git commit -m "chore: add react-hook-form/zod; fix axios baseURL (drop non-existent /api prefix)"
```

---

### Task 2: Zod register schema with Vietnamese messages

**Skills:** none required — pure schema module; follow the strict TS typing conventions already in `lib/features/authSlice.ts`.

**Files:**
- Create: `lib/schemas/register.ts`

- [ ] **Step 1: Write the schema**

`lib/schemas/register.ts` (exact content — rules mirror the BE DTO: name 2–100 trimmed, valid email lowercased, password min 8 + letter + number + special):

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Za-z]/, "Mật khẩu phải chứa ít nhất một chữ cái")
    .regex(/\d/, "Mật khẩu phải chứa ít nhất một chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất một ký tự đặc biệt"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
```

- [ ] **Step 2: Verify**

Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/schemas/register.ts
git commit -m "feat: zod register schema with Vietnamese validation messages"
```

---

### Task 3: Register page — form, submit wiring, error mapping, success + redirect

**Skills:** [shadcn](skill) - compose the installed Base-UI Card/Input/Label/Button/Alert primitives exactly as exported; [vercel-react-best-practices](skill) - client component with typed props, no unnecessary re-renders.

**Files:**
- Create: `app/(auth)/register/page.tsx` (overwrite the EmptyState placeholder)
- Modify: `app/page.tsx` (landing hero — add "Tạo tài khoản" link)

- [ ] **Step 1: Write the register page**

`app/(auth)/register/page.tsx` (exact content — confirm exported names against `components/ui/alert.tsx`, `card.tsx`, `button.tsx`, `input.tsx`, `label.tsx` before writing; all exports verified in the T0-04 session):

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/services/axios";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/schemas/register";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await axiosClient.post("/users", values);
      setRegistered(true);
      setTimeout(() => router.push("/signin?registered=1"), 1200);
    } catch (error) {
      if (!axios.isAxiosError(error) || !error.response) {
        setServerError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
        return;
      }
      const status = error.response.status;
      const message = (error.response.data as { message?: unknown })?.message;
      const text = Array.isArray(message) ? message.join(" ") : String(message ?? "");
      if (status === 409) {
        setError("email", { message: "Email đã được đăng ký" }, { shouldFocus: true });
      } else if (status === 400) {
        if (/password/i.test(text)) {
          setError("password", {
            message: "Mật khẩu không đáp ứng yêu cầu (tối thiểu 8 ký tự, gồm chữ, số và ký tự đặc biệt)",
          });
        }
        if (/email/i.test(text)) {
          setError("email", { message: "Email không hợp lệ" });
        }
        if (/name/i.test(text)) {
          setError("name", { message: "Họ và tên không hợp lệ" });
        }
        if (!/password|email|name/i.test(text)) {
          setServerError("Thông tin không hợp lệ. Vui lòng kiểm tra lại.");
        }
      } else {
        setServerError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Đăng ký tài khoản</CardTitle>
        <CardDescription>
          Tạo tài khoản học viên để tham gia các khóa học.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {registered && (
          <Alert variant="success">
            <AlertTitle>Đăng ký thành công</AlertTitle>
            <AlertDescription>
              Bạn sẽ được chuyển đến trang đăng nhập…
            </AlertDescription>
          </Alert>
        )}
        {serverError && !registered && (
          <Alert variant="destructive">
            <AlertTitle>Có lỗi xảy ra</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input id="name" placeholder="Nguyễn Văn A" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ban@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tối thiểu 8 ký tự, gồm chữ, số và ký tự đặc biệt"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || registered}>
            {isSubmitting ? "Đang xử lý…" : "Đăng ký"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">
            Đăng nhập
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

**Note (pre-verified):** the `Alert` primitive in `components/ui/alert.tsx` supports `variant="success"` and `variant="destructive"` — confirm the exported variant names with `Get-Content components/ui/alert.tsx` before using; if the variants differ, use the closest existing variant for success/destructive or add the variant map entries following the file's existing pattern.

- [ ] **Step 2: Add the landing entry link**

In `app/page.tsx`, inside the existing CTA `<div className="mt-8 ...">`, after the "Đăng nhập" Link add:

```tsx
        <Link
          href="/register"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Tạo tài khoản
        </Link>
```

- [ ] **Step 3: Verify**

Run: `pnpm lint`
Expected: exit 0.
Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/register/page.tsx" app/page.tsx
git commit -m "feat: register form (RHF+zod), 409/400 error mapping, success redirect"
```

---

### Task 4: Runtime smoke — register end-to-end against the BE

**Skills:** [verification-before-completion](skill) - evidence before asserting success; exercise the real network path.

**Files:**
- None (verification only)

- [ ] **Step 1: Ensure BE + infra are up**

From `F:\Cntt\KLTN` (root): `docker compose ps` — `be`, `postgres`, `redis`, `mongodb`, `minio` healthy. If `be` predates T0-05, rebuild: `docker compose up -d --build be`. Probe: `curl -s http://localhost:3001/health` → all five components `UP`.

- [ ] **Step 2: Run the FE and register through the UI**

Run: `pnpm dev` with `PORT=3010` in the FE repo (3000 is taken by Docker). Open `http://localhost:3010/register` and register with a fresh email `smoke-fe-<timestamp>@example.com` and password `abcd1234!`.

Expected (document the observed behavior):
- Empty submit → inline Vietnamese errors (name/email/password)
- Weak password `abc12` → Vietnamese password error under the field
- Valid submit → success Alert, auto-redirect to `/signin?registered=1`
- Same email again → "Email đã được đăng ký" next to the email field
- Network tab shows `POST http://localhost:3001/users` returning 201 then 409 (no CORS errors — preflight `OPTIONS` succeeds)

- [ ] **Step 3: Confirm the DB row**

In psql on port 5433 (`PGPASSWORD` from root `.env`): `SELECT email, role, status, created_at FROM users WHERE email LIKE 'smoke-fe-%@example.com';`
Expected: one row, `role = 'Learner'`, `status = 'Active'`. Verify the hash: `SELECT password LIKE '$2%' AS bcrypt_hash FROM users WHERE email LIKE 'smoke-fe-%@example.com';` → `t`.

- [ ] **Step 4: Clean up smoke data**

Run: `DELETE FROM users WHERE email LIKE 'smoke-fe-%@example.com';` then verify the row is gone.

- [ ] **Step 5: Final state**

Run: `git status` in the FE repo — clean, all commits on `feature/t0-05-register-page`. `pnpm lint` + `pnpm build` exit 0 one last time. Commit anything that drifted (e.g. the Alert variant note), otherwise no empty commits.
