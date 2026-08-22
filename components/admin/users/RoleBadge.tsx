import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/schemas/admin-user";
import { UserRole } from "@/services/api/users";

export default function RoleBadge({ role }: { role: UserRole }) {
  if (role === "Instructor") {
    return <Badge variant="secondary">{ROLE_LABELS.Instructor}</Badge>;
  }

  if (role === "Learner") {
    return <Badge variant="outline">{ROLE_LABELS.Learner}</Badge>;
  }

  return <Badge>{role}</Badge>;
}
