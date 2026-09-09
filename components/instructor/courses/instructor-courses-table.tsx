"use client";

import Link from "next/link";
import {
  BookOpen,
  List,
  LoaderCircle,
  PencilLine,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CourseStatusBadge,
  CourseThumbnail,
  getCourseCategoryLabel,
} from "@/components/courses/course-list-shared";
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
import { COURSE_LEARNING_ORDER_LABELS } from "@/lib/schemas/course";
import { COURSE_STATUSES, type Course } from "@/services/api/courses";
import { formatDate } from "@/utils/dateTimeUtil";
import { truncate } from "lodash";

function CourseRowActions({
  course,
  isRequestingPublish,
  pendingCourseId,
  onDelete,
  onRequestPublish,
}: {
  course: Course;
  isRequestingPublish: boolean;
  pendingCourseId: string | null | undefined;
  onDelete: (course: Course) => void;
  onRequestPublish: (course: Course) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      {course.status === COURSE_STATUSES.DRAFT && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isRequestingPublish && pendingCourseId === course.id}
                onClick={() => onRequestPublish(course)}
                aria-label={`Yêu cầu xuất bản ${course.title}`}
              >
                {isRequestingPublish && pendingCourseId === course.id ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </Button>
            }
          />
          <TooltipContent>
            <p>Yêu cầu xuất bản khóa học</p>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Chỉnh sửa ${course.title}`}
            >
              <Link href={`/instructor/courses/${course.id}/edit`}>
                <PencilLine />
              </Link>
            </Button>
          }
        />
        <TooltipContent>
          <p>Chỉnh sửa khóa học</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Xem học viên đăng ký ${course.title}`}
            >
              <Link href={`/instructor/courses/${course.id}/enrollments`}>
                <Users />
              </Link>
            </Button>
          }
        />
        <TooltipContent>
          <p>Học viên đăng ký</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Quản lý bài học ${course.title}`}
            >
              <Link href={`/instructor/courses/${course.id}/lessons`}>
                <List />
              </Link>
            </Button>
          }
        />
        <TooltipContent>
          <p>Quản lý bài học</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(course)}
              aria-label={`Xóa ${course.title}`}
            >
              <Trash2 />
            </Button>
          }
        />
        <TooltipContent>
          <p>Xóa khóa học</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function InstructorCourseRow({
  course,
  isRequestingPublish,
  pendingCourseId,
  onDelete,
  onRequestPublish,
}: {
  course: Course;
  isRequestingPublish: boolean;
  pendingCourseId: string | null | undefined;
  onDelete: (course: Course) => void;
  onRequestPublish: (course: Course) => void;
}) {
  return (
    <TableRow>
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
      <TableCell>{getCourseCategoryLabel(course.category)}</TableCell>
      <TableCell>
        {COURSE_LEARNING_ORDER_LABELS[course.learningOrder]}
      </TableCell>
      <TableCell>
        <CourseStatusBadge status={course.status} />
      </TableCell>
      <TableCell className="max-w-64 text-sm">
        {course.status === COURSE_STATUSES.REJECTED && course.rejectReason ? (
          <Tooltip>
            <TooltipTrigger>
              <span className="line-clamp-2">
                {truncate(course.rejectReason, { length: 100 })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{course.rejectReason}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(course.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <CourseRowActions
          course={course}
          isRequestingPublish={isRequestingPublish}
          pendingCourseId={pendingCourseId}
          onDelete={onDelete}
          onRequestPublish={onRequestPublish}
        />
      </TableCell>
    </TableRow>
  );
}

export function InstructorCoursesTable({
  isError,
  isPending,
  isRequestingPublish,
  items,
  pendingCourseId,
  onDelete,
  onRefetch,
  onRequestPublish,
}: {
  isError: boolean;
  isPending: boolean;
  isRequestingPublish: boolean;
  items: Course[];
  pendingCourseId: string | null | undefined;
  onDelete: (course: Course) => void;
  onRefetch: () => void;
  onRequestPublish: (course: Course) => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải danh sách khóa học</AlertTitle>
        <AlertDescription>
          Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
        </AlertDescription>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={onRefetch}
        >
          Thử lại
        </Button>
      </Alert>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-10 w-full rounded-lg"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khóa học</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Thứ tự học</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Lý do từ chối</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <BookOpen
                      className="size-10 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="font-medium">Chưa có khóa học</p>
                    <p className="text-sm text-muted-foreground">
                      Tạo khóa học đầu tiên để bắt đầu xây dựng nội dung.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((course) => (
                <InstructorCourseRow
                  key={course.id}
                  course={course}
                  isRequestingPublish={isRequestingPublish}
                  pendingCourseId={pendingCourseId}
                  onDelete={onDelete}
                  onRequestPublish={onRequestPublish}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
