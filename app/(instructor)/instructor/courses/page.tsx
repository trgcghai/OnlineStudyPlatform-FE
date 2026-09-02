"use client";

import { useMemo, useState } from "react";
import { DeleteCourseDialog } from "@/components/instructor/courses/delete-course-dialog";
import {
  InstructorCoursesCreateAction,
  InstructorCoursesToolbar,
  type InstructorCategoryFilter,
  type InstructorStatusFilter,
} from "@/components/instructor/courses/instructor-courses-toolbar";
import { InstructorCoursesTable } from "@/components/instructor/courses/instructor-courses-table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useInstructorCoursesList,
  useRequestPublishCourse,
} from "@/hooks/useInstructorCourses";
import { COURSE_LIST_PAGE_SIZE } from "@/lib/schemas/course";
import type { Course, CourseListFilters } from "@/services/api/courses";

const ALL_OPTION = "";

export default function InstructorCoursesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<InstructorCategoryFilter>(ALL_OPTION);
  const [statusFilter, setStatusFilter] =
    useState<InstructorStatusFilter>(ALL_OPTION);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(COURSE_LIST_PAGE_SIZE);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 500);

  const filters = useMemo<CourseListFilters>(
    () => ({
      page,
      limit: pageSize,
      q: debouncedSearch || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      sortBy: "updatedAt",
      sortOrder: "DESC",
    }),
    [categoryFilter, debouncedSearch, page, pageSize, statusFilter],
  );

  const { data, isError, isPending, refetch } =
    useInstructorCoursesList(filters);
  const {
    requestPublishInstructorCourse,
    isPending: isRequestingPublish,
    pendingCourseId,
  } = useRequestPublishCourse();
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.total ?? 0;
  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    categoryFilter !== ALL_OPTION ||
    statusFilter !== ALL_OPTION;

  function handleFilterChange(apply: () => void) {
    apply();
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter(ALL_OPTION);
    setStatusFilter(ALL_OPTION);
    setPage(1);
  }

  async function handleRequestPublish(course: Course) {
    const result = await requestPublishInstructorCourse(course.id);

    if (!result.ok) {
      toast.add({
        title: result.message ?? "Không thể gửi yêu cầu xuất bản khóa học.",
        type: "error",
      });
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý khóa học</CardTitle>
          <CardDescription>
            Tạo, chỉnh sửa và quản lý các khóa học bản nháp của bạn.
          </CardDescription>
          <CardAction>
            <InstructorCoursesCreateAction />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <InstructorCoursesToolbar
            categoryFilter={categoryFilter}
            hasActiveFilters={hasActiveFilters}
            search={search}
            statusFilter={statusFilter}
            onCategoryChange={(value) =>
              handleFilterChange(() => setCategoryFilter(value))
            }
            onClearFilters={clearFilters}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onStatusChange={(value) =>
              handleFilterChange(() => setStatusFilter(value))
            }
          />

          <InstructorCoursesTable
            isError={isError}
            isPending={isPending}
            isRequestingPublish={isRequestingPublish}
            items={items}
            pendingCourseId={pendingCourseId}
            onDelete={setDeletingCourse}
            onRefetch={() => refetch()}
            onRequestPublish={handleRequestPublish}
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

      <DeleteCourseDialog
        course={deletingCourse}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
      />
    </div>
  );
}
