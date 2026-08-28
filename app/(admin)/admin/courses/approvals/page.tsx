"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ImageIcon,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { ApproveCourseDialog } from "@/components/admin/courses/approve-course-dialog";
import { RejectCourseDialog } from "@/components/admin/courses/reject-course-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Pagination } from "@/components/ui/pagination";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCourseApprovalsList } from "@/hooks/useAdminCourseApprovals";
import { useDebounce } from "@/hooks/useDebounce";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_LIST_PAGE_SIZE,
  COURSE_STATUS_BADGE_VARIANTS,
  COURSE_STATUS_LABELS,
  type CourseCategory,
} from "@/lib/schemas/course";
import type { CourseApproval, CourseListFilters } from "@/services/api/courses";
import { formatDate } from "@/utils/dateTimeUtil";

type CategoryFilter = "" | CourseCategory;

const ALL_OPTION = "";

const CATEGORY_FILTER_ITEMS: Record<CategoryFilter, string> = {
  [ALL_OPTION]: "Tất cả danh mục",
  ...COURSE_CATEGORY_LABELS,
};

function getCourseCategoryLabel(category: string): string {
  return (
    COURSE_CATEGORY_LABELS[category as keyof typeof COURSE_CATEGORY_LABELS] ??
    category
  );
}

function CourseThumbnail({ course }: { course: CourseApproval }) {
  return (
    <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-xl bg-muted">
      {course.thumbnail ? (
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <ImageIcon
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function AdminCourseApprovalsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>(ALL_OPTION);
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

  function handleFilterChange(apply: () => void) {
    apply();
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
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
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

            <div>
              <Button
                variant="destructive"
                disabled={!debouncedSearch && categoryFilter === ALL_OPTION}
                onClick={() => {
                  setSearch("");
                  setCategoryFilter(ALL_OPTION);
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
              <AlertTitle>
                Không thể tải danh sách khóa học chờ duyệt
              </AlertTitle>
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
                      <TableHead>Giảng viên</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <BookOpen
                              className="size-10 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <p className="font-medium">
                              Không có khóa học chờ duyệt
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Các yêu cầu xuất bản mới sẽ xuất hiện tại đây.
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
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {course.instructor.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {course.instructor.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                COURSE_STATUS_BADGE_VARIANTS[
                                  course.status
                                ] as keyof typeof badgeVariants
                              }
                            >
                              {COURSE_STATUS_LABELS[course.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(course.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Duyệt ${course.title}`}
                                      onClick={() => setApprovingCourse(course)}
                                    >
                                      <CheckCircle2 />
                                    </Button>
                                  }
                                />
                                <TooltipContent>
                                  <p>Duyệt khóa học</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-destructive hover:text-destructive"
                                      aria-label={`Từ chối ${course.title}`}
                                      onClick={() => setRejectingCourse(course)}
                                    >
                                      <XCircle />
                                    </Button>
                                  }
                                />
                                <TooltipContent>
                                  <p>Từ chối khóa học</p>
                                </TooltipContent>
                              </Tooltip>
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
