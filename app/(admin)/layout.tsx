import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { USER_ROLES } from "@/services/api/users";

const ADMIN_ROLES = [USER_ROLES.ADMIN] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={ADMIN_ROLES}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <span className="text-sm font-medium text-foreground">
            Quản trị viên
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
