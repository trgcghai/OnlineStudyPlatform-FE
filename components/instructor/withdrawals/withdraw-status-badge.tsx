import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WithdrawRequestStatus } from "@/services/api/payment";

const STATUS_LABELS: Record<WithdrawRequestStatus, string> = {
  pending: "Đang chờ",
  processed: "Đã xử lý",
  cancelled: "Đã hủy",
  rejected: "Bị từ chối",
};

const STATUS_CLASSES: Record<WithdrawRequestStatus, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  processed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  cancelled:
    "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
};

export function WithdrawStatusBadge({
  status,
  className,
}: {
  status: WithdrawRequestStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
