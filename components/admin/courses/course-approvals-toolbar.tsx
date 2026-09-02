"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COURSE_CATEGORY_LABELS,
  type CourseCategory,
} from "@/lib/schemas/course";

export type ApprovalCategoryFilter = "" | CourseCategory;

const ALL_OPTION = "";

const CATEGORY_FILTER_ITEMS: Record<ApprovalCategoryFilter, string> = {
  [ALL_OPTION]: "Tất cả danh mục",
  ...COURSE_CATEGORY_LABELS,
};

export function CourseApprovalsToolbar({
  categoryFilter,
  hasActiveFilters,
  search,
  onCategoryChange,
  onClearFilters,
  onSearchChange,
}: {
  categoryFilter: ApprovalCategoryFilter;
  hasActiveFilters: boolean;
  search: string;
  onCategoryChange: (value: ApprovalCategoryFilter) => void;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
      <form
        className="xl:min-w-80 xl:flex-1"
        onSubmit={(event) => event.preventDefault()}
      >
        <InputGroup>
          <InputGroupInput
            placeholder="Tìm theo tên hoặc mô tả khóa học..."
            aria-label="Tìm kiếm khóa học chờ duyệt"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon-xs"
            aria-label="Tìm kiếm"
          >
            <Search />
          </Button>
        </InputGroup>
      </form>

      <Select
        value={categoryFilter}
        onValueChange={(value) =>
          onCategoryChange(value as ApprovalCategoryFilter)
        }
        items={CATEGORY_FILTER_ITEMS}
      >
        <SelectTrigger
          className="w-full sm:w-48"
          aria-label="Lọc theo danh mục"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(CATEGORY_FILTER_ITEMS) as ApprovalCategoryFilter[]).map(
            (value) => (
              <SelectItem key={value || "all"} value={value}>
                {CATEGORY_FILTER_ITEMS[value]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <div>
        <Button
          variant="destructive"
          disabled={!hasActiveFilters}
          onClick={onClearFilters}
        >
          <X className="size-4" aria-hidden="true" />
          Xóa bộ lọc
        </Button>
      </div>
    </div>
  );
}
