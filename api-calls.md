# Frontend API Calls — Overview

How the frontend talks to the backend, at a high level.

## Stack

- **axios** — HTTP client with one shared instance (base URL from `VITE_API_URL`, credentials, response envelope unwrapping).
- **TanStack Query (React Query v5)** — all fetching, caching, and writing. `QueryClient` is created in `frontend/src/routes/__root.tsx`.

## Architecture

```
Component → Query Hook (src/hooks) → API Service (src/services/api) → axios → Backend
```

- **API services** (`src/services/api/*.ts`, one file per domain: manga, author, genre, language, translator, tracking, file) — plain async functions that build URLs/params and call the shared axios instance.
- **Query hooks** (`src/hooks/*.ts`) — wrap services in `useQuery` / `useMutation`.
- **Components** — call hooks; they never touch axios directly.

## Triggering Calls

- **Reads** — `useQuery({ queryKey, queryFn })`. Fires on mount, refires when the `queryKey` changes, and can be gated with `enabled`. Component reads `data / isLoading / error`.
- **Writes** — `useMutation({ mutationFn, onSuccess, onError })`. Triggered manually via `mutate(payload)`. `onSuccess` shows a toast and invalidates related caches.
- **Outliers** — direct service calls (not via query hooks) for the batch chapter import loop and reader page loading.

## Caching

- TanStack Query in-memory cache keyed by `queryKey` arrays; default options (no custom config).
- Query keys use a `*Keys` factory per domain (e.g. `['mangas', 'list', page, ...]`, `['mangas', 'detail', id]`).
- After any mutation, `invalidateQueries({ queryKey: <domainPrefix> })` refetches all queries under that domain.

## Building Params

- **Query string**: `{ params }` object passed to axios (filters, pagination).
- **Path params**: template URLs like `/mangas/${id}`.
- **File uploads**: `FormData` with multipart headers; downloads use `responseType: 'blob'`.

## Inventory

- **Services + hooks per domain**: mangas (CRUD, flag, chapters, translations, import, reader), authors, genres, translators, languages, tracking sources/config, file upload/download.
- **Hook families**: one `useXList/useX` read + one `useCreateX/useUpdateX/useDeleteX` write per domain; plus special-purpose hooks (`useBatchImport`, `useReaderPages`, `useCoverUpload`, `useFileDownload`).