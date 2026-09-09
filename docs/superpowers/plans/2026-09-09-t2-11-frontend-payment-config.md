# T2-11 Frontend Payment Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Admin `Cấu hình thanh toán` page with editable payment config, allowed-price chips, and paginated audit history.

**Architecture:** Add typed API functions, centralized query keys, React Query hooks, Zod schema helpers, focused Admin payment-config components, a two-tab App Router page, and a sidebar nav item. Keep all interactive UI in client components and follow existing Admin page patterns.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TanStack Query, Zod, react-hook-form, Tailwind CSS v4, shadcn/Base UI, pnpm.

---

## Required Skills By Task

- Use `superpowers:test-driven-development` where feasible for behavior-bearing utility/schema work; this FE repo has no test framework, so validate with typecheck/build instead of invented tests.
- Use `nextjs` for App Router page/navigation changes and read relevant local docs before editing Next files.
- Use `vercel-react-best-practices` for React component/data-fetching decisions.
- Use `frontend-design` and `ui-ux-pro-max` for page/component UX decisions.
- Use `shadcn-ui` or `shadcn` when composing existing shadcn/Base UI components.
- Use `systematic-debugging` if lint/typecheck/build fails unexpectedly.
- Use `verification-before-completion` before claiming completion.
- Use `requesting-code-review` after implementation and verification pass.

If a skill loader fails with the known `Expand-Archive` PowerShell module issue, read the skill file directly and continue following it.

## File Map

- Create `services/api/payment-config.ts`: typed backend calls for config and audit history.
- Modify `lib/query-keys.ts`: add `adminPaymentConfigKeys` and import audit filter type.
- Create `hooks/useAdminPaymentConfig.ts`: queries, mutation, invalidation, save error mapping.
- Create `lib/schemas/payment-config.ts`: Zod schema, labels, VND formatter, price sorting helpers.
- Create `components/admin/payment-config/payment-config-form.tsx`: editable config tab form and chip editor.
- Create `components/admin/payment-config/payment-config-audit-table.tsx`: audit tab table, loading/error/empty states.
- Create `app/(admin)/admin/payment-config/page.tsx`: two-tab Admin page and audit pagination state.
- Modify `components/admin-sidebar.tsx`: add `Cấu hình thanh toán` nav item.

Do not commit during execution unless the user explicitly asks for commits.

---

### Task 1: Add Payment Config API Client

**Related skills:** `superpowers:test-driven-development`, `vercel-react-best-practices`

**Files:**
- Create: `services/api/payment-config.ts`

- [ ] **Step 1: Create typed API file**

Create `services/api/payment-config.ts`:

```ts
import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export type PaymentConfigCurrency = "VND";

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
  changedFields: Array<keyof PaymentConfigSnapshot>;
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

function buildPaymentConfigAuditQuery(
  filters: PaymentConfigAuditFilters = {},
): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const { data } = await axiosClient.get<ApiSuccessResponse<PaymentConfig>>(
    "/payment/config",
  );

  return data.data;
}

export async function updatePaymentConfig(
  payload: UpdatePaymentConfigPayload,
): Promise<PaymentConfig> {
  const { data } = await axiosClient.put<ApiSuccessResponse<PaymentConfig>>(
    "/payment/config",
    payload,
  );

  return data.data;
}

export async function listPaymentConfigAudits(
  filters: PaymentConfigAuditFilters = {},
): Promise<PaymentConfigAuditList> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<PaymentConfigAuditList>
  >(`/payment/config/audits${buildPaymentConfigAuditQuery(filters)}`);

  return data.data;
}
```

- [ ] **Step 2: Verify API types compile**

Run: `pnpm exec tsc --noEmit`

Expected: PASS or only unrelated pre-existing type errors. If it fails on this file, fix before continuing.

---

### Task 2: Add Query Keys And Hooks

**Related skills:** `superpowers:test-driven-development`, `vercel-react-best-practices`, `systematic-debugging` if verification fails

**Files:**
- Modify: `lib/query-keys.ts`
- Create: `hooks/useAdminPaymentConfig.ts`

- [ ] **Step 1: Add query keys**

Modify `lib/query-keys.ts`:

```ts
import type { PaymentConfigAuditFilters } from "@/services/api/payment-config";
```

Add:

```ts
export const adminPaymentConfigKeys = {
  all: ["admin-payment-config"] as const,
  detail: () => [...adminPaymentConfigKeys.all, "detail"] as const,
  audits: (filters: PaymentConfigAuditFilters) =>
    [...adminPaymentConfigKeys.all, "audits", filters] as const,
};
```

- [ ] **Step 2: Create hooks file**

Create `hooks/useAdminPaymentConfig.ts`:

```ts
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from "@/constants/constants";
import { adminPaymentConfigKeys } from "@/lib/query-keys";
import {
  getPaymentConfig,
  listPaymentConfigAudits,
  updatePaymentConfig,
  type PaymentConfig,
  type PaymentConfigAuditFilters,
  type UpdatePaymentConfigPayload,
} from "@/services/api/payment-config";
import { isApiErrorResponse } from "@/services/axios";

export interface PaymentConfigFailure {
  formError: string;
}

export interface PaymentConfigResult {
  ok: boolean;
  failure?: PaymentConfigFailure;
}

function mapPaymentConfigError(error: unknown): PaymentConfigFailure {
  if (!isAxiosError(error) || !error.response) {
    return { formError: NETWORK_ERROR_MESSAGE };
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return { formError: GENERIC_ERROR_MESSAGE };
  }

  if (status === 403) {
    return { formError: "Bạn không có quyền thực hiện thao tác này." };
  }

  if (status === 400) {
    return {
      formError:
        data.error.message || "Dữ liệu cấu hình thanh toán không hợp lệ.",
    };
  }

  return { formError: data.error.message || GENERIC_ERROR_MESSAGE };
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: adminPaymentConfigKeys.detail(),
    queryFn: getPaymentConfig,
  });
}

export function usePaymentConfigAudits(
  filters: PaymentConfigAuditFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: adminPaymentConfigKeys.audits(filters),
    queryFn: () => listPaymentConfigAudits(filters),
    enabled,
  });
}

export function useUpdatePaymentConfig() {
  const queryClient = useQueryClient();
  const mutation = useMutation<
    PaymentConfig,
    unknown,
    UpdatePaymentConfigPayload
  >({
    mutationFn: updatePaymentConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminPaymentConfigKeys.all,
      });
      toast.add({ title: "Đã lưu cấu hình thanh toán.", type: "success" });
    },
  });

  async function updateConfig(
    payload: UpdatePaymentConfigPayload,
  ): Promise<PaymentConfigResult> {
    try {
      await mutation.mutateAsync(payload);
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: mapPaymentConfigError(error) };
    }
  }

  return { updateConfig, isPending: mutation.isPending };
}
```

- [ ] **Step 3: Verify hooks compile**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 3: Add Validation Schema And Formatting Helpers

**Related skills:** `superpowers:test-driven-development`, `frontend-design`

**Files:**
- Create: `lib/schemas/payment-config.ts`

- [ ] **Step 1: Create schema file**

Create `lib/schemas/payment-config.ts`:

```ts
import { z } from "zod";

export const PAYMENT_CONFIG_CURRENCIES = ["VND"] as const;

export const PAYMENT_CONFIG_FIELD_LABELS = {
  platformFeePercent: "Phí nền tảng",
  currency: "Tiền tệ",
  allowedPrices: "Danh sách giá",
  freeCourseLimit: "Giới hạn khóa học miễn phí",
  minimumWithdrawalAmount: "Rút tiền tối thiểu",
  updatedById: "Người cập nhật",
} as const;

export function sortPrices(prices: number[]): number[] {
  return [...prices].sort((a, b) => a - b);
}

export function formatVndAmount(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const paymentConfigSchema = z
  .object({
    platformFeePercent: z
      .number("Phí nền tảng là bắt buộc")
      .min(0, "Phí nền tảng không được nhỏ hơn 0%")
      .max(100, "Phí nền tảng không được lớn hơn 100%"),
    currency: z.enum(PAYMENT_CONFIG_CURRENCIES),
    allowedPrices: z
      .array(
        z
          .number("Giá khóa học là bắt buộc")
          .int("Giá khóa học phải là số nguyên")
          .min(0, "Giá khóa học không được âm"),
      )
      .nonempty("Danh sách giá không được trống"),
    freeCourseLimit: z
      .number()
      .int("Giới hạn khóa học miễn phí phải là số nguyên")
      .min(0, "Giới hạn khóa học miễn phí không được âm")
      .nullable(),
    minimumWithdrawalAmount: z
      .number("Số tiền rút tối thiểu là bắt buộc")
      .int("Số tiền rút tối thiểu phải là số nguyên")
      .min(1, "Số tiền rút tối thiểu phải lớn hơn 0"),
  })
  .superRefine((value, ctx) => {
    if (!value.allowedPrices.includes(0)) {
      ctx.addIssue({
        code: "custom",
        path: ["allowedPrices"],
        message: "Danh sách giá phải bao gồm 0 VND cho khóa học miễn phí",
      });
    }

    if (new Set(value.allowedPrices).size !== value.allowedPrices.length) {
      ctx.addIssue({
        code: "custom",
        path: ["allowedPrices"],
        message: "Danh sách giá không được trùng lặp",
      });
    }
  });

export type PaymentConfigFormValues = z.infer<typeof paymentConfigSchema>;
```

- [ ] **Step 2: Verify schema compiles**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 4: Build Payment Config Form Component

**Related skills:** `frontend-design`, `ui-ux-pro-max`, `shadcn-ui`, `vercel-react-best-practices`, `systematic-debugging` if verification fails

**Files:**
- Create: `components/admin/payment-config/payment-config-form.tsx`

- [ ] **Step 1: Create component shell and props**

Create `components/admin/payment-config/payment-config-form.tsx` as a client component. Props:

```ts
interface PaymentConfigFormProps {
  config: PaymentConfig | undefined;
  isError: boolean;
  isPending: boolean;
  onRefetch: () => void;
}
```

Use imports from existing UI components: `Alert`, `Button`, `Card`, `Checkbox`, `Field`, `InputGroup`, `Select`, `Badge`, `Skeleton`, and `toast` via hook.

- [ ] **Step 2: Implement loading/error states**

Loading state:

```tsx
if (isPending) {
  return <Skeleton className="h-96 w-full" />;
}
```

Error state:

```tsx
if (isError || !config) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Không thể tải cấu hình thanh toán</AlertTitle>
      <AlertDescription>Vui lòng thử lại sau.</AlertDescription>
      <Button size="sm" variant="outline" className="mt-3" onClick={onRefetch}>
        Thử lại
      </Button>
    </Alert>
  );
}
```

- [ ] **Step 3: Implement form state**

Use `useForm<PaymentConfigFormValues>` with `zodResolver(paymentConfigSchema)` and defaults from `config`:

```ts
const form = useForm<PaymentConfigFormValues>({
  resolver: zodResolver(paymentConfigSchema),
  defaultValues: {
    platformFeePercent: config.platformFeePercent,
    currency: config.currency,
    allowedPrices: sortPrices(config.allowedPrices),
    freeCourseLimit: config.freeCourseLimit,
    minimumWithdrawalAmount: config.minimumWithdrawalAmount,
  },
});
```

Use `useEffect` to reset the form when `config.id` or `config.updatedAt` changes.

- [ ] **Step 4: Implement price chip editor**

Use local `priceDraft` string state. Add price behavior:

```ts
function addPrice() {
  const parsedPrice = Number(priceDraft);
  const currentPrices = form.getValues("allowedPrices");

  if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
    form.setError("allowedPrices", {
      type: "manual",
      message: "Giá thêm mới phải là số nguyên lớn hơn 0",
    });
    return;
  }

  if (currentPrices.includes(parsedPrice)) {
    form.setError("allowedPrices", {
      type: "manual",
      message: "Giá này đã tồn tại trong danh sách",
    });
    return;
  }

  form.setValue("allowedPrices", sortPrices([...currentPrices, parsedPrice]), {
    shouldDirty: true,
    shouldValidate: true,
  });
  setPriceDraft("");
}

function removePrice(price: number) {
  if (price === 0) return;
  form.setValue(
    "allowedPrices",
    form.getValues("allowedPrices").filter((item) => item !== price),
    { shouldDirty: true, shouldValidate: true },
  );
}
```

Render each price as `Badge`. Render `0 VND` with text `Miễn phí` and no remove button.

- [ ] **Step 5: Implement submit**

Use `useUpdatePaymentConfig()`:

```ts
async function onSubmit(values: PaymentConfigFormValues) {
  setFormError(null);
  const result = await updateConfig({
    ...values,
    allowedPrices: sortPrices(values.allowedPrices),
  });

  if (!result.ok) {
    setFormError(result.failure?.formError ?? "Không thể lưu cấu hình.");
  }
}
```

- [ ] **Step 6: Render fields and actions**

Render inside `Card`:

- `platformFeePercent` numeric input.
- `currency` select with `VND` only.
- `allowedPrices` chip editor and add input.
- `freeCourseLimit` numeric input plus `Không giới hạn` checkbox mapping to `null`.
- `minimumWithdrawalAmount` numeric input.
- Save button with loading label `Đang lưu...`.
- Reset button that calls `form.reset(defaultValuesFromConfig)`.
- Saved timestamp using existing `formatDate` from `@/utils/dateTimeUtil` if available.

For numeric inputs registered through React Hook Form, use `valueAsNumber: true` or controlled conversion so `paymentConfigSchema` receives numbers rather than strings.

- [ ] **Step 7: Verify component compiles**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 5: Build Audit Table Component

**Related skills:** `frontend-design`, `ui-ux-pro-max`, `shadcn-ui`, `vercel-react-best-practices`

**Files:**
- Create: `components/admin/payment-config/payment-config-audit-table.tsx`

- [ ] **Step 1: Create audit table props and helpers**

Create `components/admin/payment-config/payment-config-audit-table.tsx` as a client component. Props:

```ts
interface PaymentConfigAuditTableProps {
  items: PaymentConfigAudit[];
  isError: boolean;
  isPending: boolean;
  onRefetch: () => void;
}
```

Add helper:

```ts
function formatAuditValue(field: keyof PaymentConfigSnapshot, value: unknown): string {
  if (field === "platformFeePercent") return `${value}%`;
  if (field === "allowedPrices" && Array.isArray(value)) {
    return value.map((price) => formatVndAmount(Number(price))).join(", ");
  }
  if (field === "minimumWithdrawalAmount" && typeof value === "number") {
    return formatVndAmount(value);
  }
  if (field === "freeCourseLimit") return value === null ? "Không giới hạn" : String(value);
  return String(value ?? "-");
}
```

- [ ] **Step 2: Render loading/error/empty states**

Loading: five row skeletons.

Error: destructive alert with retry button.

Empty: centered empty state text `Chưa có lịch sử thay đổi`.

- [ ] **Step 3: Render audit table**

Columns:

- `Thời gian`
- `Người thay đổi`
- `Trường thay đổi`
- `Giá trị cũ`
- `Giá trị mới`

For each row:

- Format `createdAt` with `formatDate`.
- Show `actorId`.
- Render field labels from `PAYMENT_CONFIG_FIELD_LABELS`.
- Summarize previous/new changed field values compactly.

- [ ] **Step 4: Verify component compiles**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 6: Create Admin Page With Two Tabs

**Related skills:** `nextjs`, `frontend-design`, `ui-ux-pro-max`, `vercel-react-best-practices`, `shadcn-ui`

**Files:**
- Create: `app/(admin)/admin/payment-config/page.tsx`

- [ ] **Step 1: Confirm Next docs were read**

Before editing the App Router page, confirm these local docs have been read:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

- [ ] **Step 2: Create page file**

Create `app/(admin)/admin/payment-config/page.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { PaymentConfigAuditTable } from "@/components/admin/payment-config/payment-config-audit-table";
import { PaymentConfigForm } from "@/components/admin/payment-config/payment-config-form";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePaymentConfig,
  usePaymentConfigAudits,
} from "@/hooks/useAdminPaymentConfig";
import type { PaymentConfigAuditFilters } from "@/services/api/payment-config";

const AUDIT_PAGE_SIZE = 10;

export default function AdminPaymentConfigPage() {
  const [activeTab, setActiveTab] = useState("config");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(AUDIT_PAGE_SIZE);
  const auditFilters = useMemo<PaymentConfigAuditFilters>(
    () => ({ page: auditPage, limit: auditPageSize }),
    [auditPage, auditPageSize],
  );
  const configQuery = usePaymentConfig();
  const auditQuery = usePaymentConfigAudits(auditFilters, activeTab === "audit");
  const audits = auditQuery.data?.items ?? [];
  const totalAudits = auditQuery.data?.total ?? 0;
  const totalAuditPages = auditQuery.data?.totalPages ?? 0;

  function handleAuditPageSizeChange(size: number) {
    setAuditPageSize(size);
    setAuditPage(1);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Cấu hình thanh toán</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý phí nền tảng, danh sách giá khóa học, giới hạn khóa học miễn phí và mức rút tiền tối thiểu.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">Cấu hình</TabsTrigger>
          <TabsTrigger value="audit">Lịch sử thay đổi</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <PaymentConfigForm
            config={configQuery.data}
            isError={configQuery.isError}
            isPending={configQuery.isPending}
            onRefetch={() => configQuery.refetch()}
          />
        </TabsContent>

        <TabsContent value="audit">
          <div className="flex flex-col gap-4">
            <PaymentConfigAuditTable
              items={audits}
              isError={auditQuery.isError}
              isPending={auditQuery.isPending}
              onRefetch={() => auditQuery.refetch()}
            />
            {!auditQuery.isError && !auditQuery.isPending && totalAudits > 0 && (
              <Pagination
                page={auditPage}
                totalPages={totalAuditPages}
                totalItems={totalAudits}
                pageSize={auditPageSize}
                onPageChange={setAuditPage}
                onPageSizeChange={handleAuditPageSizeChange}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

The hook already supports the `enabled` flag, so audit history fetches only after the audit tab is selected.

- [ ] **Step 3: Verify page compiles**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 7: Add Admin Sidebar Navigation

**Related skills:** `nextjs`, `frontend-design`, `ui-ux-pro-max`

**Files:**
- Modify: `components/admin-sidebar.tsx`

- [ ] **Step 1: Add icon import**

Use a suitable Hugeicons icon available from `@hugeicons/core-free-icons`, for example `Settings01Icon` if exported. If that exact icon is not available, inspect package exports and choose a settings/payment icon.

- [ ] **Step 2: Add nav item**

Add to `adminNavItems`:

```ts
{
  title: "Cấu hình thanh toán",
  href: "/admin/payment-config",
  icon: Settings01Icon,
},
```

Place it after `Duyệt khóa học` unless product wants it earlier.

- [ ] **Step 3: Verify sidebar active state**

The existing active-state logic already handles nested paths. Confirm `/admin/payment-config` activates this item.

- [ ] **Step 4: Verify navigation compiles**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

---

### Task 8: Full Frontend Verification

**Related skills:** `verification-before-completion`, `systematic-debugging` if any command fails

**Files:**
- No code changes unless verification exposes a real issue.

- [ ] **Step 1: Run lint**

Run: `pnpm lint`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `pnpm build`

Expected: PASS and route list includes `/admin/payment-config`.

- [ ] **Step 4: Inspect final diff/status**

Run: `git status --short`

Expected intended files only:

```txt
app/(admin)/admin/payment-config/page.tsx
components/admin-sidebar.tsx
components/admin/payment-config/payment-config-audit-table.tsx
components/admin/payment-config/payment-config-form.tsx
docs/superpowers/plans/2026-09-09-t2-11-frontend-payment-config.md
docs/superpowers/specs/2026-09-09-t2-11-frontend-payment-config-design.md
hooks/useAdminPaymentConfig.ts
lib/query-keys.ts
lib/schemas/payment-config.ts
services/api/payment-config.ts
```

---

### Task 9: Review Readiness

**Related skills:** `requesting-code-review`, `verification-before-completion`

**Files:**
- No code changes unless review finds issues.

- [ ] **Step 1: Request focused review**

Review should check:

- Sidebar item label and route are correct.
- Page uses two tabs and defaults to config tab.
- Audit query is enabled only on audit tab or otherwise avoids unnecessary UX problems.
- Price chip editor keeps `0 VND` locked and rejects duplicates.
- Form payload matches backend numeric contract.
- Save invalidates config and audit queries.
- Audit table correctly summarizes changed fields.
- Loading, error, empty, and saved states exist.
- Desktop/mobile layout remains usable.

- [ ] **Step 2: Fix valid review findings**

Apply the smallest correct changes and rerun:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

- [ ] **Step 3: Final handoff**

Report changed files, verification output, and residual risks such as no automated FE tests in this repo.
