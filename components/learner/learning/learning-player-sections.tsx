"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileQuestion,
  Lock,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  PlayCircle,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LearnerQuizPanel } from "@/app/(learning)/learner/courses/[courseId]/learn/learner-quiz-panel";
import { AiChatCard } from "@/components/learner/learning/ai-chat-card";
import { LessonCompletionButton } from "./lesson-completion-button";
import {
  mapLearningError,
  useLearningLessonSummary,
} from "@/hooks/useLearning";
import { cn } from "@/lib/utils";
import type {
  LearningCourse,
  LearningLesson,
  LearningLessonSummary,
} from "@/services/api/learning";

type SummaryBlock =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] };

function parseSummaryMarkdown(content: string): SummaryBlock[] {
  const blocks: SummaryBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: "paragraph", content: paragraphLines.join(" ") });
    paragraphLines = [];
  };
  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", content: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }
    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function SummaryDocument({ content }: { content: string }) {
  const blocks = parseSummaryMarkdown(content);

  return (
    <article className="space-y-4 rounded-xl border bg-muted/20 p-5 text-foreground sm:p-6">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={`heading-${index}`}
              className="pt-1 text-base font-semibold tracking-tight first:pt-0"
            >
              {block.content}
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className="list-disc space-y-2 pl-5 text-sm leading-7 marker:text-primary"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`paragraph-${index}`} className="text-sm leading-7">
            {block.content}
          </p>
        );
      })}
    </article>
  );
}

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

function LearningVideoSkeleton() {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-black shadow-xl shadow-black/10">
      <Skeleton className="absolute inset-0 rounded-none bg-gradient-to-br from-primary/15 via-black/80 to-black" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="size-14 rounded-full bg-primary/35 ring-8 ring-primary/10 sm:size-16" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-5">
        <Skeleton className="h-1.5 w-full rounded-full bg-primary/55" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full bg-white/25" />
            <Skeleton className="h-3 w-20 bg-white/20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12 bg-white/20" />
            <Skeleton className="size-7 rounded-md bg-white/20" />
          </div>
        </div>
      </div>
      <Skeleton className="absolute left-4 top-4 h-6 w-24 rounded-full bg-white/20" />
    </div>
  );
}

function LessonSidebarSkeleton() {
  return (
    <aside
      aria-hidden="true"
      className="hidden min-h-0 shrink-0 flex-col gap-5 overflow-hidden border-l bg-card p-5 lg:flex lg:w-[clamp(20rem,28vw,35rem)]"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-24 rounded-full bg-primary/15" />
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border bg-background/70 p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-2 w-full rounded-full bg-primary/10">
          <span className="block h-full w-2/3 rounded-full bg-primary/55" />
        </Skeleton>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-xl bg-muted/80" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-3",
              index === 0 && "border-primary/30 bg-primary/5",
            )}
          >
            <Skeleton
              className={cn(
                "mt-0.5 size-4 shrink-0 rounded-full",
                index === 0 && "bg-primary/35",
              )}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function LearningPlayerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải giao diện học tập"
      aria-busy="true"
      className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background"
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-card px-4 sm:px-6">
        <Skeleton className="h-5 w-36 sm:w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-8 w-28 rounded-full sm:block" />
          <Skeleton className="size-9 rounded-full bg-primary/15 sm:hidden" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full w-full flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:px-8">
            <LearningVideoSkeleton />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-3/4 sm:h-8 sm:w-2/3" />
              <Skeleton className="h-4 w-full max-w-3xl" />
              <Skeleton className="h-4 w-4/5 max-w-2xl" />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card/70 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full bg-primary/15" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-full bg-primary/20" />
            </div>
            <Skeleton className="h-11 w-full max-w-xl rounded-xl bg-muted/80" />
            <div className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-xl bg-primary/15" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </main>
        <LessonSidebarSkeleton />
      </div>
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
    <div className="container mx-auto flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-6">
      <Alert className="w-full max-w-3xl!" variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Không tải được nội dung học tập</AlertTitle>
        <AlertDescription>{mapLearningError(error)}</AlertDescription>
      </Alert>
      <div className="flex flex-wrap justify-center gap-3">
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
    <div className="container mx-auto flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-6">
      <Card className="w-full max-w-3xl!">
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
            aria-current={isActive ? "true" : undefined}
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
              className={cn(
                "mt-0.5 size-4 shrink-0",
                lesson.isCompleted ? "text-success" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{lesson.title}</span>
              {lesson.isCompleted && (
                <span className="mt-1 block text-xs text-success">
                  Đã hoàn thành
                </span>
              )}
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

export function LearningPlayerTopbar({
  learningCourse,
  isPanelOpen,
  onShowPanel,
}: {
  learningCourse: LearningCourse;
  isPanelOpen: boolean;
  onShowPanel: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6">
      <h1 className="min-w-0 truncate text-sm font-semibold">
        {learningCourse.course.title}
      </h1>
      <div className="flex shrink-0 items-center gap-2">
        {!isPanelOpen && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Hiện danh sách bài học và trợ lý AI"
            onClick={onShowPanel}
          >
            <PanelRightOpen data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">Bảng học tập</span>
          </Button>
        )}
        <span className="hidden text-sm text-muted-foreground md:inline">
          {learningCourse.course.learningOrder === "sequential"
            ? "Học tuần tự"
            : "Học tự do"}
        </span>
        <Link
          href={`/courses/${learningCourse.course.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <X aria-hidden="true" />
          Thoát
        </Link>
      </div>
    </header>
  );
}

export function LearningSidebar({
  activeLessonId,
  lessonPanelOpen,
  learningCourse,
  onSelectLesson,
  onToggleLessonPanel,
}: {
  activeLessonId: string | null;
  lessonPanelOpen: boolean;
  learningCourse: LearningCourse;
  onSelectLesson: (lesson: LearningLessonSummary) => void;
  onToggleLessonPanel: () => void;
}) {
  const progressLabel = formatProgress(learningCourse.enrollment.progress);
  const progressValue = getProgressValue(learningCourse.enrollment.progress);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="shrink-0">
          {learningCourse.course.learningOrder === "sequential"
            ? "Học tuần tự"
            : "Học tự do"}
        </Badge>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {progressLabel}
          </span>
          <button
            type="button"
            onClick={onToggleLessonPanel}
            aria-pressed={lessonPanelOpen}
            aria-label={
              lessonPanelOpen ? "Ẩn bảng học tập" : "Hiện bảng học tập"
            }
            title={lessonPanelOpen ? "Ẩn bảng học tập" : "Hiện bảng học tập"}
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <PanelRightClose aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="truncate text-sm font-semibold">
          {learningCourse.course.title}
        </h2>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Tiến độ khóa học"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      <Tabs defaultValue="lessons" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid h-11 w-full shrink-0 grid-cols-2 rounded-xl bg-muted p-1">
          <TabsTrigger value="lessons" className="rounded-lg">
            <BookOpen data-icon="inline-start" aria-hidden="true" />
            Bài học
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-lg">
            <MessageCircle data-icon="inline-start" aria-hidden="true" />
            Trợ lý AI
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="lessons"
          keepMounted
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-1"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">Nội dung khóa học</h3>
              <span className="text-xs text-muted-foreground">
                {learningCourse.lessons.length} bài học
              </span>
            </div>
            <LessonTree
              lessons={learningCourse.lessons}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
          </div>
        </TabsContent>
        <TabsContent
          value="chat"
          keepMounted
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden pt-1"
        >
          <AiChatCard courseId={learningCourse.course.id} />
        </TabsContent>
      </Tabs>
    </div>
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
      className="aspect-video w-full bg-black"
      src={lesson.videoUrl}
      onLoadedMetadata={onLoadedMetadata}
      onPause={onPause}
      onRateChange={onRateChange}
      onTimeUpdate={onTimeUpdate}
      onVolumeChange={onVolumeChange}
    />
  );
}

function LessonSummaryPanel({
  courseId,
  enabled,
  lessonId,
}: {
  courseId: string;
  enabled: boolean;
  lessonId: string;
}) {
  const summaryQuery = useLearningLessonSummary(courseId, lessonId, enabled);

  if (!enabled || summaryQuery.isLoading) {
    return (
      <div
        className="flex flex-col gap-3"
        aria-label="Đang tải tóm tắt bài giảng"
      >
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (summaryQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Không tải được tóm tắt</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col items-start gap-3">
            <p>{mapLearningError(summaryQuery.error)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void summaryQuery.refetch()}
            >
              Thử lại
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const summary = summaryQuery.data;
  if (
    !summary ||
    summary.status === "pending" ||
    summary.status === "processing"
  ) {
    return (
      <Alert>
        <BookOpen aria-hidden="true" />
        <AlertTitle>Đang tạo tóm tắt bài giảng</AlertTitle>
        <AlertDescription>
          Nội dung tóm tắt đang được AI xử lý, vui lòng quay lại sau. Nội dung
          sẽ tự động cập nhật tại đây.
        </AlertDescription>
      </Alert>
    );
  }

  if (summary.status === "failed") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Chưa thể tạo tóm tắt</AlertTitle>
        <AlertDescription>
          Tóm tắt bài giảng tạm thời chưa khả dụng. Bạn vẫn có thể tiếp tục xem
          video và quay lại sau.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <SummaryDocument
      content={summary.summaryText || "Tóm tắt bài giảng chưa có nội dung."}
    />
  );
}

export function LessonContentCard({
  courseId,
  isSavingWatchProgress,
  isQuizLoading,
  isQuizError,
  quizError,
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
  courseId: string;
  isSavingWatchProgress: boolean;
  isQuizLoading: boolean;
  isQuizError: boolean;
  quizError: unknown;
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
  const [activeTab, setActiveTab] = useState("content");

  return (
    <main className="flex flex-col gap-6">
      {isLoading ? (
        <>
          <LearningVideoSkeleton />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-3/4 sm:h-8 sm:w-2/3" />
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-4/5 max-w-2xl" />
          </div>
          <Skeleton className="h-11 w-full max-w-xl rounded-xl bg-muted/80" />
          <div className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-xl bg-primary/15" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Không tải được bài học</AlertTitle>
          <AlertDescription>{mapLearningError(lessonError)}</AlertDescription>
        </Alert>
      ) : lesson ? (
        <>
          <div className="flex flex-col">
            <LessonVideo
              lesson={lesson}
              videoRef={videoRef}
              onLoadedMetadata={onLoadedMetadata}
              onPause={onPause}
              onRateChange={onRateChange}
              onTimeUpdate={onTimeUpdate}
              onVolumeChange={onVolumeChange}
            />
            <div className="flex flex-col gap-1 pt-3">
              <h1 className="text-xl font-bold sm:text-2xl">{lesson.title}</h1>
              <p className="text-sm text-muted-foreground">
                {lesson.description || "Không có mô tả bài học."}
              </p>
            </div>
          </div>
          <LessonCompletionButton
            key={lesson.id}
            courseId={courseId}
            lesson={lesson}
            isSavingWatchProgress={isSavingWatchProgress}
          />
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted p-1">
              <TabsTrigger value="content" className="rounded-lg">
                Nội dung bài học
              </TabsTrigger>
              <TabsTrigger value="summary" className="rounded-lg">
                Tóm tắt bài giảng
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="flex flex-col gap-6 pt-4">
              <MaterialPanel materialUrl={lesson.materialUrl} />
              {hasQuiz && (
                <section className="flex flex-col gap-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <FileQuestion className="size-5" aria-hidden="true" />
                    Bài kiểm tra
                  </h2>
                  <LearnerQuizPanel courseId={courseId} lessonId={lesson.id} />
                </section>
              )}
              {isQuizError && !hasQuiz && (
                <section className="flex flex-col gap-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <FileQuestion className="size-5" aria-hidden="true" />
                    Bài kiểm tra
                  </h2>
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>Không tải được bài kiểm tra</AlertTitle>
                    <AlertDescription>
                      {mapLearningError(quizError)}
                    </AlertDescription>
                  </Alert>
                </section>
              )}
              {!hasQuiz && !isQuizLoading && !isQuizError && (
                <section className="flex flex-col gap-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <FileQuestion className="size-5" aria-hidden="true" />
                    Bài kiểm tra
                  </h2>
                  <Empty className="min-h-48 flex-none gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileQuestion aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>Chưa có bài kiểm tra</EmptyTitle>
                      <EmptyDescription>
                        Bài học này hiện chưa có nội dung kiểm tra.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </section>
              )}
            </TabsContent>
            <TabsContent value="summary" className="pt-4">
              <LessonSummaryPanel
                courseId={courseId}
                enabled={activeTab === "summary"}
                lessonId={lesson.id}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chọn một bài học có thể truy cập để bắt đầu.
        </p>
      )}
    </main>
  );
}
