"use client";

import { useEffect, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  activeLessonStorageKey,
  safeReadLocalStorage,
  safeWriteLocalStorage,
} from "@/lib/learning-player-storage";
import type {
  LearningCourse,
  LearningLessonSummary,
} from "@/services/api/learning";

export function findAccessibleLesson(
  course: LearningCourse,
  preferredLessonId: string | null,
): LearningLessonSummary | null {
  if (preferredLessonId) {
    const preferred = course.lessons.find(
      (lesson) => lesson.id === preferredLessonId && lesson.isAccessible,
    );
    if (preferred) return preferred;
  }

  if (course.firstAccessibleLessonId) {
    const firstAccessible = course.lessons.find(
      (lesson) => lesson.id === course.firstAccessibleLessonId,
    );
    if (firstAccessible?.isAccessible) return firstAccessible;
  }

  return course.lessons.find((lesson) => lesson.isAccessible) ?? null;
}

export function useActiveLearningLesson({
  course,
  courseId,
  queryLessonId,
  router,
}: {
  course: LearningCourse | undefined;
  courseId: string;
  queryLessonId: string | null;
  router: AppRouterInstance;
}) {
  const [preferredLessonId, setPreferredLessonId] = useState<string | null>(
    () => safeReadLocalStorage(activeLessonStorageKey(courseId)),
  );
  const activeLesson = course
    ? (findAccessibleLesson(course, queryLessonId) ??
      findAccessibleLesson(course, preferredLessonId) ??
      findAccessibleLesson(course, null))
    : null;
  const activeLessonId = activeLesson?.id ?? null;

  useEffect(() => {
    if (!activeLessonId) return;

    safeWriteLocalStorage(activeLessonStorageKey(courseId), activeLessonId);
    if (queryLessonId === activeLessonId) return;

    router.replace(
      `/learner/courses/${courseId}/learn?lessonId=${activeLessonId}`,
      { scroll: false },
    );
  }, [activeLessonId, courseId, queryLessonId, router]);

  function selectLesson(lesson: LearningLessonSummary) {
    if (!lesson.isAccessible) return;

    setPreferredLessonId(lesson.id);
    safeWriteLocalStorage(activeLessonStorageKey(courseId), lesson.id);
    router.replace(`/learner/courses/${courseId}/learn?lessonId=${lesson.id}`, {
      scroll: false,
    });
  }

  return { activeLesson, activeLessonId, selectLesson };
}
