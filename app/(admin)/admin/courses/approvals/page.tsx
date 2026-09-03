"use client";

import { useMemo, useState } from "react";
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
import { useDebounce } from "@/hooks/useDebounce";
import { COURSE_LIST_PAGE_SIZE } from "@/lib/schemas/course";
import type { CourseApproval, CourseListFilters } from "@/services/api/courses";

const ALL_OPTION = "";

export default function AdminCourseApprovalsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<ApprovalCategoryFilter>(ALL_OPTION);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(COURSE_LIST_PAGE_SIZE);
  const [approvingCourse, setApprovingCourse] = useState<CourseApproval | null>(
    null,
  );
  const [rejectingCourse, setRejectingCourse] = useState<CourseApproval | null>(
    null,
  );
  const debouncedSearch = useDebounce(search.trim(), 500);

  const filters = useMemo<CourseListFilters>(
    () => ({
      page,
      limit: pageSize,
      q: debouncedSearch || undefined,
      category: categoryFilter || undefined,
      sortBy: "updatedAt",
      sortOrder: "DESC",
    }),
    [categoryFilter, debouncedSearch, page, pageSize],
  );

  const { data, isError, isPending, refetch } = useCourseApprovalsList(filters);
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.total ?? 0;
  const hasActiveFilters =
    Boolean(debouncedSearch) || categoryFilter !== ALL_OPTION;

  function handleFilterChange(apply: () => void) {
    apply();
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter(ALL_OPTION);
    setPage(1);
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
            categoryFilter={categoryFilter}
            hasActiveFilters={hasActiveFilters}
            search={search}
            onCategoryChange={(value) =>
              handleFilterChange(() => setCategoryFilter(value))
            }
            onClearFilters={clearFilters}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
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
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
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
