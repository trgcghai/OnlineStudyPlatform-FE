# nuqs URL Filter State Design

## Goal

Persist list/search/filter UI state in the URL so users can reload, share links, and navigate back to the same filtered views without losing context.

## Scope

Apply URL-backed state to these existing frontend flows:

- Public course catalog: `/courses`
- Admin user management: `/admin/users`
- Admin course approvals: `/admin/courses/approvals`
- Instructor course management: `/instructor/courses`
- Instructor enrollment view: `/instructor/courses/[id]/enrollments`
- Instructor essay grading: `/instructor/essay-grading`

Do not add URL state to pages without real filter/search controls.

## Global Setup

`nuqs` is already installed in the frontend. Add `NuqsAdapter` from `nuqs/adapters/next/app` to the root provider tree so client pages can use `useQueryState` and `useQueryStates`.

All URL updates should use `history: "replace"`. This keeps reload/share behavior while avoiding noisy browser history from filter, search, and pagination changes.

Use shallow URL updates. These pages fetch data on the client with TanStack Query, so URL updates do not need to trigger server component re-renders.

## Shared Parser Layer

Create a focused shared parser module, for example `lib/search-params/filter-parsers.ts`.

Reusable parser conventions:

- `q`: string with default `""` and `limitUrlUpdates: debounce(500)`.
- `page`: integer with default `1`.
- `limit`: integer with a per-page default where page size is user-controlled.
- enum filters: use literal/enum parsers so invalid URL values fall back to defaults.
- defaults should clear from the URL using nuqs default `clearOnDefault` behavior.

The shared layer should remove repetitive parser boilerplate without hiding each page's filter shape. Each page should still declare its own relevant query keys clearly.

## Page Query State

### `/courses`

URL params:

- `q`
- `category`
- `page`

The catalog limit remains fixed at `24` and should not be persisted as `limit`.

### `/admin/users`

URL params:

- `q`
- `role`
- `status`
- `page`
- `limit`

Search should be debounced at `500ms`. Role and status filters apply immediately.

### `/admin/courses/approvals`

URL params:

- `q`
- `category`
- `page`
- `limit`

Search should be debounced at `500ms`. Category applies immediately.

### `/instructor/courses`

URL params:

- `q`
- `category`
- `status`
- `page`
- `limit`

Search should be debounced at `500ms`. Category and status apply immediately.

### `/instructor/courses/[id]/enrollments`

URL params:

- `q`
- `page`
- `limit`

The course ID remains in the route path and should not be duplicated in the query string.

### `/instructor/essay-grading`

URL params:

- `courseId`
- `lessonId`
- `quizId`
- `status`
- `page`
- `limit`

Dependency rules:

- Changing `courseId` clears `lessonId` and `quizId`.
- Changing `lessonId` clears `quizId`.
- Changing `courseId`, `lessonId`, `quizId`, or `status` resets `page` to `1`.
- Changing `status` preserves course, lesson, and quiz selections.

## Update Rules

For list/table pages:

- Search changes update `q` with a `500ms` debounce and reset `page` to `1`.
- Filter changes update the relevant filter immediately and reset `page` to `1`.
- Page size changes update `limit` immediately and reset `page` to `1`.
- Page changes only update `page`.

For default values, omit the parameter from the URL. Examples:

- `/admin/users` instead of `/admin/users?page=1&limit=10`
- `/courses?q=react&category=Programming`
- `/instructor/courses?status=Published&page=2`

## Data Flow

Each page reads URL state through `useQueryStates`, builds its existing API filter object from that state, and passes the filter object to the existing TanStack Query hooks.

Toolbar components should remain controlled by props. Pages own URL state; toolbars receive current values and callbacks. This keeps components reusable and avoids coupling shared UI to routing.

## Error Handling

Invalid URL values should not throw or break pages. Parser defaults should recover to the empty/default state. API errors continue using the existing table/page error UI.

## Verification

Run:

- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

Manual checks:

- Set filters, reload, and confirm UI and data remain filtered.
- Copy a filtered URL to a new tab and confirm the same state loads.
- Clear filters and confirm default query params are removed.
- Confirm search URL updates after `500ms`, not on every keystroke.
- Confirm changing filters/page size resets page to `1`.
- Confirm pagination updates URL with `history: "replace"` behavior.
