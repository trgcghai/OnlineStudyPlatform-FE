"use client";

import { ArrowRight, BookOpen, Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { PublicCourseCard } from "@/components/courses/public-course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import { useDebounce } from "@/hooks/useDebounce";
import { COURSE_CATEGORY_LABELS, CourseCategory } from "@/lib/schemas/course";
import {
  courseCategoryFilterParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
  URL_SEARCH_DEBOUNCE_MS,
} from "@/lib/search-params/filter-parsers";
import { usePublishedCoursesList } from "@/hooks/usePublicCourses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATALOG_LIMIT = 24;
type CategoryFilter = "" | CourseCategory;
const ALL_OPTION = "";
const CATEGORY_FILTER_ITEMS: Record<CategoryFilter, string> = {
  [ALL_OPTION]: "Tất cả danh mục",
  ...COURSE_CATEGORY_LABELS,
};

export default function CoursePage() {
  const [filters, setFilters] = useQueryStates(
    { q: searchParser, category: courseCategoryFilterParser, page: pageParser },
    { history: URL_FILTER_HISTORY },
  );
  const debouncedSearch = useDebounce(filters.q, URL_SEARCH_DEBOUNCE_MS);
  const coursesQuery = usePublishedCoursesList({
    page: filters.page,
    limit: CATALOG_LIMIT,
    q: debouncedSearch || undefined,
    category: filters.category || undefined,
  });
  const courses = coursesQuery.data?.items ?? [];
  const total = coursesQuery.data?.total ?? 0;
  const totalPages = coursesQuery.data?.totalPages ?? 1;
  const isEmpty =
    !coursesQuery.isLoading && !coursesQuery.isError && total === 0;
  const hasFilters = Boolean(filters.q || filters.category);

  useClampUrlPage({
    page: filters.page,
    totalPages,
    enabled: !coursesQuery.isLoading && !coursesQuery.isError,
    onPageChange: (nextPage) => void setFilters({ page: nextPage }),
  });

  const setCategory = (category: CategoryFilter) => {
    void setFilters({ category, page: 1 });
  };

  const clearFilters = () => {
    void setFilters({ q: "", category: ALL_OPTION, page: 1 });
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-9 px-5 py-8 sm:px-8 sm:py-10">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#171641] text-white">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-44 -z-10 size-[34rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-2 -top-28 -z-10 size-[25rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 -z-10 h-56 w-72 rounded-full bg-violet-500/30 blur-3xl"
        />
        <div className="grid gap-7 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-200">
              <BookOpen className="size-4" aria-hidden="true" />
              Thư viện học tập
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-tight tracking-tight sm:text-5xl">
              Tìm điều bạn muốn
              <br className="hidden sm:block" />{" "}
              <span className="text-indigo-200">biết sâu hơn.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100/75 sm:text-base">
              Chọn một chủ đề, khám phá khóa học và bắt đầu xây dựng kỹ năng
              theo nhịp riêng.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label="Tìm kiếm và lọc khóa học"
        className="-mt-6 space-y-4 rounded-3xl border bg-card p-4 shadow-lg shadow-indigo-950/5 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={filters.q}
              onChange={(event) =>
                void setFilters({ q: event.target.value, page: 1 })
              }
              placeholder="Bạn muốn học điều gì?"
              aria-label="Tìm kiếm khóa học"
              className="rounded-xl border-transparent bg-muted/60 pl-11 focus-visible:border-ring"
            />
          </label>
          <Select
            value={filters.category}
            onValueChange={(value) => setCategory(value as CategoryFilter)}
            items={CATEGORY_FILTER_ITEMS}
          >
            <SelectTrigger
              className="h-12 w-full rounded-xl bg-muted/60"
              aria-label="Lọc theo danh mục"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
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
            className="rounded-xl px-5"
            variant="destructive"
            disabled={!hasFilters}
            onClick={clearFilters}
          >
            <X className="size-4" aria-hidden="true" />
            Xóa lọc
          </Button>
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Danh mục khóa học"
        >
          {(Object.keys(CATEGORY_FILTER_ITEMS) as CategoryFilter[]).map(
            (category) => {
              const active = filters.category === category;
              return (
                <button
                  key={category || "all"}
                  type="button"
                  onClick={() => setCategory(category)}
                  aria-pressed={active}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active ? "border-[#27236f] bg-[#27236f] text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-indigo-950" : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                >
                  {CATEGORY_FILTER_ITEMS[category]}
                </button>
              );
            },
          )}
        </div>
      </section>

      <section className="space-y-5" aria-live="polite">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Khám phá
            </p>
            <h2 className="mt-1 text-2xl tracking-tight sm:text-3xl">
              {filters.q
                ? `Kết quả cho “${filters.q}”`
                : filters.category
                  ? CATEGORY_FILTER_ITEMS[filters.category]
                  : "Tất cả khóa học"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {coursesQuery.isLoading
              ? "Đang tìm khóa học…"
              : coursesQuery.isError
                ? "Không tải được kết quả"
                : `${total.toLocaleString("vi-VN")} kết quả`}
          </p>
        </div>

        {coursesQuery.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive"
          >
            Không thể tải danh sách khóa học. Vui lòng thử lại.
          </div>
        ) : null}

        {coursesQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="rounded-3xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
              <Search className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-2xl">Chưa tìm thấy khóa học phù hợp</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Thử một từ khóa khác hoặc xóa bộ lọc để xem thêm lựa chọn.
            </p>
            {hasFilters ? (
              <Button className="mt-5" variant="outline" onClick={clearFilters}>
                Xóa bộ lọc <ArrowRight className="size-4" />
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => (
                <PublicCourseCard key={course.id} course={course} />
              ))}
            </div>
            <Pagination
              page={filters.page}
              pageSize={CATALOG_LIMIT}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={(nextPage) => void setFilters({ page: nextPage })}
              allowPageSizeChange={false}
            />
          </>
        )}
      </section>
    </main>
  );
}
