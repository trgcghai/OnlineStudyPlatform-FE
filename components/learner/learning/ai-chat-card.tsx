"use client";

import dynamic from "next/dynamic";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, MessageCircle, Send, UserRound, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
        "flex gap-3",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {isAssistant && (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" aria-hidden="true" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
          isAssistant
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isAssistant ? (
          <AiChatMarkdown content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        {isAssistant && message.citations.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nguồn tham khảo
              </p>
              <div className="flex flex-wrap gap-2">
                {citedLessons.map(([sourceKey, lessonTitle]) => (
                  <Badge
                    key={sourceKey}
                    variant="outline"
                    className="max-w-full"
                    title={lessonTitle}
                  >
                    <span className="truncate">{lessonTitle}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {!isAssistant && (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <UserRound className="size-4" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function AiChatCard({ courseId }: AiChatCardProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="pointer-events-none fixed inset-0 z-50">
      {isOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Đóng chatbot AI"
          className="pointer-events-auto absolute inset-0 bg-background/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {isOpen && (
          <Card
            id="course-ai-chat"
            role="region"
            aria-label="Trợ lý AI khóa học"
            className="max-h-[calc(100dvh-7rem)] w-[min(26rem,calc(100vw-2rem))] overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl"
          >
            <CardHeader className="space-y-3 border-b bg-background/80 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="size-5 text-primary" aria-hidden="true" />
                    Trợ lý AI khóa học
                  </CardTitle>
                  <Badge
                    variant={isAiUnavailable ? "destructive" : "secondary"}
                  >
                    {isAiUnavailable ? "AI tạm ngưng" : "RAG theo khóa học"}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Thu nhỏ chatbot"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Hỏi về bài học, tài liệu và nội dung trong khóa học.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {isAiUnavailable && (
                <Alert variant="destructive">
                  <AlertTitle>AI chưa khả dụng</AlertTitle>
                  <AlertDescription>
                    Dịch vụ AI đang tạm thời gián đoạn. Bạn vẫn có thể xem lại
                    lịch sử chat và thử gửi lại sau.
                  </AlertDescription>
                </Alert>
              )}

              {chatQuery.isError && (
                <Alert variant="destructive">
                  <AlertTitle>Không tải được lịch sử chat</AlertTitle>
                  <AlertDescription>
                    {mapLearningError(chatQuery.error)}
                  </AlertDescription>
                </Alert>
              )}

              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className="max-h-[45dvh] space-y-4 overflow-y-auto rounded-2xl border bg-background/70 p-4"
              >
                {chatQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Đang tải lịch sử trò chuyện...
                  </p>
                ) : messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                    Chưa có câu hỏi nào. Hãy hỏi về bài học hiện tại hoặc tài
                    liệu trong khóa học.
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                  ))
                )}
              </div>

              {sendMutation.isError && (
                <p className="text-sm text-destructive">
                  {mapLearningError(sendMutation.error)}
                </p>
              )}

              <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <label htmlFor="course-ai-chat-question" className="sr-only">
                  Câu hỏi dành cho trợ lý AI khóa học
                </label>
                <Textarea
                  id="course-ai-chat-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleQuestionKeyDown}
                  placeholder="Ví dụ: Bài này giải thích dependency injection như thế nào?"
                  className="min-h-20 flex-1 resize-none"
                  maxLength={1000}
                  disabled={sendMutation.isPending}
                />
                <Button
                  type="submit"
                  className="self-end"
                  disabled={!canSubmit}
                >
                  <Send className="size-4" aria-hidden="true" />
                  {sendMutation.isPending ? "Đang gửi" : "Gửi"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Button
          type="button"
          size="lg"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="course-ai-chat"
          aria-label={isOpen ? "Thu nhỏ chatbot AI" : "Mở chatbot AI"}
          className="h-14 rounded-full px-5 shadow-2xl shadow-primary/25"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
