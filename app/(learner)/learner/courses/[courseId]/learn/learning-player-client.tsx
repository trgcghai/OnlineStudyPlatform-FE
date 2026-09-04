"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
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
import { setActiveLesson } from "@/lib/features/activeLearningLessonSlice";
import type { AppDispatch } from "@/lib/store";

interface LearningPlayerClientProps {
  courseId: string;
}

export function LearningPlayerClient({ courseId }: LearningPlayerClientProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryLessonId = searchParams.get("lessonId");
  const searchParamsText = searchParams.toString();
  const tab: "lesson" | "quiz" = (searchParams.get("tab") ?? "lesson") as
    "lesson" | "quiz";
  const courseQuery = useLearningCourse(courseId);
  const { activeLessonId, selectLesson } = useActiveLearningLesson({
    course: courseQuery.data,
    courseId,
    searchParamsText,
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

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("tab", newTab);

    router.replace(`?${params.toString()}`, {
      scroll: false,
    });
  };

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

    dispatch(setActiveLesson({ courseId, lessonId: fallbackLesson.id }));
    const params = new URLSearchParams(searchParamsText);
    params.set("lessonId", fallbackLesson.id);
    router.replace(`/learner/courses/${courseId}/learn?${params.toString()}`, {
      scroll: false,
    });
  }, [
    activeLessonId,
    courseId,
    dispatch,
    courseQuery.data,
    lessonQuery.error,
    lessonQuery.isError,
    searchParamsText,
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
        tab={tab}
        onTabChange={handleTabChange}
        courseId={courseId}
        hasQuiz={hasQuiz}
        isError={lessonQuery.isError}
        isLoading={lessonQuery.isLoading}
        lesson={lessonQuery.data}
        lessonError={lessonQuery.error}
        videoRef={videoTracking.videoRef}
        onLoadedMetadata={videoTracking.handleLoadedMetadata}
        onRateChange={videoTracking.handleRateChange}
        onPause={videoTracking.handleVideoPause}
        onVolumeChange={videoTracking.handleVolumeChange}
        onTimeUpdate={videoTracking.handleVideoTimeUpdate}
      />
    </div>
  );
}
