import { AuthGuard } from "@/components/auth/auth-guard";
import { LearnerNavigation } from "@/components/layout/learner-navigation";
import { MobileRouteHeader } from "@/components/layout/mobile-route-header";
import { PublicHeader } from "@/components/layout/public-header";
import { USER_ROLES } from "@/services/api/users";

const LEARNER_ROLES = [USER_ROLES.LEARNER] as const;

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={LEARNER_ROLES}>
      <div className="flex min-h-dvh flex-col bg-background">
        <PublicHeader />
        <MobileRouteHeader scope="learner" />
        <div className="border-b bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
            <LearnerNavigation />
          </div>
        </div>
        <main className="container mx-auto flex min-w-0 max-w-7xl flex-1 justify-center px-4 py-5 sm:p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
