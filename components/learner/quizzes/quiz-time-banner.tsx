import { cn } from "@/lib/utils";
import { formatDuration } from "@/utils/quizUtil";
import { Clock3 } from "lucide-react";

interface QuizTimerBannerProps {
  isOverdue: boolean;
  remainingSeconds: number | null;
}

export default function QuizTimerBanner({
  isOverdue,
  remainingSeconds,
}: QuizTimerBannerProps) {
  if (!remainingSeconds) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border p-3 text-sm",
        isOverdue
          ? "border-amber-500/50 text-amber-700"
          : "text-muted-foreground",
      )}
    >
      <Clock3 aria-hidden="true" className="size-4" />
      {isOverdue ? (
        <span>
          Đã quá thời gian {formatDuration(Math.abs(remainingSeconds))}.
        </span>
      ) : (
        <span>Còn lại {formatDuration(remainingSeconds)}.</span>
      )}
    </div>
  );
}
