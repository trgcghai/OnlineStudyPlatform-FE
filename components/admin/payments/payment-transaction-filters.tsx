"use client";

import {
  BadgeDollarSign,
  BookOpen,
  CalendarDays,
  Search,
  SlidersHorizontal,
  UserRound,
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
  const hasActiveFilters = Boolean(
    amountMax ||
    amountMin ||
    courseId ||
    dateFrom ||
    dateTo ||
    learnerId ||
    search ||
    status,
  );

  function clearFilters() {
    onSearchChange("");
    onStatusChange("");
    onDateFromChange("");
    onDateToChange("");
    onLearnerIdChange("");
    onCourseIdChange("");
    onAmountMinChange("");
    onAmountMaxChange("");
  }

  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium">Bộ lọc giao dịch</p>
            <p className="text-xs text-muted-foreground">
              Lọc theo trạng thái, thời gian, học viên, khóa học và số tiền.
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
                placeholder="Mã giao dịch, mã thanh toán..."
                aria-label="Tìm kiếm giao dịch thanh toán"
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

        <FilterField label="Trạng thái">
          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange(value as PaymentStatusFilter)
            }
            items={STATUS_LABELS}
          >
            <SelectTrigger
              className="w-full bg-background"
              aria-label="Lọc trạng thái giao dịch"
            >
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
        </FilterField>

        <FilterField label="Từ ngày">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <CalendarDays />
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              aria-label="Từ ngày"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Đến ngày">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <CalendarDays />
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              aria-label="Đến ngày"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Học viên">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <UserRound />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Learner ID"
              value={learnerId}
              onChange={(event) => onLearnerIdChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Khóa học">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <BookOpen />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Course ID"
              value={courseId}
              onChange={(event) => onCourseIdChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Số tiền từ">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <BadgeDollarSign />
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              min={0}
              placeholder="Tối thiểu"
              value={amountMin}
              onChange={(event) => onAmountMinChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
        <FilterField label="Số tiền đến">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <BadgeDollarSign />
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              min={0}
              placeholder="Tối đa"
              value={amountMax}
              onChange={(event) => onAmountMaxChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>
      </div>
    </div>
  );
}
