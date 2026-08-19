# Manga Reader API, Hook, and TanStack Query Organization

This document summarizes how `F:\Cntt\vibe\manga-reader\frontend` organizes server communication. It is a reference document for studying that project's API/query pattern, not a description of this Next.js frontend's current API implementation.

## Stack

- HTTP client: `axios`.
- Server state: `@tanstack/react-query`.
- Routing: `@tanstack/react-router`.
- Local client state: `zustand` with `persist` middleware.
- Toast feedback: `sonner`.
- Import alias: `#/*` maps to `src/*`.

## High-Level Flow

```text
Component or route
-> domain hook in src/hooks
-> domain API function in src/services/api
-> shared axios instance
-> backend endpoint
```

- Components and routes call hooks such as `useMangaList`, `useGenreList`, or `useCreateGenre`.
- Hooks wrap plain API functions with `useQuery`, `useMutation`, cache keys, invalidation, and toast side effects.
- API functions are small async functions that build URLs, query params, request bodies, and return typed `res.data`.
- The shared axios instance unwraps the backend response envelope, so API functions receive the actual `data` payload instead of the full envelope.

## Shared Axios Instance

File: `src/services/api/api.ts`

- Creates one `axiosInstance` with `baseURL: import.meta.env.VITE_API_URL`.
- Sends cookies with `withCredentials: true`.
- Sets JSON content type by default.
- Defines a response envelope type:
  - success: `{ success: true, data, timestamp }`
  - failure: `{ success: false, data: null, error, timestamp }`
- Response interceptor behavior:
  - Blob responses are returned unchanged.
  - HTTP 204 responses are returned unchanged.
  - Successful envelope responses are unwrapped by assigning `response.data = body.data`.
  - Failed envelope responses reject with `body.error`.
  - Network errors reject with `{ code: 0, message: 'Network error', details: [] }`.

## API Service Layer

Folder: `src/services/api`

Each domain has a file of typed functions. These functions do not know about React or TanStack Query.

| File | Responsibility |
| --- | --- |
| `api.ts` | Shared axios instance and response unwrapping. |
| `mangaApi.ts` | Manga list/detail, create/update/delete, reading flag, import template, import file, chapters, translations, reader chapters. |
| `authorApi.ts` | Author list/detail/create/update/delete. |
| `genreApi.ts` | Genre list/detail/create/update/delete. |
| `translatorApi.ts` | Translator list/detail/create/update/delete. |
| `languageApi.ts` | Language list. |
| `trackingApi.ts` | Tracking source CRUD, tracking config, manual source checks. |
| `fileApi.ts` | Cover upload, translation upload, file download. |

Common service patterns:

- Query params use axios `{ params }`, for example pagination and search filters.
- Path params use template strings, for example `/mangas/${id}`.
- JSON writes use `post`, `patch`, or `delete` with typed payload interfaces.
- Uploads use `FormData` and `Content-Type: multipart/form-data`.
- Downloads and import templates use `responseType: 'blob'`.

Example service shape:

```ts
export async function getGenres(
  page: number = 1,
  limit: number = 20,
  search?: string,
): Promise<PaginatedGenreResponse> {
  const params: Record<string, string | number> = { page, limit }
  if (search) params.search = search

  const { data } = await axiosInstance.get<PaginatedGenreResponse>('/genres', {
    params,
  })
  return data
}
```

## Hook Layer

Folder: `src/hooks`

Hooks are the boundary between React components and API services.

Read hooks:

- Use `useQuery`.
- Provide a stable `queryKey`.
- Call a service function in `queryFn`.
- Use `enabled` when required IDs or params may be missing.

Write hooks:

- Use `useMutation`.
- Call a service function in `mutationFn`.
- Use `onSuccess` to invalidate related query keys and show success toasts.
- Use `onError` to show error toasts or log errors.

Examples:

- `useMangaList(params)` calls `getAllMangas(params)`.
- `useManga(id, { include })` calls `getManga(id, include)` and is disabled until `id` exists.
- `useCreateManga()` calls `createManga(data)`, invalidates manga queries, and shows a toast.
- `useGenreList(page, limit, search)` calls `getGenres(page, limit, search)`.
- `useDeleteGenre()` calls `deleteGenre(id)`, invalidates genre queries, and shows a toast.
- `useTrackingSources(params)` calls `getTrackingSources(params)`.
- `useCheckMangaSources()` runs a manual mutation and invalidates tracking source lists only if updates are found.

## Cache Key Pattern

Most domains define a local key factory inside the hook file.

Example from the manga hooks:

```ts
const mangaKeys = {
  all: ['mangas'] as const,
  list: (params) => [
    ...mangaKeys.all,
    'list',
    params.page,
    params.limit,
    params.search,
    params.status,
    params.authors,
    params.genres,
    params.readingFlag,
  ] as const,
  detail: (id: number) => [...mangaKeys.all, 'detail', id] as const,
}
```

Observed key conventions:

- Domain prefix: `['mangas']`, `['genres']`, `['authors']`, `['translators']`, `['languages']`, `['tracking']`.
- Lists include all inputs that affect the result, such as `page`, `limit`, `search`, filters, or `mangaId`.
- Details include the ID, for example `['genres', 'detail', id]`.
- Some special keys are inline rather than factory-based, for example `['mangas', 'import-template']` and `['manga', 'translations', id]`.
- Mutations usually invalidate the domain prefix, for example `invalidateQueries({ queryKey: mangaKeys.all })`.
- Targeted invalidation is used for detail refreshes, for example `['mangas', 'detail', mangaId]` after chapter or translation changes.

## TanStack Query Provider

File: `src/routes/__root.tsx`

- Creates `queryClient = new QueryClient()` with default options.
- Wraps the app shell with `<QueryClientProvider client={queryClient}>`.
- Also renders shared UI providers such as tooltip and toaster providers.
- TanStack Router devtools are configured separately.

## Request States in Components

Components consume TanStack Query state directly from hooks.

Read query states:

- `isLoading`: render skeletons or loading placeholders.
- `isError`: render an error display, sometimes with a retry button using `refetch()`.
- `data`: treated as the success state. Components render tables, cards, pagination, or empty states once data exists.

Example usage from route components:

```ts
const { data, isLoading, isError, refetch } = useMangaList({
  page,
  limit: pageSize,
  search: debouncedSearch || undefined,
})

if (isLoading) return <Skeleton />
if (isError) return <ErrorDisplay />
return <MangaGrid data={data} />
```

Mutation states:

- `isPending`: disables buttons and shows spinners during writes.
- `mutate(payload, { onSuccess })`: components can add per-call behavior such as closing dialogs after the hook-level success handler runs.
- Hook-level `onError` handles common toast messages.

Example mutation usage:

```ts
const createMutation = useCreateGenre()

createMutation.mutate(
  { name: name.trim() },
  {
    onSuccess: () => {
      setName('')
      onOpenChange(false)
    },
  },
)
```

## Local State vs Server State

Server state is stored in TanStack Query. Local UI state stays in React state or Zustand.

React local state examples:

- Search input values.
- Debounced search text.
- Pagination page and page size.
- Dialog open/close state.
- Currently selected item for edit/delete dialogs.

Zustand store:

- File: `src/stores/rootStore.ts`.
- Store: `useReaderStore`.
- Persists reader-specific state under `manga-reader-store`.
- Tracks current translation, current chapter, current page, total pages, reading mode, display mode, and scroll position.
- Uses SSR-safe localStorage access wrapped in `try/catch`.

Custom async state outside TanStack Query:

- `useBatchImport(mangaId)` manages `isRunning`, `progress`, and an `isRunningRef` manually because it performs a sequential multi-file import loop.
- It still uses `useQueryClient()` to invalidate `['mangas', 'detail', mangaId]` after the batch finishes.

## Outliers

- `useBatchImport` is not a `useMutation`; it exposes a custom `mutate` callback with manual progress tracking.
- File upload/download helpers are plain API functions, but `useFile.ts` wraps them in `useMutation` hooks: `useCoverUpload`, `useTranslationFileUpload`, and `useFileDownload`.
- `useReaderPages(url)` builds on `useFileDownload().mutateAsync`, parses the downloaded blob into page object URLs, returns `{ pages, isLoading, error }`, and writes `totalPages` into the Zustand reader store.
- Error handling assumes many errors are `Error` instances, but the axios interceptor can reject with a plain API error payload. In those cases the fallback message is used unless the code handles the payload shape explicitly.

## Pattern to Reuse

For a new domain in that architecture:

1. Add typed API functions in `src/services/api/<domain>Api.ts`.
2. Use only the shared `axiosInstance`.
3. Add a hook file in `src/hooks/use<Domain>.ts`.
4. Define a local `<domain>Keys` factory with `all`, `list`, and `detail` keys where relevant.
5. Wrap reads in `useQuery` and writes in `useMutation`.
6. Include every filter/pagination input in list query keys.
7. Gate detail queries with `enabled: !!id` when the ID can be absent.
8. Invalidate the smallest practical query prefix after writes.
9. Let components render `isLoading`, `isError`, empty, and success states explicitly.
10. Use `isPending` for mutation button disabled/spinner states.
