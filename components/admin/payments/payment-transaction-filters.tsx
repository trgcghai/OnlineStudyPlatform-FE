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
import type { PaymentStatus } from "@/services/api/payment";

export type PaymentStatusFilter = "" | PaymentStatus;

const STATUS_LABELS: Record<PaymentStatusFilter, string> = {
  "": "Tất cả trạng thái",
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

export function PaymentTransactionFilters({
  amountMax,
  amountMin,
  courseId,
  dateFrom,
  dateTo,
  learnerId,
  search,
  status,
  onAmountMaxChange,
  onAmountMinChange,
  onCourseIdChange,
  onDateFromChange,
  onDateToChange,
  onLearnerIdChange,
  onSearchChange,
  onStatusChange,
}: {
  amountMax: string;
  amountMin: string;
  courseId: string;
  dateFrom: string;
  dateTo: string;
  learnerId: string;
  search: string;
  status: PaymentStatusFilter;
  onAmountMaxChange: (value: string) => void;
  onAmountMinChange: (value: string) => void;
  onCourseIdChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onLearnerIdChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: PaymentStatusFilter) => void;
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_repeat(4,minmax(9rem,12rem))]">
      <form onSubmit={(event) => event.preventDefault()}>
        <InputGroup>
          <InputGroupInput
            placeholder="Tìm mã giao dịch, mã thanh toán..."
            aria-label="Tìm kiếm giao dịch thanh toán"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Button type="submit" variant="ghost" size="icon-xs">
            <Search />
          </Button>
        </InputGroup>
      </form>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as PaymentStatusFilter)}
        items={STATUS_LABELS}
      >
        <SelectTrigger aria-label="Lọc trạng thái giao dịch">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_LABELS) as PaymentStatusFilter[]).map(
            (value) => (
              <SelectItem key={value || "all"} value={value}>
                {STATUS_LABELS[value]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <Input
        type="date"
        aria-label="Từ ngày"
        value={dateFrom}
        onChange={(event) => onDateFromChange(event.target.value)}
      />
      <Input
        type="date"
        aria-label="Đến ngày"
        value={dateTo}
        onChange={(event) => onDateToChange(event.target.value)}
      />
      <Input
        placeholder="Learner ID"
        value={learnerId}
        onChange={(event) => onLearnerIdChange(event.target.value)}
      />
      <Input
        placeholder="Course ID"
        value={courseId}
        onChange={(event) => onCourseIdChange(event.target.value)}
      />
      <Input
        type="number"
        min={0}
        placeholder="Số tiền từ"
        value={amountMin}
        onChange={(event) => onAmountMinChange(event.target.value)}
      />
      <Input
        type="number"
        min={0}
        placeholder="Số tiền đến"
        value={amountMax}
        onChange={(event) => onAmountMaxChange(event.target.value)}
      />
    </div>
  );
}
