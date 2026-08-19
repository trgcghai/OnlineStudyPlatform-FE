# T0-06 Login / Logout + JWT + RBAC - Frontend Design

**Date:** 2026-08-18  
**Status:** Approved for spec review  
**Epic:** Accounts  
**UC:** UC06/UC13  
**FR:** FR-02, FR-04, FR-05  
**Repo:** FE  
**Depends on:** T0-06 backend auth endpoints

## Goal

Wire the frontend to the T0-06 backend authentication API. A user can sign in, persist their access token and user session in Redux Persist, be redirected to their role home route, use protected role layouts, refresh expired access tokens through the HttpOnly refresh cookie, and log out from role dashboards.

## Backend Contract

The backend exposes these endpoints:

```txt
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

The backend wraps successful responses with the existing global response shape:

```ts
interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}
```

Login and refresh response data:

```ts
interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
```

Current user response data:

```ts
interface CurrentUserResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
```

The refresh token is never returned in JSON. It is stored by the backend as an HttpOnly cookie and sent by the browser because the axios instance uses `withCredentials: true`.

Important alignment fixes:

- Current FE axios calls `GET /auth/refresh`; change it to `POST /auth/refresh`.
- Access token is read from `response.data.data.accessToken`.
- Refresh token is cookie-only; do not store or read it in frontend code.

## Decisions

| Topic | Decision |
|---|---|
| Access token storage | Persist in Redux Persist/localStorage with auth state |
| Refresh token storage | Backend HttpOnly cookie only |
| Role redirects | Use existing role routes |
| Route protection | Client layout guard using centralized helper functions |
| Central auth helpers | `utils/authUtil.ts` |
| Login schema | `lib/schemas/login.ts`, same pattern as register schema |
| Auth pages when already logged in | Do not redirect away from `/signin` or `/register` |
| Logout control | Shared logout button in role layout headers |
| FE tests | No test framework installed; verify with `pnpm lint`, `pnpm build`, and manual checks |

## Auth State

Expand the existing persisted auth slice from only `isAuthenticated` to a full session.

Use interfaces and reuse existing role/status types from `services/api/users.ts`:

```ts
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
```

Reducers:

```ts
setCredentials({ accessToken, user })
setAccessToken(accessToken)
clearAuth()
```

Selectors:

```ts
selectAuth
selectAccessToken
selectAuthUser
selectUserRole
selectIsAuthenticated
```

Keep the existing Redux Persist whitelist as `['auth']`, so `accessToken` and `user` survive browser reloads.

## Central Auth Helpers

Create:

```txt
utils/authUtil.ts
```

Responsibilities:

```ts
getRoleHomePath(role: UserRole): string
getSignInRedirectPath(): string
isAuthenticatedSession(auth: AuthState): boolean
canAccessRole(auth: AuthState, allowedRoles: UserRole[]): boolean
```

Role route map:

```txt
Admin      -> /admin/users
Instructor -> /instructor/courses
Learner    -> /courses
```

Use `utils/authUtil.ts` from:

```txt
signin submit success
protected role layouts
logout fallback redirects
axios refresh-failure redirect
```

This keeps role routing and access checks centralized instead of repeating checks in layouts and pages.

## API Layer

Add:

```txt
services/api/auth.ts
```

Functions:

```ts
login(payload: LoginPayload): Promise<LoginResponse>
refresh(): Promise<LoginResponse>
logout(): Promise<void>
getMe(): Promise<CurrentUserResponse>
```

Expected payloads and responses:

```ts
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
```

Each function uses the single shared axios instance from `services/axios.ts`.

## Axios Wiring

Keep `services/axios.ts` as the only axios instance.

Request behavior:

1. Read the current Redux `accessToken`.
2. If present, attach `Authorization: Bearer <accessToken>`.
3. Keep `withCredentials: true` for the refresh cookie.

Response behavior:

1. If a non-refresh request returns `401`, call `POST /auth/refresh`.
2. Queue concurrent failed requests while one refresh is in progress.
3. On refresh success, dispatch `setAccessToken(newAccessToken)` and retry queued/original requests with the new bearer token.
4. On refresh failure, dispatch `clearAuth()` and redirect to `/signin`.

Fix current issues:

- Change refresh from `GET /auth/refresh` to `POST /auth/refresh`.
- Do not use `next/navigation` `redirect()` in non-component axios code. Use `window.location.assign('/signin')` when running in the browser.
- Remove debug `console.log` output from auth interceptor paths unless needed for a real error.
- Keep error handling compatible with `ApiErrorResponse` from the backend.

## Login Schema

Add:

```txt
lib/schemas/login.ts
```

Use the same style as `lib/schemas/register.ts`:

```ts
email: trim + lowercase + valid email
password: non-empty string
```

The sign-in page uses `zodResolver(loginSchema)` and `LoginFormValues` from this schema.

## Sign-In Page

Replace the current `/signin` placeholder with a client form matching the existing register page style.

Fields:

```txt
Email
Password
```

Submit behavior:

1. Validate with `loginSchema`.
2. Call `login()` from `services/api/auth.ts`.
3. Dispatch `setCredentials({ accessToken, user })`.
4. Redirect to `getRoleHomePath(user.role)`.

Error mapping:

```txt
401 Invalid email or password -> Email hoac mat khau khong dung
403 Account disabled          -> Tai khoan da bi vo hieu hoa
network/unknown               -> Khong the ket noi den may chu. Vui long thu lai.
other backend message         -> show generic form error
```

No `/signin?registered=1` handling. Do not redirect authenticated users away from `/signin` or `/register`.

## Protected Layouts

Add shared client guard:

```txt
components/auth/auth-guard.tsx
```

Props:

```ts
interface AuthGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}
```

Behavior:

1. Wait for Redux Persist rehydration before deciding.
2. If no valid auth session, redirect to `/signin`.
3. If user role is not allowed, redirect to `getRoleHomePath(user.role)`.
4. If allowed, render children.

Use it in:

```txt
app/(admin)/layout.tsx      -> allowedRoles [USER_ROLES.ADMIN]
app/(instructor)/layout.tsx -> allowedRoles [USER_ROLES.INSTRUCTOR]
app/(learner)/layout.tsx    -> allowedRoles [USER_ROLES.LEARNER]
```

Because this is client-side protection, pages may briefly wait for persisted state before rendering. The guard should render `null`, a spinner, or a minimal loading state while rehydration/auth status is unknown.

## Logout

Add shared component:

```txt
components/auth/logout-button.tsx
```

Behavior:

1. On click, call `POST /auth/logout` through `services/api/auth.ts`.
2. Whether the API succeeds or fails, dispatch `clearAuth()`.
3. Redirect to `/signin`.

Place the logout button in all three role layout headers:

```txt
app/(admin)/layout.tsx
app/(instructor)/layout.tsx
app/(learner)/layout.tsx
```

Use one shared component so logout behavior does not drift between roles.

## Out Of Scope

- Backend changes, except aligning to the already implemented T0-06 endpoints.
- Registration page redesign.
- Auth-page redirects for already signed-in users.
- Password reset and email verification.
- Server-side middleware protection.
- Full dashboard implementations beyond existing placeholders.
- Installing a frontend test framework.

## Verification

Commands:

```txt
pnpm lint
pnpm build
```

Manual checks with backend running:

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
