"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonList } from "@/components/instructor/lessons/lesson-list";
import {
  mapCourseError,
  useInstructorCourse,
} from "@/hooks/useInstructorCourses";

export default function CourseLessonsPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { data, error, isError, isPending, refetch } =
    useInstructorCourse(courseId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit">
        <Link
          href={`/instructor/courses/${courseId}/edit`}
          className="flex items-center gap-2"
        >
          <ArrowLeft /> Quay lại chỉnh sửa khóa học
        </Link>
      </Button>

      {isPending ? <Skeleton className="h-96 w-full" /> : null}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải khóa học</AlertTitle>
          <AlertDescription>{mapCourseError(error)}</AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </Alert>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">{data.title}</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý bài học cho khóa học này
            </p>
          </div>
          <LessonList courseId={courseId} />
        </div>
      )}
    </div>
  );
}
