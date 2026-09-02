"use client";

import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
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
  COURSE_STATUS_LABELS,
  type CourseCategory,
} from "@/lib/schemas/course";
import { COURSE_STATUSES, type CourseStatus } from "@/services/api/courses";

export type InstructorCategoryFilter = "" | CourseCategory;
export type InstructorStatusFilter = "" | CourseStatus;

const ALL_OPTION = "";

const CATEGORY_FILTER_ITEMS: Record<InstructorCategoryFilter, string> = {
  [ALL_OPTION]: "Tất cả danh mục",
  ...COURSE_CATEGORY_LABELS,
};

const STATUS_FILTER_ITEMS: Record<InstructorStatusFilter, string> = {
  [ALL_OPTION]: "Tất cả trạng thái",
  Draft: COURSE_STATUS_LABELS.Draft,
  Pending: COURSE_STATUS_LABELS.Pending,
  Published: COURSE_STATUS_LABELS.Published,
  Rejected: COURSE_STATUS_LABELS.Rejected,
};

export function InstructorCoursesCreateAction() {
  return (
    <Button>
      <Link href="/instructor/courses/new" className="flex items-center gap-2">
        <Plus /> Tạo khóa học
      </Link>
    </Button>
  );
}

export function InstructorCoursesToolbar({
  categoryFilter,
  hasActiveFilters,
  search,
  statusFilter,
  onCategoryChange,
  onClearFilters,
  onSearchChange,
  onStatusChange,
}: {
  categoryFilter: InstructorCategoryFilter;
  hasActiveFilters: boolean;
  search: string;
  statusFilter: InstructorStatusFilter;
  onCategoryChange: (value: InstructorCategoryFilter) => void;
  onClearFilters: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: InstructorStatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
      <form
        className="xl:min-w-80 xl:flex-1"
        onSubmit={(event) => event.preventDefault()}
      >
        <InputGroup>
          <InputGroupInput
            placeholder="Tìm theo tên hoặc mô tả..."
            aria-label="Tìm kiếm khóa học"
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={categoryFilter}
          onValueChange={(value) =>
            onCategoryChange(value as InstructorCategoryFilter)
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
            {(
              Object.keys(CATEGORY_FILTER_ITEMS) as InstructorCategoryFilter[]
            ).map((value) => (
              <SelectItem key={value || "all"} value={value}>
                {CATEGORY_FILTER_ITEMS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusChange(value as InstructorStatusFilter)
          }
          items={STATUS_FILTER_ITEMS}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label="Lọc theo trạng thái"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(COURSE_STATUSES).map((status) => (
              <SelectItem key={status} value={status}>
                {COURSE_STATUS_LABELS[status]}
              </SelectItem>
            ))}
            <SelectItem value={ALL_OPTION}>Tất cả trạng thái</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
