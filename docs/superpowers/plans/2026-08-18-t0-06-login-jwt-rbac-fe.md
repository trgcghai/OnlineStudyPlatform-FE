# T0-06 Login / Logout + JWT + RBAC Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Next.js frontend to the T0-06 backend auth API with persisted access-token auth, role redirects, protected role layouts, refresh handling, and logout.

**Architecture:** Extend the existing Redux Persist auth slice to store `accessToken` and `user`, add centralized access-control helpers in `utils/authUtil.ts`, add typed auth API calls, update the single axios instance to attach bearer tokens and refresh via `POST /auth/refresh`, and replace the `/signin` placeholder with a validated client form. Route protection stays client-side through one shared guard component used by the role layouts.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Redux Toolkit, redux-persist, axios, react-hook-form, zod, shadcn/Base UI components, Tailwind CSS v4.

---

## Scope And Constraints

- Frontend only; do not change backend files in this plan.
- Work in `F:\Cntt\KLTN\onlinestudyplatform-fe`.
- Use `pnpm`, not npm or yarn.
- No frontend test framework is installed; verify with `pnpm lint`, `pnpm build`, and manual checks.
- Keep one axios instance: `services/axios.ts`.
- Use `utils/authUtil.ts` for route/role decisions instead of repeating checks in layouts.
- Do not redirect authenticated users away from `/signin` or `/register`.
- Do not add commits unless the user explicitly asks.
- Follow Next.js 16 App Router rules; use client components only where hooks, Redux, or browser APIs are needed.

## File Structure

Create:

- `utils/authUtil.ts`: centralized auth session checks and role-to-route mapping.
- `services/api/auth.ts`: typed calls for login, refresh, logout, and me.
- `lib/schemas/login.ts`: zod schema and `LoginFormValues`.
- `hooks/useAuth.ts`: login/logout form-facing hook and backend error mapping.
- `components/auth/auth-guard.tsx`: shared client guard for role layouts.
- `components/auth/logout-button.tsx`: shared logout button for role headers.

Modify:

- `lib/features/authSlice.ts`: expand auth state, reducers, and selectors.
- `services/axios.ts`: attach bearer token, call `POST /auth/refresh`, update Redux token, clear auth on refresh failure.
- `app/(auth)/signin/page.tsx`: replace placeholder with login form.
- `app/(admin)/layout.tsx`: wrap content with `AuthGuard`, add `LogoutButton`.
- `app/(instructor)/layout.tsx`: wrap content with `AuthGuard`, add `LogoutButton`.
- `app/(learner)/layout.tsx`: wrap content with `AuthGuard`, add `LogoutButton`.

---

### Task 1: Expand Redux Auth State

**Related skills:** `nextjs`, `vercel-react-best-practices`, `test-driven-development`, `verification-before-completion`

**Files:**
- Modify: `lib/features/authSlice.ts`

- [ ] **Step 1: Update auth interfaces and initial state**

Replace the current boolean-only auth state with interfaces that reuse role/status types:

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";
import type { UserRole, UserStatus } from "@/services/api/users";

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
}

interface SetCredentialsPayload {
  accessToken: string;
  user: AuthUser;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
};
```

- [ ] **Step 2: Update reducers**

Use these reducers in the slice:

```ts
reducers: {
  setCredentials(state, action: PayloadAction<SetCredentialsPayload>) {
    state.isAuthenticated = true;
    state.accessToken = action.payload.accessToken;
    state.user = action.payload.user;
  },
  setAccessToken(state, action: PayloadAction<string>) {
    state.accessToken = action.payload;
    state.isAuthenticated = Boolean(state.user);
  },
  setIsAuthenticated(state, action: PayloadAction<boolean>) {
    state.isAuthenticated = action.payload;
    if (!action.payload) {
      state.accessToken = null;
      state.user = null;
    }
  },
  clearAuth() {
    return initialState;
  },
}
```

Keep `setIsAuthenticated` temporarily if current code imports it from `services/axios.ts`; later tasks should migrate axios to `clearAuth` and `setAccessToken`.

- [ ] **Step 3: Export actions and selectors**

Export:

```ts
export const {
  setCredentials,
  setAccessToken,
  setIsAuthenticated,
  clearAuth,
} = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectUserRole = (state: RootState) => state.auth.user?.role;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
```

- [ ] **Step 4: Verify compile**

Run:

```powershell
pnpm lint
```

Expected: no lint errors from `authSlice.ts`. Existing warnings elsewhere are acceptable only if the command exits successfully.

---

### Task 2: Add Central Auth Utility

**Related skills:** `nextjs`, `vercel-react-best-practices`, `verification-before-completion`

**Files:**
- Create: `utils/authUtil.ts`

- [ ] **Step 1: Create centralized role and session helpers**

Create `utils/authUtil.ts`:

```ts
import type { AuthState } from "@/lib/features/authSlice";
import { USER_ROLES, type UserRole } from "@/services/api/users";

export const SIGN_IN_PATH = "/signin";

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "/admin/users";
    case USER_ROLES.INSTRUCTOR:
      return "/instructor/courses";
    case USER_ROLES.LEARNER:
      return "/courses";
  }
}

export function getSignInRedirectPath(): string {
  return SIGN_IN_PATH;
}

export function isAuthenticatedSession(auth: AuthState): boolean {
  return Boolean(auth.isAuthenticated && auth.accessToken && auth.user);
}

export function canAccessRole(
  auth: AuthState,
  allowedRoles: UserRole[],
): boolean {
  return Boolean(
    isAuthenticatedSession(auth) &&
      auth.user &&
      allowedRoles.includes(auth.user.role),
  );
}
```

- [ ] **Step 2: Verify TypeScript exhaustiveness**

Run:

```powershell
pnpm build
```

Expected: build passes. If TypeScript complains about `getRoleHomePath` not returning a value, add an explicit fallback after the switch:

```ts
return SIGN_IN_PATH;
```

---

### Task 3: Add Typed Auth API Calls

**Related skills:** `nextjs`, `vercel-react-best-practices`, `verification-before-completion`

**Files:**
- Create: `services/api/auth.ts`

- [ ] **Step 1: Create auth API module**

Create `services/api/auth.ts`:

```ts
import type { AuthUser } from "@/lib/features/authSlice";
import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await axiosClient.post<ApiSuccessResponse<LoginResponse>>(
    "/auth/login",
    payload,
  );

  return data.data;
}

export async function refresh(): Promise<LoginResponse> {
  const { data } = await axiosClient.post<ApiSuccessResponse<LoginResponse>>(
    "/auth/refresh",
  );

  return data.data;
}

export async function logout(): Promise<void> {
  await axiosClient.post("/auth/logout");
}

export async function getMe(): Promise<CurrentUserResponse> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<CurrentUserResponse>
  >(
    "/auth/me",
  );

  return data.data;
}
```

- [ ] **Step 2: Verify auth API types**

Run:

```powershell
pnpm build
```

Expected: build passes.

---

### Task 4: Fix Axios Auth Interceptor

**Related skills:** `nextjs`, `vercel-react-best-practices`, `systematic-debugging`, `verification-before-completion`

**Files:**
- Modify: `services/axios.ts`

- [ ] **Step 1: Replace non-component redirect usage**

Remove:

```ts
import { redirect } from "next/navigation";
```

Add a browser-safe redirect helper:

```ts
function redirectToSignIn(): void {
  if (typeof window !== "undefined") {
    window.location.assign("/signin");
  }
}
```

- [ ] **Step 2: Attach Authorization header from Redux**

Add a static store import near the top of `services/axios.ts`:

```ts
import { store } from "@/lib/store";
```

Then add a request interceptor after `axiosClient` is created:

```ts
axiosClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

- [ ] **Step 3: Change refresh call to POST and return new credentials**

Replace the current `refreshToken(): Promise<boolean>` with:

```ts
const refreshToken = async (): Promise<string> => {
  const response = await axiosClient.post<ApiSuccessResponse<{ accessToken: string }>>(
    "/auth/refresh",
  );

  return response.data.data.accessToken;
};
```

- [ ] **Step 4: Update refresh success path**

On refresh success:

```ts
const newAccessToken = await refreshToken();
const { store } = await import("@/lib/store");
const { setAccessToken } = await import("@/lib/features/authSlice");

store.dispatch(setAccessToken(newAccessToken));
originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
processQueue(null, newAccessToken);
return axiosClient(originalRequest);
```

Update the queue type so queued requests receive the new access token:

```ts
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}> = [];
```

Queued retry:

```ts
return new Promise<string>((resolve, reject) => {
  failedQueue.push({ resolve, reject });
}).then((token) => {
  originalRequest.headers.Authorization = `Bearer ${token}`;
  return axiosClient(originalRequest);
});
```

- [ ] **Step 5: Clear auth on refresh failure**

Replace current logout/401 state logic with `clearAuth()`:

```ts
const clearAuthAndRedirect = async (): Promise<void> => {
  const { store } = await import("@/lib/store");
  const { clearAuth } = await import("@/lib/features/authSlice");

  store.dispatch(clearAuth());
  isRefreshing = false;
  redirectToSignIn();
};
```

Use this for refresh endpoint `401` and refresh failures.

- [ ] **Step 6: Verify axios wiring**

Run:

```powershell
pnpm lint
pnpm build
```

Expected: both pass. If TypeScript reports `headers` may be undefined, initialize it through axios config-compatible assignment before setting `Authorization`.

---

### Task 5: Add Login Schema And Auth Hook

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn-ui`, `verification-before-completion`

**Files:**
- Create: `lib/schemas/login.ts`
- Create: `hooks/useAuth.ts`

- [ ] **Step 1: Create login schema**

Create `lib/schemas/login.ts`:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email khong hop le")),
  password: z.string().nonempty("Vui long nhap mat khau"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Create useAuth hook**

Create `hooks/useAuth.ts`:

```ts
import { isAxiosError } from "axios";
import { useDispatch } from "react-redux";
import { setCredentials, clearAuth } from "@/lib/features/authSlice";
import type { AppDispatch } from "@/lib/store";
import type { LoginFormValues } from "@/lib/schemas/login";
import type { UserRole } from "@/services/api/users";
import { login as loginApi, logout as logoutApi } from "@/services/api/auth";
import { isApiErrorResponse } from "@/services/axios";

interface AuthFailure {
  ok: false;
  formError: string;
}

interface AuthSuccess {
  ok: true;
  role: UserRole;
}

export type LoginResult = AuthSuccess | AuthFailure;

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();

  async function login(values: LoginFormValues): Promise<LoginResult> {
    try {
      const result = await loginApi(values);
      dispatch(setCredentials(result));
      return { ok: true, role: result.user.role };
    } catch (error) {
      return { ok: false, formError: mapLoginError(error) };
    }
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi();
    } finally {
      dispatch(clearAuth());
    }
  }

  return { login, logout };
}

function mapLoginError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return "Khong the ket noi den may chu. Vui long thu lai.";
  }

  const { status, data } = error.response;
  if (!isApiErrorResponse(data)) {
    return "Da co loi xay ra. Vui long thu lai sau.";
  }

  if (status === 401) {
    return "Email hoac mat khau khong dung";
  }

  if (status === 403 && data.error.message === "Account disabled") {
    return "Tai khoan da bi vo hieu hoa";
  }

  return "Da co loi xay ra. Vui long thu lai sau.";
}
```

- [ ] **Step 3: Verify hook types**

Run:

```powershell
pnpm build
```

Expected: build passes.

---

### Task 6: Replace Sign-In Placeholder With Login Form

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn-ui`, `verification-before-completion`

**Files:**
- Modify: `app/(auth)/signin/page.tsx`

- [ ] **Step 1: Implement client sign-in form**

Replace the placeholder with a client component using the same form stack as register:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/login";
import { getRoleHomePath } from "@/utils/authUtil";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    const result = await login(values);

    if (result.ok) {
      router.push(getRoleHomePath(result.role));
      return;
    }

    setFormError(result.formError);
  }

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dang nhap</CardTitle>
          <CardDescription>Dang nhap de tiep tuc hoc tap.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Khong the dang nhap</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Mat khau</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <FieldError errors={[errors.password]} />
              </Field>
            </FieldGroup>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Dang dang nhap..." : "Dang nhap"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Chua co tai khoan?{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Dang ky
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
```

- [ ] **Step 2: Verify sign-in page**

Run:

```powershell
pnpm lint
pnpm build
```

Expected: both pass.

---

### Task 7: Add Shared Auth Guard And Logout Button

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn-ui`, `verification-before-completion`

**Files:**
- Create: `components/auth/auth-guard.tsx`
- Create: `components/auth/logout-button.tsx`

- [ ] **Step 1: Create AuthGuard component**

Create `components/auth/auth-guard.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/lib/features/authSlice";
import type { UserRole } from "@/services/api/users";
import {
  canAccessRole,
  getRoleHomePath,
  getSignInRedirectPath,
  isAuthenticatedSession,
} from "@/utils/authUtil";

interface AuthGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const auth = useSelector(selectAuth);

  useEffect(() => {
    if (!isAuthenticatedSession(auth)) {
      router.replace(getSignInRedirectPath());
      return;
    }

    if (!canAccessRole(auth, allowedRoles) && auth.user) {
      router.replace(getRoleHomePath(auth.user.role));
    }
  }, [allowedRoles, auth, router]);

  if (!isAuthenticatedSession(auth)) {
    return null;
  }

  if (!canAccessRole(auth, allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
```

If lint warns about `allowedRoles` changing identity from array literals, define role arrays as module constants in each layout or inside separate constants.

- [ ] **Step 2: Create LogoutButton component**

Create `components/auth/logout-button.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getSignInRedirectPath } from "@/utils/authUtil";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    try {
      await logout();
    } finally {
      router.replace(getSignInRedirectPath());
      setIsPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Dang dang xuat..." : "Dang xuat"}
    </Button>
  );
}
```

- [ ] **Step 3: Verify components**

Run:

```powershell
pnpm build
```

Expected: build passes.

---

### Task 8: Protect Role Layouts And Add Logout

**Related skills:** `nextjs`, `vercel-react-best-practices`, `shadcn-ui`, `verification-before-completion`

**Files:**
- Modify: `app/(admin)/layout.tsx`
- Modify: `app/(instructor)/layout.tsx`
- Modify: `app/(learner)/layout.tsx`

- [ ] **Step 1: Update admin layout**

Wrap the current admin layout content:

```tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { USER_ROLES } from "@/services/api/users";

const ADMIN_ROLES = [USER_ROLES.ADMIN];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={ADMIN_ROLES}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <span className="text-sm font-medium text-foreground">Quan tri vien</span>
          <LogoutButton />
        </header>
        <main className="flex flex-1 items-center justify-center p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Update instructor layout**

Use the same pattern with:

```ts
const INSTRUCTOR_ROLES = [USER_ROLES.INSTRUCTOR];
```

Header label remains instructor-specific and includes `<LogoutButton />`.

- [ ] **Step 3: Update learner layout**

Use the same pattern with:

```ts
const LEARNER_ROLES = [USER_ROLES.LEARNER];
```

Header label remains learner-specific and includes `<LogoutButton />`.

- [ ] **Step 4: Verify protected layouts**

Run:

```powershell
pnpm lint
pnpm build
```

Expected: both pass.

---

### Task 9: Full Verification And Manual Auth Checks

**Related skills:** `verification-before-completion`, `systematic-debugging`, `requesting-code-review`

**Files:**
- Review all files changed in Tasks 1-8.

- [ ] **Step 1: Run lint**

Run:

```powershell
pnpm lint
```

Expected: command exits successfully with no errors.

- [ ] **Step 2: Run production build**

Run:

```powershell
pnpm build
```

Expected: Next.js build passes.

- [ ] **Step 3: Inspect diff**

Run:

```powershell
git status --short
git diff -- app components hooks lib services utils docs
```

Expected: diff contains only T0-06 FE auth wiring and the FE design/plan docs.

- [ ] **Step 4: Manual check against backend**

With the backend running and `NEXT_PUBLIC_API_URL` pointing at it, verify:

```txt
wrong password shows generic Vietnamese error
inactive account shows disabled-account Vietnamese error
valid Admin redirects to /admin/users
valid Instructor redirects to /instructor/courses
valid Learner redirects to /courses
protected role routes redirect unauthenticated users to /signin
wrong-role user is redirected to their own role home
expired/invalid access token triggers POST /auth/refresh
refresh success retries original request and updates Redux accessToken
refresh failure clears Redux auth and redirects /signin
logout calls POST /auth/logout, clears Redux auth, redirects /signin
```

- [ ] **Step 5: Request code review before completion**

Use `requesting-code-review` or dispatch a review agent with this focus:

```txt
Review T0-06 FE auth wiring for token storage, axios refresh queue correctness, POST /auth/refresh alignment, Redux Persist behavior, route guard centralization, role redirects, logout behavior, and Next.js client/server boundary issues.
```

Expected: address any correctness/security findings before calling implementation complete.

---

## Execution Notes

- Required execution skill: `subagent-driven-development` is recommended for task-by-task execution.
- Alternative execution skill: `executing-plans` if implementation stays inline.
- Use `nextjs` for Tasks 1-9 because this is a Next.js 16 App Router app.
- Use `vercel-react-best-practices` for Tasks 1-8 because they touch React components, state, and data flow.
- Use `shadcn-ui` for Tasks 5-8 because they compose existing shadcn/Base UI components.
- Use `systematic-debugging` for any failed lint/build/manual auth behavior.
- Use `verification-before-completion` before claiming completion.
- Use `requesting-code-review` after lint/build/manual checks.
