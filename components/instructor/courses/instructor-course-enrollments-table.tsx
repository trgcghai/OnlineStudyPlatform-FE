"use client";

import { BookOpen, SearchX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  CourseEnrollmentCompletionStatus,
  CourseEnrollmentListItem,
} from "@/services/api/enrollments";
import { formatDate } from "@/utils/dateTimeUtil";

const COMPLETION_LABELS: Record<CourseEnrollmentCompletionStatus, string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang học",
  completed: "Hoàn thành",
};

const COMPLETION_BADGE_VARIANTS: Record<
  CourseEnrollmentCompletionStatus,
  "default" | "secondary" | "outline"
> = {
  not_started: "outline",
  in_progress: "secondary",
  completed: "default",
};

function getProgressValue(progress: string): number {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(value, 0), 100);
}

function formatProgress(progress: string): string {
  return `${getProgressValue(progress).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatScore(score: number): string {
  return score.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function QuizSummary({ item }: { item: CourseEnrollmentListItem }) {
  const { quizSummary } = item;

  if (quizSummary.passed === null) {
    return (
      <span className="text-sm text-muted-foreground">Chưa có dữ liệu</span>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-2">
        {quizSummary.bestScore !== null && (
          <span className="font-medium">
            {formatScore(quizSummary.bestScore)} điểm
          </span>
        )}
        <Badge variant={quizSummary.passed ? "default" : "secondary"}>
          {quizSummary.passed ? "Đạt" : "Chưa đạt"}
        </Badge>
      </div>
      <span className="text-xs text-muted-foreground">
        {quizSummary.latestAttemptAt
          ? `Lần gần nhất: ${formatDate(quizSummary.latestAttemptAt)}`
          : "Chưa có lần nộp gần nhất"}
      </span>
    </div>
  );
}

function EnrollmentRow({ item }: { item: CourseEnrollmentListItem }) {
  const progressValue = getProgressValue(item.progress);

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{item.learner.name}</span>
          <span className="text-sm text-muted-foreground">
            {item.learner.email}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(item.enrolledAt)}
      </TableCell>
      <TableCell>
        <div className="min-w-32">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{formatProgress(item.progress)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={COMPLETION_BADGE_VARIANTS[item.completionStatus]}>
          {COMPLETION_LABELS[item.completionStatus]}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.lastActivityAt ? formatDate(item.lastActivityAt) : "-"}
      </TableCell>
      <TableCell>
        <QuizSummary item={item} />
      </TableCell>
    </TableRow>
  );
}

interface InstructorCourseEnrollmentsTableProps {
  items: CourseEnrollmentListItem[];
  isError: boolean;
  isPending: boolean;
  hasSearch: boolean;
  onRefetch: () => void;
}

export function InstructorCourseEnrollmentsTable({
  items,
  isError,
  isPending,
  hasSearch,
  onRefetch,
}: InstructorCourseEnrollmentsTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải danh sách học viên</AlertTitle>
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
            className="h-14 w-full rounded-lg"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    const Icon = hasSearch ? SearchX : BookOpen;

    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
        <Icon className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">
          {hasSearch
            ? "Không tìm thấy học viên phù hợp"
            : "Chưa có học viên đăng ký"}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {hasSearch
            ? "Thử thay đổi từ khóa tìm kiếm."
            : "Khi học viên đăng ký khóa học, danh sách sẽ hiển thị tại đây."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học viên</TableHead>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Hoàn thành</TableHead>
              <TableHead>Hoạt động gần nhất</TableHead>
              <TableHead>Bài kiểm tra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <EnrollmentRow key={item.enrollmentId} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
