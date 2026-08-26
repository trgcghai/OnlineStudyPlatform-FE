"use client";

import { useState } from "react";
import {
  FileText,
  Film,
  GripVertical,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteLessonDialog } from "@/components/instructor/lessons/delete-lesson-dialog";
import { LessonFormDialog } from "@/components/instructor/lessons/lesson-form-dialog";
import {
  useInstructorLessonsList,
  useReorderInstructorLessons,
} from "@/hooks/useInstructorLessons";
import type { Lesson } from "@/services/api/lessons";

interface LessonListProps {
  courseId: string;
}

export function LessonList({ courseId }: LessonListProps) {
  const [creating, setCreating] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const { data, isError, isPending, refetch } =
    useInstructorLessonsList(courseId);
  const { reorderInstructorLessons, isPending: isReordering } =
    useReorderInstructorLessons();
  const items = data?.items ?? [];

  async function handleMoveUp(index: number) {
    if (index <= 0 || isReordering) return;
    const orderedIds = items.map((l) => l.id);
    [orderedIds[index - 1], orderedIds[index]] = [
      orderedIds[index],
      orderedIds[index - 1],
    ];
    await reorderInstructorLessons(courseId, orderedIds);
  }

  async function handleMoveDown(index: number) {
    if (index >= items.length - 1 || isReordering) return;
    const orderedIds = items.map((l) => l.id);
    [orderedIds[index], orderedIds[index + 1]] = [
      orderedIds[index + 1],
      orderedIds[index],
    ];
    await reorderInstructorLessons(courseId, orderedIds);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách bài học</CardTitle>
        <CardDescription>
          Quản lý thứ tự và nội dung bài học trong khóa học. Kéo thả hoặc sử
          dụng nút mũi tên để sắp xếp.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus /> Thêm bài học
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Không thể tải danh sách bài học</AlertTitle>
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
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 w-full rounded-lg"
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {!isError && !isPending && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Film
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-medium">Chưa có bài học</p>
            <p className="text-sm text-muted-foreground">
              Thêm bài học đầu tiên để bắt đầu xây dựng nội dung khóa học.
            </p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => setCreating(true)}
            >
              <Plus /> Thêm bài học
            </Button>
          </div>
        )}

        {!isError && !isPending && items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Bài học</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Tài liệu</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((lesson, index) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {index + 1}
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
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lesson.materialUrl ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <FileText className="size-3.5" />
                            Có
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isReordering || index === 0}
                            onClick={() => handleMoveUp(index)}
                            aria-label="Di chuyển lên"
                          >
                            <GripVertical className="size-4 rotate-180" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={
                              isReordering || index === items.length - 1
                            }
                            onClick={() => handleMoveDown(index)}
                            aria-label="Di chuyển xuống"
                          >
                            <GripVertical className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingLesson(lesson)}
                            aria-label={`Chỉnh sửa ${lesson.title}`}
                          >
                            <PencilLine />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingLesson(lesson)}
                            aria-label={`Xóa ${lesson.title}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <LessonFormDialog
          open={creating}
          onOpenChange={setCreating}
          courseId={courseId}
        />

        <LessonFormDialog
          open={Boolean(editingLesson)}
          onOpenChange={(open) => {
            if (!open) setEditingLesson(null);
          }}
          courseId={courseId}
          lesson={editingLesson}
        />

        <DeleteLessonDialog
          lesson={deletingLesson}
          courseId={courseId}
          onOpenChange={(open) => {
            if (!open) setDeletingLesson(null);
          }}
        />
      </CardContent>
    </Card>
  );
}
