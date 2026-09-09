import { AuthGuard } from "@/components/auth/auth-guard";
import { USER_ROLES } from "@/services/api/users";

const LEARNER_ROLES = [USER_ROLES.LEARNER] as const;

export default function LearningPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={LEARNER_ROLES}>
      <div className="min-h-dvh bg-background">{children}</div>
    </AuthGuard>
  );
}
