"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ImageIcon,
  PencilLine,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteCourseDialog } from "@/components/instructor/courses/delete-course-dialog";
import { useInstructorCoursesList } from "@/hooks/useInstructorCourses";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_LIST_PAGE_SIZE,
  COURSE_STATUS_LABELS,
  type CourseCategory,
} from "@/lib/schemas/course";
import {
  COURSE_STATUSES,
  type Course,
  type CourseListFilters,
  type CourseStatus,
} from "@/services/api/courses";
import { formatDate } from "@/utils/dateTimeUtil";
import { Pagination } from "@/components/ui/pagination";

type CategoryFilter = "" | CourseCategory;
type StatusFilter = "" | CourseStatus;

const ALL_OPTION = "";

const CATEGORY_FILTER_ITEMS: Record<CategoryFilter, string> = {
  [ALL_OPTION]: "Tất cả danh mục",
  ...COURSE_CATEGORY_LABELS,
};

const STATUS_FILTER_ITEMS: Record<StatusFilter, string> = {
  [ALL_OPTION]: "Tất cả trạng thái",
  Draft: COURSE_STATUS_LABELS.Draft,
  Pending: COURSE_STATUS_LABELS.Pending,
  Published: COURSE_STATUS_LABELS.Published,
};

function getCourseCategoryLabel(category: string): string {
  return (
    COURSE_CATEGORY_LABELS[category as keyof typeof COURSE_CATEGORY_LABELS] ??
    category
  );
}

function CourseThumbnail({ course }: { course: Course }) {
  return (
    <div
      className="flex size-14 items-center justify-center overflow-hidden rounded-xl bg-muted bg-cover bg-center"
      style={
        course.thumbnail
          ? { backgroundImage: `url(${course.thumbnail})` }
          : undefined
      }
    >
      {course.thumbnail ? (
        <span className="sr-only">Có ảnh khóa học</span>
      ) : (
        <ImageIcon
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function InstructorCoursesPage() {
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>(ALL_OPTION);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_OPTION);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(COURSE_LIST_PAGE_SIZE);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const filters = useMemo<CourseListFilters>(
    () => ({
      page,
      limit: COURSE_LIST_PAGE_SIZE,
      q: appliedSearch || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      sortBy: "createdAt",
      sortOrder: "DESC",
    }),
    [appliedSearch, categoryFilter, page, statusFilter],
  );

  const { data, isError, isPending, refetch } =
    useInstructorCoursesList(filters);
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.total ?? 0;

  function applySearch() {
    setPage(1);
    setAppliedSearch(searchDraft.trim());
  }

  function handleFilterChange(apply: () => void) {
    apply();
    setPage(1);
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
            <Button>
              <Link
                href="/instructor/courses/new"
                className="flex items-center gap-2"
              >
                <Plus /> Tạo khóa học
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
            <form
              className="xl:min-w-80 xl:flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                applySearch();
              }}
            >
              <InputGroup>
                <InputGroupInput
                  placeholder="Tìm theo tên hoặc mô tả..."
                  aria-label="Tìm kiếm khóa học"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
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

              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  handleFilterChange(() =>
                    setStatusFilter(value as StatusFilter),
                  )
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
                disabled={
                  !appliedSearch &&
                  categoryFilter === ALL_OPTION &&
                  statusFilter === ALL_OPTION
                }
                onClick={() => {
                  setAppliedSearch("");
                  setSearchDraft("");
                  setCategoryFilter(ALL_OPTION);
                  setStatusFilter(ALL_OPTION);
                  setPage(1);
                }}
              >
                <X className="size-4" aria-hidden="true" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể tải danh sách khóa học</AlertTitle>
              <AlertDescription>
                Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
              </AlertDescription>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => refetch()}
              >
                Thử lại
              </Button>
            </Alert>
          )}

          {isPending && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-10 w-full rounded-lg"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {!isError && !isPending && (
            <div className="overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khóa học</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Cập nhật</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <BookOpen
                              className="size-10 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <p className="font-medium">Chưa có khóa học</p>
                            <p className="text-sm text-muted-foreground">
                              Tạo khóa học đầu tiên để bắt đầu xây dựng nội
                              dung.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <CourseThumbnail course={course} />
                              <div className="min-w-0">
                                <p className="font-medium">{course.title}</p>
                                <p className="line-clamp-1 text-sm text-muted-foreground">
                                  {course.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getCourseCategoryLabel(course.category)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {COURSE_STATUS_LABELS[course.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(course.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Chỉnh sửa ${course.title}`}
                              >
                                <Link
                                  href={`/instructor/courses/${course.id}/edit`}
                                >
                                  <PencilLine />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingCourse(course)}
                                aria-label={`Xóa ${course.title}`}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

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
