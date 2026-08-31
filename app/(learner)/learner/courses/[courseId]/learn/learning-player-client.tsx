"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useLearnerQuiz } from "@/hooks/useLearnerQuizzes";
import {
  getLearningErrorStatus,
  mapLearningError,
  useLearningCourse,
  useLearningLesson,
  useSendLessonWatchEvent,
} from "@/hooks/useLearning";
import { cn } from "@/lib/utils";
import type {
  LearningCourse,
  LearningLessonSummary,
  WatchEventType,
} from "@/services/api/learning";
import { LearnerQuizPanel } from "./learner-quiz-panel";

interface LearningPlayerClientProps {
  courseId: string;
}

const activeLessonStorageKey = (courseId: string) =>
  `learning-player:${courseId}:activeLessonId`;

const videoPositionStorageKey = (courseId: string, lessonId: string) =>
  `learning-player:${courseId}:${lessonId}:position`;

const WATCH_EVENT_BUCKET_SECONDS = 15;
const COMPLETION_RATIO = 0.9;

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSafeVideoSeconds(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function getWatchEventBucket(
  eventType: WatchEventType,
  positionSeconds: number,
): string {
  if (eventType === "completed") return "complete";
  if (eventType === "opened") return "0";

  return String(
    Math.floor(positionSeconds / WATCH_EVENT_BUCKET_SECONDS) *
      WATCH_EVENT_BUCKET_SECONDS,
  );
}

function buildWatchEventKey({
  courseId,
  lessonId,
  sessionId,
  eventType,
  positionSeconds,
}: {
  courseId: string;
  lessonId: string;
  sessionId: string;
  eventType: WatchEventType;
  positionSeconds: number;
}): string {
  return `learning:${courseId}:${lessonId}:${sessionId}:${eventType}:${getWatchEventBucket(
    eventType,
    positionSeconds,
  )}`;
}

function safeReadLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function safeReadNumber(key: string): number | null {
  const value = safeReadLocalStorage(key);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeWriteNumber(key: string, value: number): void {
  if (!Number.isFinite(value)) return;
  safeWriteLocalStorage(key, String(Math.max(0, value)));
}

function findAccessibleLesson(
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

function formatProgress(progress: string): string {
  const value = Number(progress);
  if (!Number.isFinite(value)) return "0%";

  return `${Math.min(Math.max(value, 0), 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })}%`;
}

function getProgressValue(progress: string): number {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(value, 0), 100);
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
              {lesson.blockedReason ? (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {lesson.blockedReason}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
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

function MaterialPanel({ materialUrl }: { materialUrl: string | null }) {
  if (!materialUrl) {
    return (
      <Alert>
        <BookOpen aria-hidden="true" />
        <AlertTitle>Tài liệu đang được cập nhật</AlertTitle>
        <AlertDescription>
          Nội dung tài liệu của bài học chưa sẵn sàng.
        </AlertDescription>
      </Alert>
    );
  }

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

export function LearningPlayerClient({ courseId }: LearningPlayerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryLessonId = searchParams.get("lessonId");
  const courseQuery = useLearningCourse(courseId);
  const [preferredLessonId, setPreferredLessonId] = useState<string | null>(
    () => safeReadLocalStorage(activeLessonStorageKey(courseId)),
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const openedLessonIdsRef = useRef(new Set<string>());
  const completedLessonIdsRef = useRef(new Set<string>());
  const lastHeartbeatBucketRef = useRef<string | null>(null);

  const activeLesson = courseQuery.data
    ? (findAccessibleLesson(courseQuery.data, queryLessonId) ??
      findAccessibleLesson(courseQuery.data, preferredLessonId) ??
      findAccessibleLesson(courseQuery.data, null))
    : null;
  const activeLessonId = activeLesson?.id ?? null;
  const lessonQuery = useLearningLesson(courseId, activeLessonId);
  const quizAvailabilityQuery = useLearnerQuiz(courseId, activeLessonId);
  const watchEventMutation = useSendLessonWatchEvent(courseId, activeLessonId);
  const hasQuiz = Boolean(quizAvailabilityQuery.data?.quiz);

  useEffect(() => {
    if (
      courseQuery.isError &&
      getLearningErrorStatus(courseQuery.error) === 403
    ) {
      router.replace(`/courses/${courseId}`);
    }
  }, [courseId, courseQuery.error, courseQuery.isError, router]);

  useEffect(() => {
    if (!activeLessonId) return;

    safeWriteLocalStorage(activeLessonStorageKey(courseId), activeLessonId);
    if (queryLessonId === activeLessonId) return;

    router.replace(
      `/learner/courses/${courseId}/learn?lessonId=${activeLessonId}`,
      { scroll: false },
    );
  }, [activeLessonId, courseId, queryLessonId, router]);

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
      {
        scroll: false,
      },
    );
  }, [
    activeLessonId,
    courseId,
    courseQuery.data,
    lessonQuery.error,
    lessonQuery.isError,
    router,
  ]);

  const activeLessonForStorage = lessonQuery.data?.id ?? null;

  useEffect(() => {
    lastHeartbeatBucketRef.current = null;
  }, [activeLessonId]);

  useEffect(() => {
    function saveCurrentVideoPosition() {
      const video = videoRef.current;
      if (!activeLessonForStorage || !video) return;

      safeWriteNumber(
        videoPositionStorageKey(courseId, activeLessonForStorage),
        video.currentTime,
      );
    }

    window.addEventListener("offline", saveCurrentVideoPosition);
    window.addEventListener("beforeunload", saveCurrentVideoPosition);

    return () => {
      window.removeEventListener("offline", saveCurrentVideoPosition);
      window.removeEventListener("beforeunload", saveCurrentVideoPosition);
    };
  }, [activeLessonForStorage, courseId]);

  function sendWatchEvent(eventType: WatchEventType) {
    const lesson = lessonQuery.data;
    const video = videoRef.current;
    if (!lesson || !activeLessonId || !video || watchEventMutation.isPending) {
      return;
    }

    const positionSeconds = getSafeVideoSeconds(video.currentTime);
    const durationSeconds = getSafeVideoSeconds(
      Number.isFinite(video.duration) ? video.duration : lesson.duration,
    );
    const watchedSeconds = Math.min(positionSeconds, durationSeconds);

    if (eventType === "heartbeat") {
      const bucket = getWatchEventBucket(eventType, positionSeconds);
      if (bucket === lastHeartbeatBucketRef.current) return;
      lastHeartbeatBucketRef.current = bucket;
    }

    if (eventType === "opened") {
      if (openedLessonIdsRef.current.has(lesson.id)) return;
      openedLessonIdsRef.current.add(lesson.id);
    }

    if (eventType === "completed") {
      if (lesson.isCompleted || completedLessonIdsRef.current.has(lesson.id)) {
        return;
      }
      completedLessonIdsRef.current.add(lesson.id);
    }

    watchEventMutation.mutate(
      {
        idempotencyKey: buildWatchEventKey({
          courseId,
          lessonId: lesson.id,
          sessionId: sessionIdRef.current,
          eventType,
          positionSeconds,
        }),
        eventType,
        positionSeconds,
        watchedSeconds,
        durationSeconds,
        clientCreatedAt: new Date().toISOString(),
      },
      {
        onError: () => {
          if (eventType === "completed") {
            completedLessonIdsRef.current.delete(lesson.id);
          }
        },
      },
    );
  }

  function selectLesson(lesson: LearningLessonSummary) {
    if (!lesson.isAccessible) return;

    setPreferredLessonId(lesson.id);
    safeWriteLocalStorage(activeLessonStorageKey(courseId), lesson.id);
    router.replace(`/learner/courses/${courseId}/learn?lessonId=${lesson.id}`, {
      scroll: false,
    });
  }

  function saveVideoPosition() {
    const lessonId = lessonQuery.data?.id;
    const video = videoRef.current;
    if (!lessonId || !video) return;

    safeWriteNumber(
      videoPositionStorageKey(courseId, lessonId),
      video.currentTime,
    );
  }

  function restoreVideoPosition() {
    const lessonId = lessonQuery.data?.id;
    const video = videoRef.current;
    if (!lessonId || !video) return;

    const savedPosition = safeReadNumber(
      videoPositionStorageKey(courseId, lessonId),
    );
    if (!savedPosition || savedPosition <= 0) return;

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration > 0 && savedPosition < duration - 2) {
      video.currentTime = savedPosition;
    }
  }

  function handleLoadedMetadata() {
    restoreVideoPosition();
    sendWatchEvent("opened");
  }

  function handleVideoPause() {
    saveVideoPosition();
    sendWatchEvent("paused");
  }

  function handleVideoTimeUpdate() {
    saveVideoPosition();

    const lesson = lessonQuery.data;
    const video = videoRef.current;
    if (!lesson || !video) return;

    const duration = Number.isFinite(video.duration)
      ? video.duration
      : lesson.duration;
    if (duration <= 0) return;

    sendWatchEvent("heartbeat");

    if (video.currentTime / duration >= COMPLETION_RATIO) {
      sendWatchEvent("completed");
    }
  }

  if (courseQuery.isLoading) {
    return (
      <div className="container grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-[520px] rounded-3xl" />
      </div>
    );
  }

  if (courseQuery.isError) {
    return (
      <div className="container w-full max-w-3xl px-6">
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Không tải được nội dung học tập</AlertTitle>
          <AlertDescription>
            {mapLearningError(courseQuery.error)}
          </AlertDescription>
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

  if (!courseQuery.data) {
    return (
      <div className="container grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-[520px] rounded-3xl" />
      </div>
    );
  }

  const learningCourse = courseQuery.data;
  const progressLabel = formatProgress(learningCourse.enrollment.progress);
  const progressValue = getProgressValue(learningCourse.enrollment.progress);

  if (learningCourse.lessons.length === 0) {
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

  return (
    <div className="container grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              {learningCourse.course.learningOrder === "sequential"
                ? "Học tuần tự"
                : "Học tự do"}
            </Badge>
            <CardTitle>{learningCourse.course.title}</CardTitle>
            <CardDescription>
              {learningCourse.course.description}
            </CardDescription>
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
              onSelectLesson={selectLesson}
            />
          </CardContent>
        </Card>
      </aside>
      <main>
        <Card className="min-h-[520px]">
          {lessonQuery.isLoading ? (
            <CardContent className="flex flex-col gap-4 p-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </CardContent>
          ) : lessonQuery.isError ? (
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>Không tải được bài học</AlertTitle>
                <AlertDescription>
                  {mapLearningError(lessonQuery.error)}
                </AlertDescription>
              </Alert>
            </CardContent>
          ) : lessonQuery.data ? (
            <>
              <CardHeader>
                <CardTitle>{lessonQuery.data.title}</CardTitle>
                <CardDescription>
                  {lessonQuery.data.description || "Không có mô tả bài học."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {hasQuiz ? (
                  <Tabs defaultValue="lesson" className="gap-5">
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
                      {lessonQuery.data.videoUrl ? (
                        <video
                          key={lessonQuery.data.id}
                          ref={videoRef}
                          controls
                          className="aspect-video w-full rounded-2xl bg-black"
                          src={lessonQuery.data.videoUrl}
                          onLoadedMetadata={handleLoadedMetadata}
                          onPause={handleVideoPause}
                          onTimeUpdate={handleVideoTimeUpdate}
                        />
                      ) : (
                        <Alert>
                          <PlayCircle aria-hidden="true" />
                          <AlertTitle>Video đang được cập nhật</AlertTitle>
                          <AlertDescription>
                            Nội dung video của bài học chưa sẵn sàng.
                          </AlertDescription>
                        </Alert>
                      )}
                      <MaterialPanel
                        materialUrl={lessonQuery.data.materialUrl}
                      />
                    </TabsContent>
                    <TabsContent value="quiz">
                      <LearnerQuizPanel
                        courseId={courseId}
                        lessonId={lessonQuery.data.id}
                      />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <>
                    {lessonQuery.data.videoUrl ? (
                      <video
                        key={lessonQuery.data.id}
                        ref={videoRef}
                        controls
                        className="aspect-video w-full rounded-2xl bg-black"
                        src={lessonQuery.data.videoUrl}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPause={handleVideoPause}
                        onTimeUpdate={handleVideoTimeUpdate}
                      />
                    ) : (
                      <Alert>
                        <PlayCircle aria-hidden="true" />
                        <AlertTitle>Video đang được cập nhật</AlertTitle>
                        <AlertDescription>
                          Nội dung video của bài học chưa sẵn sàng.
                        </AlertDescription>
                      </Alert>
                    )}
                    <MaterialPanel materialUrl={lessonQuery.data.materialUrl} />
                  </>
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
    </div>
  );
}
