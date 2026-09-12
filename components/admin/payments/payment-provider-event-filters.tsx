"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
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
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_repeat(4,minmax(9rem,12rem))]">
      <form onSubmit={(event) => event.preventDefault()}>
        <InputGroup>
          <InputGroupInput
            placeholder="Tìm provider TX, mã báo cáo..."
            aria-label="Tìm kiếm sự kiện nhà cung cấp"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Button type="submit" variant="ghost" size="icon-xs">
            <Search />
          </Button>
        </InputGroup>
      </form>

      <Select
        value={result}
        onValueChange={(value) =>
          onResultChange(value as ProviderEventResultFilter)
        }
        items={RESULT_LABELS}
      >
        <SelectTrigger aria-label="Lọc kết quả sự kiện">
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

      <Select
        value={paymentStatus}
        onValueChange={(value) =>
          onPaymentStatusChange(value as ProviderEventPaymentStatusFilter)
        }
        items={STATUS_LABELS}
      >
        <SelectTrigger aria-label="Lọc trạng thái giao dịch liên kết">
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

      <Input
        type="date"
        aria-label="Từ ngày nhận"
        value={dateFrom}
        onChange={(event) => onDateFromChange(event.target.value)}
      />
      <Input
        type="date"
        aria-label="Đến ngày nhận"
        value={dateTo}
        onChange={(event) => onDateToChange(event.target.value)}
      />
      <Input
        placeholder="Loại chuyển khoản"
        value={transferType}
        onChange={(event) => onTransferTypeChange(event.target.value)}
      />
      <Input
        placeholder="Gateway"
        value={gateway}
        onChange={(event) => onGatewayChange(event.target.value)}
      />
    </div>
  );
}
