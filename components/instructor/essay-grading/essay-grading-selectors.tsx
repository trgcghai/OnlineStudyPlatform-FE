"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course } from "@/services/api/courses";
import {
  ESSAY_GRADING_STATUS_FILTERS,
  type EssayGradingStatusFilter,
} from "@/services/api/essay-grading";
import type { Lesson } from "@/services/api/lessons";

const ALL_FILTER_VALUE = "__all__";

interface EssayGradingSelectorsProps {
  courses: Course[];
  lessons: Lesson[];
  courseId: string;
  lessonId: string;
  status: EssayGradingStatusFilter;
  coursesLoading: boolean;
  lessonsLoading: boolean;
  onCourseChange: (value: string) => void;
  onLessonChange: (value: string) => void;
  onReset: () => void;
  onStatusChange: (value: EssayGradingStatusFilter) => void;
}

const statusOptions = [
  { value: ESSAY_GRADING_STATUS_FILTERS.PENDING, label: "Chờ chấm" },
  { value: ESSAY_GRADING_STATUS_FILTERS.GRADED, label: "Đã chấm" },
  { value: ESSAY_GRADING_STATUS_FILTERS.ALL, label: "Tất cả" },
] as const;

export function EssayGradingSelectors({
  courses,
  lessons,
  courseId,
  lessonId,
  status,
  coursesLoading,
  lessonsLoading,
  onCourseChange,
  onLessonChange,
  onReset,
  onStatusChange,
}: EssayGradingSelectorsProps) {
  const courseItems = Object.fromEntries([
    [ALL_FILTER_VALUE, "Tất cả khóa học"],
    ...courses.map((course) => [course.id, course.title]),
  ]);
  const lessonItems = Object.fromEntries([
    [ALL_FILTER_VALUE, "Tất cả bài học"],
    ...lessons.map((lesson) => [lesson.id, lesson.title]),
  ]);
  const statusItems = Object.fromEntries(
    statusOptions.map((option) => [option.value, option.label]),
  );

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <Field>
        <FieldLabel>Khóa học</FieldLabel>
        <Select
          value={courseId || ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onCourseChange(value === ALL_FILTER_VALUE ? "" : (value ?? ""))
          }
          disabled={coursesLoading || courses.length === 0}
          items={courseItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={coursesLoading ? "Đang tải..." : "Chọn khóa học"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>Tất cả khóa học</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Bài học</FieldLabel>
        <Select
          value={lessonId || ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onLessonChange(value === ALL_FILTER_VALUE ? "" : (value ?? ""))
          }
          disabled={!courseId || lessonsLoading || lessons.length === 0}
          items={lessonItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={lessonsLoading ? "Đang tải..." : "Chọn bài học"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>Tất cả bài học</SelectItem>
            {lessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Trạng thái</FieldLabel>
        <Select
          value={status}
          onValueChange={(value) =>
            onStatusChange(value as EssayGradingStatusFilter)
          }
          items={statusItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Button
        type="button"
        variant="destructive"
        className="w-full md:w-auto"
        onClick={onReset}
        disabled={
          !courseId &&
          !lessonId &&
          status === ESSAY_GRADING_STATUS_FILTERS.PENDING
        }
      >
        <X className="size-4" aria-hidden="true" />
        Xóa bộ lọc
      </Button>
    </div>
  );
}
