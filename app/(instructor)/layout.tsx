import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { USER_ROLES } from "@/services/api/users";
import { CircleUserRound, Presentation } from "lucide-react";

const INSTRUCTOR_ROLES = [USER_ROLES.INSTRUCTOR] as const;

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={INSTRUCTOR_ROLES}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Presentation className="size-4 text-muted-foreground" aria-hidden="true" />
            Giảng viên
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/instructor/profile"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <CircleUserRound className="size-4" aria-hidden="true" />
              Hồ sơ
            </Link>
            <LogoutButton />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
