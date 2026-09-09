# T2-11 Frontend Design: Admin Payment Configuration

## Context

T2-11 adds Admin-managed monetization rules used by later paid-course work. The frontend needs an Admin page where Admin can view and edit payment configuration, plus inspect audit history for configuration changes.

Backend contract implemented for this task:

- `GET /payment/config`
- `PUT /payment/config`
- `GET /payment/config/audits?page=1&limit=10`

All endpoints are Admin-only on the backend. The frontend Admin route group is already protected by `AuthGuard` in `app/(admin)/layout.tsx`.

## Decisions

- Use one Admin page with two tabs.
- Add one sidebar item with label `Cấu hình thanh toán`.
- Use route `/admin/payment-config`.
- Config tab contains the editable payment configuration form.
- Audit tab contains paginated audit history.
- Allowed prices use chips plus an add-price input.
- Keep `0 VND` as the free-course price and do not allow removing it.
- Use existing frontend conventions: typed API functions in `services/api`, query hooks in `hooks`, query keys in `lib/query-keys.ts`, Zod schemas in `lib/schemas`, and shadcn/Base UI components.

## Route And Navigation

Add route:

```txt
app/(admin)/admin/payment-config/page.tsx
```

Update `components/admin-sidebar.tsx`:

- Add nav item label: `Cấu hình thanh toán`
- Add href: `/admin/payment-config`
- Use an existing Hugeicons icon that fits payments/settings. If no payment icon is already imported, use a simple settings/configuration icon from `@hugeicons/core-free-icons`.

## API Layer

Create:

```txt
services/api/payment-config.ts
```

Types:

```ts
export type PaymentConfigCurrency = 'VND';

export interface PaymentConfig {
  id: string;
  platformFeePercent: number;
  currency: PaymentConfigCurrency;
  allowedPrices: number[];
  freeCourseLimit: number | null;
  minimumWithdrawalAmount: number;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePaymentConfigPayload {
  platformFeePercent: number;
  currency: PaymentConfigCurrency;
  allowedPrices: number[];
  freeCourseLimit: number | null;
  minimumWithdrawalAmount: number;
}

export interface PaymentConfigSnapshot extends UpdatePaymentConfigPayload {
  updatedById: string | null;
}

export interface PaymentConfigAudit {
  id: string;
  configId: string;
  actorId: string;
  previousValue: PaymentConfigSnapshot;
  newValue: PaymentConfigSnapshot;
  changedFields: string[];
  createdAt: string;
}

export interface PaymentConfigAuditFilters {
  page?: number;
  limit?: number;
}

export interface PaymentConfigAuditList {
  items: PaymentConfigAudit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

Functions:

```ts
getPaymentConfig(): Promise<PaymentConfig>
updatePaymentConfig(payload: UpdatePaymentConfigPayload): Promise<PaymentConfig>
listPaymentConfigAudits(filters?: PaymentConfigAuditFilters): Promise<PaymentConfigAuditList>
```

Build audit query strings with `URLSearchParams`, matching existing service patterns.

## Query Layer

Modify `lib/query-keys.ts`:

```ts
export const adminPaymentConfigKeys = {
  all: ['admin-payment-config'] as const,
  detail: () => [...adminPaymentConfigKeys.all, 'detail'] as const,
  audits: (filters: PaymentConfigAuditFilters) =>
    [...adminPaymentConfigKeys.all, 'audits', filters] as const,
};
```

Create:

```txt
hooks/useAdminPaymentConfig.ts
```

Hooks:

- `usePaymentConfig()` calls `getPaymentConfig()`.
- `usePaymentConfigAudits(filters)` calls `listPaymentConfigAudits(filters)`.
- `useUpdatePaymentConfig()` calls `updatePaymentConfig(payload)`, invalidates `adminPaymentConfigKeys.all`, and shows success toast.

Error mapping should follow existing Admin hooks:

- Network/no response: `NETWORK_ERROR_MESSAGE`
- Unknown response shape: `GENERIC_ERROR_MESSAGE`
- `403`: `Bạn không có quyền thực hiện thao tác này.`
- `400`: use backend message when available, otherwise generic validation message.

## Validation Schema

Create:

```txt
lib/schemas/payment-config.ts
```

Schema should validate form data before submit:

- `platformFeePercent`: number between `0` and `100`.
- `currency`: exactly `VND`.
- `allowedPrices`: non-empty array of unique non-negative integers and must include `0`.
- `freeCourseLimit`: `null` or non-negative integer.
- `minimumWithdrawalAmount`: positive integer.

Also export helpers:

- `formatVndAmount(amount: number): string`
- `sortPrices(prices: number[]): number[]`
- `PAYMENT_CONFIG_CURRENCIES = ['VND'] as const`

## Page Structure

`app/(admin)/admin/payment-config/page.tsx` is a client component.

Top-level layout:

- Page title: `Cấu hình thanh toán`
- Description: explain these settings control course pricing, platform fee, free-course limit, and minimum withdrawals.
- Tabs: `Cấu hình` and `Lịch sử thay đổi`.

The page owns audit pagination state. The config form owns form draft state.

## Config Tab

Create component:

```txt
components/admin/payment-config/payment-config-form.tsx
```

Responsibilities:

- Render loading skeleton while config is loading.
- Render error alert with retry when config fetch fails.
- Initialize form values from loaded config.
- Validate via Zod before submit.
- Submit to `useUpdatePaymentConfig()`.
- Show field-level validation errors.
- Disable Save button while mutation is pending.
- Show current saved timestamp from `updatedAt`.

Fields:

- Platform fee percentage input.
- Currency select with only `VND`.
- Allowed prices chip editor.
- Free-course limit input with an `Không giới hạn` checkbox/switch that maps to `null`.
- Minimum withdrawal amount input.

Price chip behavior:

- Display sorted prices.
- `0 VND` chip is locked and cannot be removed.
- Add-price input accepts a positive integer VND amount.
- Adding duplicate price shows a field error or inline message.
- Added prices are sorted for display.
- Remove button exists for non-zero prices.

Empty/default state:

- Backend initializes defaults on startup, so normal fetch should always return a config.
- If the config exists and matches default values, display it as editable normal state; no separate empty call-to-action is needed.

## Audit Tab

Create component:

```txt
components/admin/payment-config/payment-config-audit-table.tsx
```

Responsibilities:

- Render loading skeleton while audits load.
- Render error alert with retry when audit fetch fails.
- Render empty state: `Chưa có lịch sử thay đổi`.
- Render paginated audit rows.

Columns:

- `Thời gian`: formatted `createdAt`.
- `Người thay đổi`: `actorId` for now because backend returns only actor ID.
- `Trường thay đổi`: Vietnamese labels for `changedFields`.
- `Giá trị cũ`: compact summary of previous values for changed fields.
- `Giá trị mới`: compact summary of new values for changed fields.

Field labels:

- `platformFeePercent`: `Phí nền tảng`
- `currency`: `Tiền tệ`
- `allowedPrices`: `Danh sách giá`
- `freeCourseLimit`: `Giới hạn khóa học miễn phí`
- `minimumWithdrawalAmount`: `Rút tiền tối thiểu`

Use the shared `Pagination` component under the audit table when there are audit records.

## State And Data Flow

On page load:

1. Fetch payment config.
2. Render config tab by default.
3. Audit query may fetch immediately or only when audit tab is selected. Fetching only when selected is preferred to avoid unnecessary API calls.

On save:

1. Validate form data.
2. Send `PUT /payment/config`.
3. On success, invalidate config and audit queries.
4. Keep the user on the config tab.
5. Show success toast.

On audit pagination:

1. Update audit page/page size state.
2. Query key changes and audit list refetches.

## Error Handling

Config load error:

- Show destructive `Alert` with retry button.

Save error:

- Show form-level alert for permission/network/unknown errors.
- Show backend validation message if available.

Audit load error:

- Show destructive `Alert` with retry button inside the audit tab.

## Verification

Run from `onlinestudyplatform-fe`:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

No frontend test command exists in this repository.

## Open Notes

- Audit rows show `actorId` only because backend currently does not return actor profile details.
- Payment-provider settings are not included in T2-11; this page only handles monetization configuration.
- T2-12 should later reuse `getPaymentConfig()` or a dedicated public/instructor-safe endpoint if instructors need to read allowed price choices.
