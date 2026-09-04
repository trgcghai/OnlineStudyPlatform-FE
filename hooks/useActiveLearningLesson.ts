"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  selectActiveLessonIdForCourse,
  setActiveLesson,
} from "@/lib/features/activeLearningLessonSlice";
import type { AppDispatch, RootState } from "@/lib/store";
import type {
  LearningCourse,
  LearningLessonSummary,
} from "@/services/api/learning";

function findSpecificAccessibleLesson(
  course: LearningCourse,
  preferredLessonId: string | null,
): LearningLessonSummary | null {
  if (preferredLessonId) {
    const preferred = course.lessons.find(
      (lesson) => lesson.id === preferredLessonId && lesson.isAccessible,
    );
    if (preferred) return preferred;
  }

  return null;
}

export function findAccessibleLesson(
  course: LearningCourse,
  preferredLessonId: string | null,
): LearningLessonSummary | null {
  const preferred = findSpecificAccessibleLesson(course, preferredLessonId);
  if (preferred) return preferred;

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
  searchParamsText,
  router,
}: {
  course: LearningCourse | undefined;
  courseId: string;
  queryLessonId: string | null;
  searchParamsText: string;
  router: AppRouterInstance;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const savedLessonId = useSelector((state: RootState) =>
    selectActiveLessonIdForCourse(state, courseId),
  );
  const activeLesson = course
    ? (findSpecificAccessibleLesson(course, queryLessonId) ??
      findSpecificAccessibleLesson(course, savedLessonId) ??
      findAccessibleLesson(course, null))
    : null;
  const activeLessonId = activeLesson?.id ?? null;

  useEffect(() => {
    if (!activeLessonId) return;

    dispatch(setActiveLesson({ courseId, lessonId: activeLessonId }));
    if (queryLessonId === activeLessonId) return;

    const params = new URLSearchParams(searchParamsText);
    params.set("lessonId", activeLessonId);
    router.replace(`/learner/courses/${courseId}/learn?${params.toString()}`, {
      scroll: false,
    });
  }, [
    activeLessonId,
    courseId,
    dispatch,
    queryLessonId,
    router,
    searchParamsText,
  ]);

  function selectLesson(lesson: LearningLessonSummary) {
    if (!lesson.isAccessible) return;

    dispatch(setActiveLesson({ courseId, lessonId: lesson.id }));
    const params = new URLSearchParams(searchParamsText);
    params.set("lessonId", lesson.id);
    router.replace(`/learner/courses/${courseId}/learn?${params.toString()}`, {
      scroll: false,
    });
  }

  return { activeLesson, activeLessonId, selectLesson };
}
