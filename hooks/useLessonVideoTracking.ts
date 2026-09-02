"use client";

import { useEffect, useRef } from "react";
import {
  videoPositionStorageKey,
  safeReadNumber,
  safeWriteNumber,
} from "@/lib/learning-player-storage";
import type { LearningLesson, WatchEventType } from "@/services/api/learning";

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

export function useLessonVideoTracking({
  activeLessonId,
  courseId,
  lesson,
  mutation,
}: {
  activeLessonId: string | null;
  courseId: string;
  lesson: LearningLesson | undefined;
  mutation: {
    isPending: boolean;
    mutate: (
      payload: {
        idempotencyKey: string;
        eventType: WatchEventType;
        positionSeconds: number;
        watchedSeconds: number;
        durationSeconds: number;
        clientCreatedAt: string;
      },
      options?: { onError?: () => void },
    ) => void;
  };
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const openedLessonIdsRef = useRef(new Set<string>());
  const completedLessonIdsRef = useRef(new Set<string>());
  const lastHeartbeatBucketRef = useRef<string | null>(null);
  const activeLessonForStorage = lesson?.id ?? null;

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
    const video = videoRef.current;
    if (!lesson || !activeLessonId || !video || mutation.isPending) return;

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

    mutation.mutate(
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

  function saveVideoPosition() {
    const lessonId = lesson?.id;
    const video = videoRef.current;
    if (!lessonId || !video) return;

    safeWriteNumber(
      videoPositionStorageKey(courseId, lessonId),
      video.currentTime,
    );
  }

  function restoreVideoPosition() {
    const lessonId = lesson?.id;
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
    if (!lesson) return;

    const video = videoRef.current;
    if (!video) return;

    const duration = Number.isFinite(video.duration)
      ? video.duration
      : lesson.duration;
    if (duration <= 0) return;

    sendWatchEvent("heartbeat");

    if (video.currentTime / duration >= COMPLETION_RATIO) {
      sendWatchEvent("completed");
    }
  }

  return {
    videoRef,
    handleLoadedMetadata,
    handleVideoPause,
    handleVideoTimeUpdate,
  };
}
