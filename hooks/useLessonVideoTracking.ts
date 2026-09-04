"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectVideoPlayback,
  setPlaybackRate,
  setVolume,
} from "@/lib/features/videoPlaybackSlice";
import type { AppDispatch } from "@/lib/store";
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
  const dispatch = useDispatch<AppDispatch>();
  const videoPlayback = useSelector(selectVideoPlayback);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const openedLessonIdsRef = useRef(new Set<string>());
  const completedLessonIdsRef = useRef(new Set<string>());
  const lastHeartbeatBucketRef = useRef<string | null>(null);

  useEffect(() => {
    lastHeartbeatBucketRef.current = null;
  }, [activeLessonId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = videoPlayback.playbackRate;
    video.volume = videoPlayback.volume;
  }, [activeLessonId, videoPlayback.playbackRate, videoPlayback.volume]);

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

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = videoPlayback.playbackRate;
      video.volume = videoPlayback.volume;
    }

    sendWatchEvent("opened");
  }

  function handleRateChange() {
    const video = videoRef.current;
    if (!video) return;

    dispatch(setPlaybackRate(video.playbackRate));
  }

  function handleVolumeChange() {
    const video = videoRef.current;
    if (!video) return;

    dispatch(setVolume(video.volume));
  }

  function handleVideoPause() {
    sendWatchEvent("paused");
  }

  function handleVideoTimeUpdate() {
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
    handleRateChange,
    handleVolumeChange,
  };
}
