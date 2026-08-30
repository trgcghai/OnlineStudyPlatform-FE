"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Film,
  GripVertical,
  ListChecks,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
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
import { cn } from "@/lib/utils";
import type { Lesson } from "@/services/api/lessons";

interface SortableLessonRowProps {
  lesson: Lesson;
  index: number;
  courseId: string;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

function SortableLessonRow({
  lesson,
  index,
  courseId,
  onEdit,
  onDelete,
}: SortableLessonRowProps) {
  const { isDragging, ref, handleRef } = useSortable({
    id: lesson.id,
    index,
    plugins: [],
  });

  return (
    <TableRow ref={ref} className={cn(isDragging && "opacity-50")}>
      <TableCell className="w-12 text-center">
        <button
          type="button"
          ref={handleRef}
          className="inline-flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Kéo để di chuyển"
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
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
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm">
            <Link
              href={`/instructor/courses/${courseId}/lessons/${lesson.id}/quiz`}
              aria-label={`Quản lý bài kiểm tra của ${lesson.title}`}
            >
              <ListChecks />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(lesson)}
            aria-label={`Chỉnh sửa ${lesson.title}`}
          >
            <PencilLine />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(lesson)}
            aria-label={`Xóa ${lesson.title}`}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface LessonListProps {
  courseId: string;
}

export function LessonList({ courseId }: LessonListProps) {
  const [creating, setCreating] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const { data, isError, isPending, refetch } =
    useInstructorLessonsList(courseId);
  const { reorderInstructorLessons } = useReorderInstructorLessons();
  const items = data?.items ?? [];

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled) return;
    const sourceId = event.operation.source?.id;
    const targetId = event.operation.target?.id;
    if (!sourceId || !targetId || sourceId === targetId) return;

    const oldIndex = items.findIndex((l) => l.id === sourceId);
    const newIndex = items.findIndex((l) => l.id === targetId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderInstructorLessons(
      courseId,
      reordered.map((l) => l.id),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách bài học</CardTitle>
        <CardDescription>
          Quản lý thứ tự và nội dung bài học trong khóa học. Kéo thả để sắp xếp
          lại thứ tự.
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
              <DragDropProvider onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12" />
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Bài học</TableHead>
                      <TableHead>Video</TableHead>
                      <TableHead>Tài liệu</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((lesson, index) => (
                      <SortableLessonRow
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        courseId={courseId}
                        onEdit={setEditingLesson}
                        onDelete={setDeletingLesson}
                      />
                    ))}
                  </TableBody>
                </Table>
              </DragDropProvider>
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
