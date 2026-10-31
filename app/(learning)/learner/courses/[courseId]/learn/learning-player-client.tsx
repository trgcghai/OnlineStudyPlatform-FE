"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmptyLearningCourse,
  LearningCourseError,
  LearningPlayerSkeleton,
  LearningPlayerTopbar,
  LearningSidebar,
  LessonContentCard,
} from "@/components/learner/learning/learning-player-sections";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const videoTracking = useLessonVideoTracking({
    activeLessonId,
    courseId,
    lesson: lessonQuery.data,
    mutation: watchEventMutation,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateLayout = () => {
      setIsDesktopLayout(mediaQuery.matches);
      if (mediaQuery.matches) setMobileSidebarOpen(false);
    };

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);

    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

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

  const lessonContent = (
    <main className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="flex min-h-full w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <LessonContentCard
          courseId={courseId}
          isSavingWatchProgress={watchEventMutation.isPending}
          hasQuiz={hasQuiz}
          isQuizLoading={quizAvailabilityQuery.isLoading}
          isQuizError={quizAvailabilityQuery.isError}
          quizError={quizAvailabilityQuery.error}
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
    </main>
  );

  const learningSidebar = (
    <LearningSidebar
      activeLessonId={activeLessonId}
      lessonPanelOpen={isDesktopLayout ? lessonPanelOpen : mobileSidebarOpen}
      learningCourse={courseQuery.data}
      onSelectLesson={selectLesson}
      onToggleLessonPanel={() => {
        if (isDesktopLayout) {
          setLessonPanelOpen(false);
        } else {
          setMobileSidebarOpen(false);
        }
      }}
    />
  );

  const isPanelOpen = isDesktopLayout ? lessonPanelOpen : mobileSidebarOpen;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <LearningPlayerTopbar
        learningCourse={courseQuery.data}
        isPanelOpen={isPanelOpen}
        onShowPanel={() => {
          if (isDesktopLayout) {
            setLessonPanelOpen(true);
          } else {
            setMobileSidebarOpen(true);
          }
        }}
      />
      {isDesktopLayout ? (
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-[calc(100dvh-3.5rem)] min-h-0 flex-1 overflow-hidden"
        >
          <ResizablePanel
            defaultSize={lessonPanelOpen ? "72%" : "100%"}
            minSize={560}
            maxSize={lessonPanelOpen ? "85%" : "100%"}
            className="min-h-0 min-w-0 overflow-hidden"
          >
            {lessonContent}
          </ResizablePanel>
          {lessonPanelOpen && (
            <>
              <ResizableHandle
                withHandle
                aria-label="Điều chỉnh độ rộng bảng học tập"
                className="z-20 transition-colors hover:bg-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
              />
              <ResizablePanel
                defaultSize="28%"
                minSize={320}
                maxSize={560}
                className="min-h-0 min-w-0 overflow-hidden border-l bg-card"
              >
                {learningSidebar}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">{lessonContent}</div>
      )}
      <Sheet
        open={!isDesktopLayout && mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[min(24rem,90vw)] max-w-none overflow-hidden p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Nội dung khóa học và trợ lý AI</SheetTitle>
          </SheetHeader>
          {learningSidebar}
        </SheetContent>
      </Sheet>
    </div>
  );
}
