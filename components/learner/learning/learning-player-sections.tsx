"use client";

import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileQuestion,
  Lock,
  PlayCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LearnerQuizPanel } from "@/app/(learner)/learner/courses/[courseId]/learn/learner-quiz-panel";
import { mapLearningError } from "@/hooks/useLearning";
import { cn } from "@/lib/utils";
import type {
  LearningCourse,
  LearningLesson,
  LearningLessonSummary,
} from "@/services/api/learning";

export function formatProgress(progress: string): string {
  const value = Number(progress);
  if (!Number.isFinite(value)) return "0%";

  return `${Math.min(Math.max(value, 0), 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })}%`;
}

export function getProgressValue(progress: string): number {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(value, 0), 100);
}

export function LearningPlayerSkeleton() {
  return (
    <div className="container grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[320px_1fr]">
      <Skeleton className="h-96 rounded-3xl" />
      <Skeleton className="h-[520px] rounded-3xl" />
    </div>
  );
}

export function LearningCourseError({
  courseId,
  error,
}: {
  courseId: string;
  error: unknown;
}) {
  return (
    <div className="container w-full max-w-3xl px-6">
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Không tải được nội dung học tập</AlertTitle>
        <AlertDescription>{mapLearningError(error)}</AlertDescription>
      </Alert>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/courses/${courseId}`} className={buttonVariants()}>
          Xem chi tiết khóa học
        </Link>
        <Link
          href="/learner/courses"
          className={buttonVariants({ variant: "outline" })}
        >
          Khóa học của tôi
        </Link>
      </div>
    </div>
  );
}

export function EmptyLearningCourse() {
  return (
    <div className="container w-full max-w-3xl px-6">
      <Card>
        <CardHeader>
          <CardTitle>Khóa học chưa có bài học</CardTitle>
          <CardDescription>
            Vui lòng quay lại sau khi giảng viên cập nhật nội dung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/learner/courses"
            className={buttonVariants({ variant: "outline" })}
          >
            Quay lại khóa học của tôi
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function LessonTree({
  lessons,
  activeLessonId,
  onSelectLesson,
}: {
  lessons: LearningLessonSummary[];
  activeLessonId: string | null;
  onSelectLesson: (lesson: LearningLessonSummary) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {lessons.map((lesson) => {
        const isActive = lesson.id === activeLessonId;
        const Icon = lesson.isCompleted
          ? CheckCircle2
          : lesson.isAccessible
            ? PlayCircle
            : Lock;

        return (
          <button
            key={lesson.id}
            type="button"
            disabled={!lesson.isAccessible}
            onClick={() => onSelectLesson(lesson)}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
              isActive
                ? "border-primary bg-primary/10"
                : "bg-card hover:bg-muted/60",
              !lesson.isAccessible &&
                "cursor-not-allowed opacity-70 hover:bg-card",
            )}
          >
            <Icon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{lesson.title}</span>
              {lesson.blockedReason && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {lesson.blockedReason}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LearningSidebar({
  activeLessonId,
  learningCourse,
  onSelectLesson,
}: {
  activeLessonId: string | null;
  learningCourse: LearningCourse;
  onSelectLesson: (lesson: LearningLessonSummary) => void;
}) {
  const progressLabel = formatProgress(learningCourse.enrollment.progress);
  const progressValue = getProgressValue(learningCourse.enrollment.progress);

  return (
    <aside className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {learningCourse.course.learningOrder === "sequential"
              ? "Học tuần tự"
              : "Học tự do"}
          </Badge>
          <CardTitle>{learningCourse.course.title}</CardTitle>
          <CardDescription>{learningCourse.course.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tiến độ</span>
              <span className="text-muted-foreground">{progressLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
          <Separator />
          <LessonTree
            lessons={learningCourse.lessons}
            activeLessonId={activeLessonId}
            onSelectLesson={onSelectLesson}
          />
        </CardContent>
      </Card>
    </aside>
  );
}

function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().split("?")[0].endsWith(".pdf");
  }
}

export function MaterialPanel({ materialUrl }: { materialUrl: string | null }) {
  if (!materialUrl) return null;

  const isPdf = isPdfUrl(materialUrl);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Tài liệu bài học</h3>
        <a
          href={materialUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ExternalLink data-icon="inline-start" aria-hidden="true" />
          Mở tài liệu
        </a>
      </div>
      {isPdf ? (
        <iframe
          title="Tài liệu bài học"
          src={materialUrl}
          className="h-[520px] w-full rounded-2xl border bg-muted"
        />
      ) : (
        <Alert>
          <BookOpen aria-hidden="true" />
          <AlertTitle>Không hỗ trợ xem trước trực tiếp</AlertTitle>
          <AlertDescription>
            Định dạng tài liệu này sẽ được mở trong tab mới.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function LessonVideo({
  lesson,
  videoRef,
  onLoadedMetadata,
  onPause,
  onRateChange,
  onTimeUpdate,
  onVolumeChange,
}: {
  lesson: LearningLesson;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onLoadedMetadata: () => void;
  onPause: () => void;
  onRateChange: () => void;
  onTimeUpdate: () => void;
  onVolumeChange: () => void;
}) {
  if (!lesson.videoUrl) {
    return (
      <Alert>
        <PlayCircle aria-hidden="true" />
        <AlertTitle>Video đang được cập nhật</AlertTitle>
        <AlertDescription>
          Nội dung video của bài học chưa sẵn sàng.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <video
      key={lesson.id}
      ref={videoRef}
      controls
      className="aspect-video w-full rounded-2xl bg-black"
      src={lesson.videoUrl}
      onLoadedMetadata={onLoadedMetadata}
      onPause={onPause}
      onRateChange={onRateChange}
      onTimeUpdate={onTimeUpdate}
      onVolumeChange={onVolumeChange}
    />
  );
}

function LessonMedia({
  lesson,
  videoRef,
  onLoadedMetadata,
  onPause,
  onRateChange,
  onTimeUpdate,
  onVolumeChange,
}: {
  lesson: LearningLesson;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onLoadedMetadata: () => void;
  onPause: () => void;
  onRateChange: () => void;
  onTimeUpdate: () => void;
  onVolumeChange: () => void;
}) {
  return (
    <>
      <LessonVideo
        lesson={lesson}
        videoRef={videoRef}
        onLoadedMetadata={onLoadedMetadata}
        onPause={onPause}
        onRateChange={onRateChange}
        onTimeUpdate={onTimeUpdate}
        onVolumeChange={onVolumeChange}
      />
      <MaterialPanel materialUrl={lesson.materialUrl} />
    </>
  );
}

export function LessonContentCard({
  tab,
  onTabChange,
  courseId,
  hasQuiz,
  isError,
  isLoading,
  lesson,
  lessonError,
  videoRef,
  onLoadedMetadata,
  onPause,
  onRateChange,
  onTimeUpdate,
  onVolumeChange,
}: {
  tab: "lesson" | "quiz";
  onTabChange: (tab: "lesson" | "quiz") => void;
  courseId: string;
  hasQuiz: boolean;
  isError: boolean;
  isLoading: boolean;
  lesson: LearningLesson | undefined;
  lessonError: unknown;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onLoadedMetadata: () => void;
  onPause: () => void;
  onRateChange: () => void;
  onTimeUpdate: () => void;
  onVolumeChange: () => void;
}) {
  return (
    <main>
      <Card className="min-h-[520px]">
        {isLoading ? (
          <CardContent className="flex flex-col gap-4 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </CardContent>
        ) : isError ? (
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Không tải được bài học</AlertTitle>
              <AlertDescription>
                {mapLearningError(lessonError)}
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : lesson ? (
          <>
            <CardHeader>
              <CardTitle>{lesson.title}</CardTitle>
              <CardDescription>
                {lesson.description || "Không có mô tả bài học."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {hasQuiz ? (
                <Tabs
                  defaultValue={tab}
                  onValueChange={onTabChange}
                  className="gap-5"
                >
                  <TabsList>
                    <TabsTrigger value="lesson">
                      <BookOpen data-icon="inline-start" aria-hidden="true" />
                      Bài học
                    </TabsTrigger>
                    <TabsTrigger value="quiz">
                      <FileQuestion
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                      Bài kiểm tra
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="lesson" className="flex flex-col gap-6">
                    <LessonMedia
                      onRateChange={onRateChange}
                      lesson={lesson}
                      onVolumeChange={onVolumeChange}
                      videoRef={videoRef}
                      onLoadedMetadata={onLoadedMetadata}
                      onPause={onPause}
                      onTimeUpdate={onTimeUpdate}
                    />
                  </TabsContent>
                  <TabsContent value="quiz">
                    <LearnerQuizPanel
                      courseId={courseId}
                      lessonId={lesson.id}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <LessonMedia
                  onRateChange={onRateChange}
                  lesson={lesson}
                  onVolumeChange={onVolumeChange}
                  videoRef={videoRef}
                  onLoadedMetadata={onLoadedMetadata}
                  onPause={onPause}
                  onTimeUpdate={onTimeUpdate}
                />
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Chọn một bài học có thể truy cập để bắt đầu.
            </p>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
