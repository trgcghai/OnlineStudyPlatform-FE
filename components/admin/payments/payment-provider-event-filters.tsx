"use client";

import {
  CalendarDays,
  Landmark,
  RadioTower,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminProviderEventResult,
  PaymentStatus,
} from "@/services/api/payment";

export type ProviderEventResultFilter = "" | AdminProviderEventResult;
export type ProviderEventPaymentStatusFilter = "" | PaymentStatus;

const RESULT_LABELS: Record<ProviderEventResultFilter, string> = {
  "": "Tất cả kết quả",
  processed_paid: "Đã xử lý",
  duplicate_provider_event: "Webhook trùng",
  duplicate_payment: "Thanh toán trùng",
  amount_mismatch: "Sai số tiền",
  expired: "Hết hạn",
  unknown_payment_code: "Mã không khớp",
  ignored_transfer_type: "Bỏ qua",
};

const STATUS_LABELS: Record<ProviderEventPaymentStatusFilter, string> = {
  "": "Tất cả trạng thái giao dịch",
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function PaymentProviderEventFilters({
  dateFrom,
  dateTo,
  gateway,
  paymentStatus,
  result,
  search,
  transferType,
  onDateFromChange,
  onDateToChange,
  onGatewayChange,
  onPaymentStatusChange,
  onResultChange,
  onSearchChange,
  onTransferTypeChange,
}: {
  dateFrom: string;
  dateTo: string;
  gateway: string;
  paymentStatus: ProviderEventPaymentStatusFilter;
  result: ProviderEventResultFilter;
  search: string;
  transferType: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onGatewayChange: (value: string) => void;
  onPaymentStatusChange: (value: ProviderEventPaymentStatusFilter) => void;
  onResultChange: (value: ProviderEventResultFilter) => void;
  onSearchChange: (value: string) => void;
  onTransferTypeChange: (value: string) => void;
}) {
  const hasActiveFilters = Boolean(
    dateFrom ||
    dateTo ||
    gateway ||
    paymentStatus ||
    result ||
    search ||
    transferType,
  );

  function clearFilters() {
    onSearchChange("");
    onResultChange("");
    onPaymentStatusChange("");
    onDateFromChange("");
    onDateToChange("");
    onTransferTypeChange("");
    onGatewayChange("");
  }

  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium">Bộ lọc sự kiện</p>
            <p className="text-xs text-muted-foreground">
              Lọc theo kết quả xử lý, giao dịch liên kết, thời gian và gateway.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
        >
          <X />
          Xóa lọc
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_repeat(4,minmax(9rem,12rem))]">
        <form onSubmit={(event) => event.preventDefault()}>
          <FilterField label="Tìm kiếm">
            <InputGroup className="bg-background">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Provider TX, mã báo cáo..."
                aria-label="Tìm kiếm sự kiện nhà cung cấp"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
              <InputGroupButton
                type="submit"
                variant="ghost"
                size="icon-xs"
                aria-label="Tìm kiếm"
              >
                <Search />
              </InputGroupButton>
            </InputGroup>
          </FilterField>
        </form>

        <FilterField label="Kết quả">
          <Select
            value={result}
            onValueChange={(value) =>
              onResultChange(value as ProviderEventResultFilter)
            }
            items={RESULT_LABELS}
          >
            <SelectTrigger
              className="w-full bg-background"
              aria-label="Lọc kết quả sự kiện"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RESULT_LABELS) as ProviderEventResultFilter[]).map(
                (value) => (
                  <SelectItem key={value || "all"} value={value}>
                    {RESULT_LABELS[value]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Trạng thái giao dịch">
          <Select
            value={paymentStatus}
            onValueChange={(value) =>
              onPaymentStatusChange(value as ProviderEventPaymentStatusFilter)
            }
            items={STATUS_LABELS}
          >
            <SelectTrigger
              className="w-full bg-background"
              aria-label="Lọc trạng thái giao dịch liên kết"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.keys(STATUS_LABELS) as ProviderEventPaymentStatusFilter[]
              ).map((value) => (
                <SelectItem key={value || "all"} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Từ ngày nhận">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <CalendarDays />
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              aria-label="Từ ngày nhận"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Đến ngày nhận">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <CalendarDays />
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              aria-label="Đến ngày nhận"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Loại chuyển khoản">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <RadioTower />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Loại chuyển khoản"
              value={transferType}
              onChange={(event) => onTransferTypeChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Gateway">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <Landmark />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Gateway"
              value={gateway}
              onChange={(event) => onGatewayChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
      </div>
    </div>
  );
}
