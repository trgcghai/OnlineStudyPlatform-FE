import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { USER_ROLES } from "@/services/api/users";

const LEARNER_ROLES = [USER_ROLES.LEARNER] as const;

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={LEARNER_ROLES}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <span className="text-sm font-medium text-foreground">
            Người học
          </span>
          <LogoutButton />
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
