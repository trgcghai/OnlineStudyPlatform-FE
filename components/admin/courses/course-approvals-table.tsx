"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2, Eye, XCircle } from "lucide-react";
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
import {
  formatCoursePrice,
  COURSE_LEARNING_ORDER_LABELS,
} from "@/lib/schemas/course";
import type { CourseApproval } from "@/services/api/courses";
import { formatDate } from "@/utils/dateTimeUtil";

function CourseApprovalRow({
  course,
  onApprove,
  onReject,
}: {
  course: CourseApproval;
  onApprove: (course: CourseApproval) => void;
  onReject: (course: CourseApproval) => void;
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
        {course.price === 0 ? (
          <span className="font-medium text-primary">
            {formatCoursePrice(course.price)}
          </span>
        ) : (
          <span>{formatCoursePrice(course.price)}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{course.instructor.name}</span>
          <span className="text-sm text-muted-foreground">
            {course.instructor.email}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <CourseStatusBadge status={course.status} />
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
                  aria-label={`Xem bài học và bài kiểm tra của ${course.title}`}
                >
                  <Link
                    href={`/admin/courses/approvals/${course.id}/lessons`}
                    className="flex items-center"
                  >
                    <Eye />
                  </Link>
                </Button>
              }
            />
            <TooltipContent>
              <p>Xem bài học &amp; bài kiểm tra</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Duyệt ${course.title}`}
                  onClick={() => onApprove(course)}
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
                  onClick={() => onReject(course)}
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
  );
}

export function CourseApprovalsTable({
  isError,
  isPending,
  items,
  onApprove,
  onRefetch,
  onReject,
}: {
  isError: boolean;
  isPending: boolean;
  items: CourseApproval[];
  onApprove: (course: CourseApproval) => void;
  onRefetch: () => void;
  onReject: (course: CourseApproval) => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải danh sách khóa học chờ duyệt</AlertTitle>
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
              <TableHead>Giá</TableHead>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày gửi</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <BookOpen
                      className="size-10 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="font-medium">Không có khóa học chờ duyệt</p>
                    <p className="text-sm text-muted-foreground">
                      Các yêu cầu xuất bản mới sẽ xuất hiện tại đây.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((course) => (
                <CourseApprovalRow
                  key={course.id}
                  course={course}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
