"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { PanelRightOpen } from "lucide-react";
import {
  EmptyLearningCourse,
  LearningCourseError,
  LearningPlayerSkeleton,
  LearningPlayerTopbar,
  LearningSidebar,
  LessonContentCard,
} from "@/components/learner/learning/learning-player-sections";
import { AiChatCard } from "@/components/learner/learning/ai-chat-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const [lessonPanelOpen, setLessonPanelOpen] = useState(true);
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
    <div className="flex min-h-dvh flex-col bg-background">
      <LearningPlayerTopbar learningCourse={courseQuery.data} />
      <div className="relative flex flex-1 flex-col lg:flex-row">
        <main className="min-w-0 flex-1">
          <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
            <LessonContentCard
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
            <AiChatCard courseId={courseId} />
          </div>
        </main>
        {lessonPanelOpen ? (
          <aside className="w-full shrink-0 border-t bg-card lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:w-[26rem] lg:overflow-y-auto lg:border-l lg:border-t-0">
            <LearningSidebar
              activeLessonId={activeLessonId}
              lessonPanelOpen={lessonPanelOpen}
              learningCourse={courseQuery.data}
              onSelectLesson={selectLesson}
              onToggleLessonPanel={() => setLessonPanelOpen((open) => !open)}
            />
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setLessonPanelOpen(true)}
            aria-pressed={false}
            title="Hiện danh sách bài học"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "fixed right-3 top-16 z-40 rounded-full",
            )}
          >
            <PanelRightOpen aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
