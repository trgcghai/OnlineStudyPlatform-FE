"use client";

import { useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import { ApproveCourseDialog } from "@/components/admin/courses/approve-course-dialog";
import { CourseApprovalsTable } from "@/components/admin/courses/course-approvals-table";
import {
  CourseApprovalsToolbar,
  type ApprovalCategoryFilter,
} from "@/components/admin/courses/course-approvals-toolbar";
import { RejectCourseDialog } from "@/components/admin/courses/reject-course-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useCourseApprovalsList } from "@/hooks/useAdminCourseApprovals";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import { useDebounce } from "@/hooks/useDebounce";
import { COURSE_LIST_PAGE_SIZE } from "@/lib/schemas/course";
import {
  courseCategoryFilterParser,
  limitParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
  URL_SEARCH_DEBOUNCE_MS,
} from "@/lib/search-params/filter-parsers";
import type { CourseApproval, CourseListFilters } from "@/services/api/courses";

const ALL_OPTION = "";

export default function AdminCourseApprovalsPage() {
  const [approvingCourse, setApprovingCourse] = useState<CourseApproval | null>(
    null,
  );
  const [rejectingCourse, setRejectingCourse] = useState<CourseApproval | null>(
    null,
  );
  const [filtersState, setFiltersState] = useQueryStates(
    {
      q: searchParser,
      category: courseCategoryFilterParser,
      page: pageParser,
      limit: limitParser(COURSE_LIST_PAGE_SIZE),
    },
    { history: URL_FILTER_HISTORY },
  );
  const debouncedSearch = useDebounce(filtersState.q, URL_SEARCH_DEBOUNCE_MS);

  const filters = useMemo<CourseListFilters>(
    () => ({
      page: filtersState.page,
      limit: filtersState.limit,
      q: debouncedSearch || undefined,
      category: filtersState.category || undefined,
      sortBy: "updatedAt",
      sortOrder: "DESC",
    }),
    [debouncedSearch, filtersState],
  );

  const { data, isError, isPending, refetch } = useCourseApprovalsList(filters);
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.total ?? 0;
  const hasActiveFilters =
    Boolean(filtersState.q) || filtersState.category !== ALL_OPTION;

  useClampUrlPage({
    page: filtersState.page,
    totalPages,
    enabled: !isPending && !isError,
    onPageChange: (nextPage) => {
      void setFiltersState({ page: nextPage });
    },
  });

  function clearFilters() {
    void setFiltersState({ q: "", category: ALL_OPTION, page: 1 });
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Duyệt khóa học</CardTitle>
          <CardDescription>
            Xem các yêu cầu xuất bản khóa học và duyệt hoặc từ chối trước khi
            khóa học được công khai.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CourseApprovalsToolbar
            categoryFilter={filtersState.category as ApprovalCategoryFilter}
            hasActiveFilters={hasActiveFilters}
            search={filtersState.q}
            onCategoryChange={(value) => {
              void setFiltersState({ category: value, page: 1 });
            }}
            onClearFilters={clearFilters}
            onSearchChange={(value) => {
              void setFiltersState({ q: value, page: 1 });
            }}
          />

          <CourseApprovalsTable
            isError={isError}
            isPending={isPending}
            items={items}
            onApprove={setApprovingCourse}
            onRefetch={() => refetch()}
            onReject={setRejectingCourse}
          />

          {!isError && !isPending && (
            <Pagination
              page={filtersState.page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={filtersState.limit}
              onPageChange={(nextPage) => {
                void setFiltersState({ page: nextPage });
              }}
              onPageSizeChange={(size) => {
                void setFiltersState({ limit: size, page: 1 });
              }}
            />
          )}
        </CardContent>
      </Card>

      <ApproveCourseDialog
        course={approvingCourse}
        onOpenChange={(open) => {
          if (!open) setApprovingCourse(null);
        }}
      />

      <RejectCourseDialog
        course={rejectingCourse}
        onOpenChange={(open) => {
          if (!open) setRejectingCourse(null);
        }}
      />
    </div>
  );
}
