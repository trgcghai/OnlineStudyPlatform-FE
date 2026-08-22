import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/schemas/admin-user";
import { UserStatus } from "@/services/api/users";

export default function StatusBadge({ status }: { status: UserStatus }) {
  return status === "Active" ? (
    <Badge variant="secondary">{STATUS_LABELS.Active}</Badge>
  ) : (
    <Badge variant="destructive">{STATUS_LABELS.Inactive}</Badge>
  );
}
