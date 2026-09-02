"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmptyLearningCourse,
  LearningCourseError,
  LearningPlayerSkeleton,
  LearningSidebar,
  LessonContentCard,
} from "@/components/learner/learning/learning-player-sections";
import {
  useActiveLearningLesson,
  findAccessibleLesson,
} from "@/hooks/useActiveLearningLesson";
import { useLearnerQuiz } from "@/hooks/useLearnerQuizzes";
import { useLessonVideoTracking } from "@/hooks/useLessonVideoTracking";
import {
  getLearningErrorStatus,
  useLearningCourse,
  useLearningLesson,
  useSendLessonWatchEvent,
} from "@/hooks/useLearning";
import {
  activeLessonStorageKey,
  safeWriteLocalStorage,
} from "@/lib/learning-player-storage";

interface LearningPlayerClientProps {
  courseId: string;
}

export function LearningPlayerClient({ courseId }: LearningPlayerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryLessonId = searchParams.get("lessonId");
  const courseQuery = useLearningCourse(courseId);
  const { activeLessonId, selectLesson } = useActiveLearningLesson({
    course: courseQuery.data,
    courseId,
    queryLessonId,
    router,
  });
  const lessonQuery = useLearningLesson(courseId, activeLessonId);
  const quizAvailabilityQuery = useLearnerQuiz(courseId, activeLessonId);
  const watchEventMutation = useSendLessonWatchEvent(courseId, activeLessonId);
  const hasQuiz = Boolean(quizAvailabilityQuery.data?.quiz);
  const videoTracking = useLessonVideoTracking({
    activeLessonId,
    courseId,
    lesson: lessonQuery.data,
    mutation: watchEventMutation,
  });

  useEffect(() => {
    if (
      courseQuery.isError &&
      getLearningErrorStatus(courseQuery.error) === 403
    ) {
      router.replace(`/courses/${courseId}`);
    }
  }, [courseId, courseQuery.error, courseQuery.isError, router]);

  useEffect(() => {
    if (
      !lessonQuery.isError ||
      getLearningErrorStatus(lessonQuery.error) !== 403
    ) {
      return;
    }

    const fallbackLesson = courseQuery.data
      ? findAccessibleLesson(
          courseQuery.data,
          courseQuery.data.firstAccessibleLessonId,
        )
      : null;

    if (!fallbackLesson || fallbackLesson.id === activeLessonId) return;

    safeWriteLocalStorage(activeLessonStorageKey(courseId), fallbackLesson.id);
    router.replace(
      `/learner/courses/${courseId}/learn?lessonId=${fallbackLesson.id}`,
      { scroll: false },
    );
  }, [
    activeLessonId,
    courseId,
    courseQuery.data,
    lessonQuery.error,
    lessonQuery.isError,
    router,
  ]);

  if (courseQuery.isLoading) return <LearningPlayerSkeleton />;

  if (courseQuery.isError) {
    return (
      <LearningCourseError courseId={courseId} error={courseQuery.error} />
    );
  }

  if (!courseQuery.data) return <LearningPlayerSkeleton />;

  if (courseQuery.data.lessons.length === 0) return <EmptyLearningCourse />;

  return (
    <div className="container grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[320px_1fr]">
      <LearningSidebar
        activeLessonId={activeLessonId}
        learningCourse={courseQuery.data}
        onSelectLesson={selectLesson}
      />
      <LessonContentCard
        courseId={courseId}
        hasQuiz={hasQuiz}
        isError={lessonQuery.isError}
        isLoading={lessonQuery.isLoading}
        lesson={lessonQuery.data}
        lessonError={lessonQuery.error}
        videoRef={videoTracking.videoRef}
        onLoadedMetadata={videoTracking.handleLoadedMetadata}
        onPause={videoTracking.handleVideoPause}
        onTimeUpdate={videoTracking.handleVideoTimeUpdate}
      />
    </div>
  );
}
