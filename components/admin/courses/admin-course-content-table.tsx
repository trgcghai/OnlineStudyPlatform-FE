"use client";

import { FileText, Film, ListChecks } from "lucide-react";
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
import type { AdminCourseLessonItem } from "@/services/api/admin-course-content";

function QuizCell({ item }: { item: AdminCourseLessonItem }) {
  const quiz = item.quiz;

  if (!quiz) {
    return (
      <span className="text-sm text-muted-foreground">
        Chưa có bài kiểm tra
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1 font-medium">
        <ListChecks
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        {quiz.title}
      </span>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{quiz.questionCount} câu hỏi</span>
        <Badge variant="secondary">
          Đạt từ {quiz.passScore}% ({quiz.passScorePoints}/{quiz.totalPoints}{" "}
          điểm)
        </Badge>
      </div>
    </div>
  );
}

function AdminCourseContentRow({ item }: { item: AdminCourseLessonItem }) {
  const { lesson } = item;

  return (
    <TableRow>
      <TableCell className="w-12 text-center text-sm text-muted-foreground">
        {lesson.position + 1}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{lesson.title}</span>
          {lesson.description && (
            <span className="line-clamp-1 text-sm text-muted-foreground">
              {lesson.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {lesson.videoUrl ? (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <Film className="size-3.5" />
            Có
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {lesson.materialUrl ? (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <FileText className="size-3.5" />
            Có
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <QuizCell item={item} />
      </TableCell>
    </TableRow>
  );
}

interface AdminCourseContentTableProps {
  items: AdminCourseLessonItem[];
  isError: boolean;
  isPending: boolean;
  onRefetch: () => void;
}

export function AdminCourseContentTable({
  items,
  isError,
  isPending,
  onRefetch,
}: AdminCourseContentTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải nội dung khóa học</AlertTitle>
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
        {Array.from({ length: 3 }).map((_, index) => (
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
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Film className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Chưa có bài học</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Khóa học này chưa có bài học hoặc bài kiểm tra nào.
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
              <TableHead className="w-12">#</TableHead>
              <TableHead>Bài học</TableHead>
              <TableHead>Video</TableHead>
              <TableHead>Tài liệu</TableHead>
              <TableHead>Bài kiểm tra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <AdminCourseContentRow key={item.lesson.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
