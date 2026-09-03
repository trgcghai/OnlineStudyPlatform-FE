import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PublicHeader } from "@/components/layout/public-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { USER_ROLES } from "@/services/api/users";
import { BookOpen, CircleUserRound } from "lucide-react";

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
        <div className="border-b bg-muted/30">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-6 py-3">
            <Link
              href="/learner/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <CircleUserRound data-icon="inline-start" aria-hidden="true" />
              Tổng quan
            </Link>
            <Link
              href="/learner/courses"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <BookOpen data-icon="inline-start" aria-hidden="true" />
              Khóa học của tôi
            </Link>
            <Link
              href="/profile"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <CircleUserRound data-icon="inline-start" aria-hidden="true" />
              Hồ sơ của tôi
            </Link>
          </div>
        </div>
        <main className="flex flex-1 justify-center p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
