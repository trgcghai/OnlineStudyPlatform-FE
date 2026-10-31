"use client";

import dynamic from "next/dynamic";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { BookOpen, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  mapLearningError,
  useCourseChatSession,
  useSendCourseChatMessage,
} from "@/hooks/useLearning";
import { cn } from "@/lib/utils";
import type { AiChatMessage } from "@/services/api/learning";

interface AiChatCardProps {
  courseId: string;
}

const AiChatMarkdown = dynamic(() =>
  import("./ai-chat-markdown").then((module) => module.AiChatMarkdown),
);

function ChatBubble({ message }: { message: AiChatMessage }) {
  const isAssistant = message.role === "assistant";
  const citedLessons = Array.from(
    new Map(
      message.citations.map((citation) => [
        citation.lessonId ?? citation.lessonTitle,
        citation.lessonTitle,
      ]),
    ),
  );

  return (
    <div
      className={cn(
        "flex items-end gap-2.5",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6",
          isAssistant
            ? "rounded-bl-md bg-muted/70 text-card-foreground"
            : "rounded-br-md bg-primary text-primary-foreground",
        )}
      >
        {isAssistant ? (
          <AiChatMarkdown content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        {isAssistant && message.citations.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2.5">
            <Separator />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BookOpen className="size-3.5" aria-hidden="true" />
              Nguồn trong khóa học
            </div>
            <div className="flex flex-wrap gap-1.5">
              {citedLessons.map(([sourceKey, lessonTitle]) => (
                <Badge
                  key={sourceKey}
                  variant="outline"
                  className="max-w-full bg-background/70 text-left font-normal"
                  title={lessonTitle}
                >
                  <span className="truncate">{lessonTitle}</span>
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChatHistorySkeleton() {
  return (
    <div className="flex flex-col gap-5 p-1" aria-label="Đang tải hội thoại">
      <div className="flex items-end gap-2.5">
        <Skeleton className="h-20 w-4/5 rounded-2xl" />
      </div>
      <div className="flex items-end justify-end gap-2.5">
        <Skeleton className="h-14 w-3/5 rounded-2xl" />
      </div>
      <div className="flex items-end gap-2.5">
        <Skeleton className="h-28 w-5/6 rounded-2xl" />
      </div>
    </div>
  );
}

export function AiChatCard({ courseId }: AiChatCardProps) {
  const [question, setQuestion] = useState("");
  const chatQuery = useCourseChatSession(courseId);
  const sendMutation = useSendCourseChatMessage(courseId);
  const messages = chatQuery.data?.messages ?? [];
  const isAiUnavailable =
    chatQuery.data?.isAiAvailable === false ||
    sendMutation.data?.isAiAvailable === false;
  const canSubmit = question.trim().length > 0 && !sendMutation.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || sendMutation.isPending) return;

    sendMutation.mutate(trimmedQuestion, {
      onSuccess: () => setQuestion(""),
    });
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    if (canSubmit) {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section
      id="course-ai-chat"
      role="region"
      aria-label="Trợ lý AI khóa học"
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {isAiUnavailable ? (
          <p role="status" className="text-xs text-muted-foreground">
            AI đang tạm thời gián đoạn.
          </p>
        ) : null}

        {chatQuery.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Không tải được lịch sử chat: {mapLearningError(chatQuery.error)}
          </p>
        ) : null}

        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="min-h-0 flex-1 overflow-y-auto py-2"
        >
          {chatQuery.isLoading ? (
            <ChatHistorySkeleton />
          ) : messages.length > 0 ? (
            <div className="flex flex-col gap-5">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>
          ) : null}
        </div>

        {sendMutation.isError ? (
          <p role="alert" className="px-1 text-sm text-destructive">
            {mapLearningError(sendMutation.error)}
          </p>
        ) : null}

        <form className="flex flex-col gap-2 pt-1" onSubmit={handleSubmit}>
          <label htmlFor="course-ai-chat-question" className="sr-only">
            Câu hỏi dành cho trợ lý AI khóa học
          </label>
          <Textarea
            id="course-ai-chat-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
            placeholder="Viết câu hỏi của bạn..."
            className="min-h-20 resize-none rounded-xl bg-background"
            maxLength={1000}
            disabled={sendMutation.isPending}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Enter để gửi · Shift + Enter xuống dòng
            </span>
            <Button
              type="submit"
              className="rounded-xl px-4"
              disabled={!canSubmit}
            >
              <Send data-icon="inline-start" aria-hidden="true" />
              {sendMutation.isPending ? "Đang gửi" : "Gửi"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
