"use client";

import { CalendarDays, Mail, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterField from "@/components/admin/payments/FilterField";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WithdrawRequestStatus } from "@/services/api/payment";

type WithdrawStatusFilter = WithdrawRequestStatus | "";

const STATUS_LABELS: Record<WithdrawStatusFilter, string> = {
  "": "Tất cả trạng thái",
  pending: "Đang chờ",
  processing: "Đang xử lý",
  processed: "Đã xử lý",
  cancelled: "Đã hủy",
  rejected: "Bị từ chối",
};

const SORT_LABELS: Record<"asc" | "desc", string> = {
  desc: "Số tiền giảm dần",
  asc: "Số tiền tăng dần",
};

export function AdminWithdrawalFilters({
  amountSort,
  instructorEmail,
  requestedAtFrom,
  requestedAtTo,
  status,
  onAmountSortChange,
  onClear,
  onInstructorEmailChange,
  onRequestedAtFromChange,
  onRequestedAtToChange,
  onStatusChange,
}: {
  amountSort: "asc" | "desc";
  instructorEmail: string;
  requestedAtFrom: string;
  requestedAtTo: string;
  status: WithdrawStatusFilter;
  onAmountSortChange: (value: "asc" | "desc") => void;
  onClear: () => void;
  onInstructorEmailChange: (value: string) => void;
  onRequestedAtFromChange: (value: string) => void;
  onRequestedAtToChange: (value: string) => void;
  onStatusChange: (value: WithdrawStatusFilter) => void;
}) {
  const hasActiveFilters = Boolean(
    instructorEmail ||
    requestedAtFrom ||
    requestedAtTo ||
    status !== "pending" ||
    amountSort !== "desc",
  );

  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium">Bộ lọc yêu cầu rút tiền</p>
            <p className="text-xs text-muted-foreground">
              Lọc theo email giảng viên, trạng thái, ngày yêu cầu và thứ tự số
              tiền.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={onClear}
        >
          <X />
          Xóa lọc
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <form onSubmit={(event) => event.preventDefault()}>
          <FilterField label="Email giảng viên">
            <InputGroup className="bg-background">
              <InputGroupAddon>
                <Mail />
              </InputGroupAddon>
              <InputGroupInput
                type="email"
                placeholder="teacher@example.com"
                aria-label="Lọc theo email giảng viên"
                value={instructorEmail}
                onChange={(event) =>
                  onInstructorEmailChange(event.target.value)
                }
              />
            </InputGroup>
          </FilterField>
        </form>

        <FilterField label="Trạng thái">
          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange(value as WithdrawStatusFilter)
            }
            items={STATUS_LABELS}
          >
            <SelectTrigger
              className="w-full bg-background"
              aria-label="Lọc trạng thái yêu cầu rút tiền"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as WithdrawStatusFilter[]).map(
                (value) => (
                  <SelectItem key={value} value={value}>
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
              aria-label="Ngày yêu cầu từ"
              value={requestedAtFrom}
              onChange={(event) => onRequestedAtFromChange(event.target.value)}
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
              aria-label="Ngày yêu cầu đến"
              value={requestedAtTo}
              onChange={(event) => onRequestedAtToChange(event.target.value)}
            />
          </InputGroup>
        </FilterField>

        <FilterField label="Sắp xếp số tiền">
          <Select
            value={amountSort}
            onValueChange={(value) =>
              onAmountSortChange(value as "asc" | "desc")
            }
            items={SORT_LABELS}
          >
            <SelectTrigger
              className="w-full bg-background"
              aria-label="Sắp xếp số tiền rút"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as Array<"asc" | "desc">).map(
                (value) => (
                  <SelectItem key={value} value={value}>
                    {SORT_LABELS[value]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FilterField>
      </div>
    </div>
  );
}
