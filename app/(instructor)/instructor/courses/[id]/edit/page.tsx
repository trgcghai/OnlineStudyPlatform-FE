"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseForm } from "@/components/instructor/courses/course-form";
import {
  mapCourseError,
  useInstructorCourse,
} from "@/hooks/useInstructorCourses";

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { data, error, isError, isPending, refetch } =
    useInstructorCourse(courseId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
      >
        <Link href="/instructor/courses" className="flex items-center gap-2">
          <ArrowLeft /> Quay lại danh sách
        </Link>
      </Button>

      {isPending ? <Skeleton className="h-128 w-full" /> : null}

      {isError ? (
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
      ) : null}

      {data ? (
        <CourseForm mode="edit" course={data} />
      ) : null}
    </div>
  );
}
