"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { PublicCourseCard } from "@/components/courses/public-course-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { usePublishedCoursesList } from "@/hooks/usePublicCourses";
import { Pagination } from "@/components/ui/pagination";
import { COURSE_CATEGORY_LABELS, CourseCategory } from "@/lib/schemas/course";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CATALOG_LIMIT = 24;
type CategoryFilter = "" | CourseCategory;
const ALL_OPTION = "";
const CATEGORY_FILTER_ITEMS: Record<CategoryFilter, string> = {
  [ALL_OPTION]: "Tất cả danh mục",
  ...COURSE_CATEGORY_LABELS,
};

export default function CoursePage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>(ALL_OPTION);
  const debouncedKeyword = useDebounce(keyword, 350);

  const coursesQuery = usePublishedCoursesList({
    page,
    limit: CATALOG_LIMIT,
    q: debouncedKeyword,
    category: categoryFilter || undefined,
  });
  const courses = coursesQuery.data?.items ?? [];
  const total = coursesQuery.data?.total ?? 0;
  const totalPages = coursesQuery.data?.totalPages ?? 1;
  const isEmpty = !coursesQuery.isLoading && total === 0;

  function handleFilterChange(apply: () => void) {
    apply();
    setPage(1);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10">
      <section className="rounded-3xl bg-linear-to-br from-primary/10 via-background to-secondary/10 p-8 ring-1 ring-border">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Danh mục khóa học
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Khám phá khóa học phù hợp với lộ trình học của bạn
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Tìm kiếm khóa học đã xuất bản, lọc theo danh mục và xem thông tin chi
          tiết trước khi đăng ký học.
        </p>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_180px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên hoặc mô tả khóa học"
              aria-label="Tìm kiếm khóa học"
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              handleFilterChange(() =>
                setCategoryFilter(value as CategoryFilter),
              )
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
              {(Object.keys(CATEGORY_FILTER_ITEMS) as CategoryFilter[]).map(
                (value) => (
                  <SelectItem key={value || "all"} value={value}>
                    {CATEGORY_FILTER_ITEMS[value]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Button
            className="ml-3"
            variant="destructive"
            disabled={!debouncedKeyword && categoryFilter === ALL_OPTION}
            onClick={() => {
              setKeyword("");
              setCategoryFilter(ALL_OPTION);
              setPage(1);
            }}
          >
            <X className="size-4" aria-hidden="true" />
            Xóa bộ lọc
          </Button>
        </div>

        {coursesQuery.isError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Không thể tải danh sách khóa học. Vui lòng thử lại.
          </div>
        )}

        {coursesQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm font-medium text-muted-foreground">
            Không tìm thấy khóa học phù hợp
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => (
                <PublicCourseCard key={course.id} course={course} />
              ))}
            </div>
            <Pagination
              page={page}
              pageSize={CATALOG_LIMIT}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
              allowPageSizeChange={false}
            />
          </>
        )}
      </section>
    </main>
  );
}
