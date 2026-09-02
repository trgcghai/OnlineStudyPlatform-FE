"use client";

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
import type { QuizSummary } from "@/services/api/quizzes";

interface EssayGradingSelectorsProps {
  courses: Course[];
  lessons: Lesson[];
  quizzes: QuizSummary[];
  courseId: string;
  lessonId: string;
  quizId: string;
  status: EssayGradingStatusFilter;
  coursesLoading: boolean;
  lessonsLoading: boolean;
  quizzesLoading: boolean;
  onCourseChange: (value: string) => void;
  onLessonChange: (value: string) => void;
  onQuizChange: (value: string) => void;
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
  quizzes,
  courseId,
  lessonId,
  quizId,
  status,
  coursesLoading,
  lessonsLoading,
  quizzesLoading,
  onCourseChange,
  onLessonChange,
  onQuizChange,
  onStatusChange,
}: EssayGradingSelectorsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Field>
        <FieldLabel>Khóa học</FieldLabel>
        <Select
          value={courseId}
          onValueChange={(value) => onCourseChange(value ?? "")}
          disabled={coursesLoading || courses.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={coursesLoading ? "Đang tải..." : "Chọn khóa học"}
            />
          </SelectTrigger>
          <SelectContent>
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
          value={lessonId}
          onValueChange={(value) => onLessonChange(value ?? "")}
          disabled={!courseId || lessonsLoading || lessons.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={lessonsLoading ? "Đang tải..." : "Chọn bài học"}
            />
          </SelectTrigger>
          <SelectContent>
            {lessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Bài kiểm tra</FieldLabel>
        <Select
          value={quizId}
          onValueChange={(value) => onQuizChange(value ?? "")}
          disabled={!lessonId || quizzesLoading || quizzes.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={quizzesLoading ? "Đang tải..." : "Chọn bài kiểm tra"}
            />
          </SelectTrigger>
          <SelectContent>
            {quizzes.map((quiz) => (
              <SelectItem key={quiz.id} value={quiz.id}>
                {quiz.title}
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
    </div>
  );
}
