"use client";

import { useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
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
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useInstructorCoursesList,
  useRequestPublishCourse,
} from "@/hooks/useInstructorCourses";
import { COURSE_LIST_PAGE_SIZE } from "@/lib/schemas/course";
import {
  courseCategoryFilterParser,
  courseStatusFilterParser,
  limitParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
  URL_SEARCH_DEBOUNCE_MS,
} from "@/lib/search-params/filter-parsers";
import type { Course, CourseListFilters } from "@/services/api/courses";

const ALL_OPTION = "";

export default function InstructorCoursesPage() {
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [filtersState, setFiltersState] = useQueryStates(
    {
      q: searchParser,
      category: courseCategoryFilterParser,
      status: courseStatusFilterParser,
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
      status: filtersState.status || undefined,
      sortBy: "updatedAt",
      sortOrder: "DESC",
    }),
    [debouncedSearch, filtersState],
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
    Boolean(filtersState.q) ||
    filtersState.category !== ALL_OPTION ||
    filtersState.status !== ALL_OPTION;

  useClampUrlPage({
    page: filtersState.page,
    totalPages,
    enabled: !isPending && !isError,
    onPageChange: (nextPage) => {
      void setFiltersState({ page: nextPage });
    },
  });

  function clearFilters() {
    void setFiltersState({
      q: "",
      category: ALL_OPTION,
      status: ALL_OPTION,
      page: 1,
    });
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
            categoryFilter={filtersState.category as InstructorCategoryFilter}
            hasActiveFilters={hasActiveFilters}
            search={filtersState.q}
            statusFilter={filtersState.status as InstructorStatusFilter}
            onCategoryChange={(value) => {
              void setFiltersState({ category: value, page: 1 });
            }}
            onClearFilters={clearFilters}
            onSearchChange={(value) => {
              void setFiltersState({ q: value, page: 1 });
            }}
            onStatusChange={(value) => {
              void setFiltersState({ status: value, page: 1 });
            }}
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

      <DeleteCourseDialog
        course={deletingCourse}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
      />
    </div>
  );
}
