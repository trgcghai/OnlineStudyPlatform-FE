import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { USER_ROLES } from "@/services/api/users";

const ADMIN_ROLES = [USER_ROLES.ADMIN] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={ADMIN_ROLES}>
      <SidebarProvider className="min-h-full bg-muted/30">
        <AppSidebar />
        <SidebarInset className="bg-muted/30">
          <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Admin console
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">
                    Quản trị hệ thống học tập
                  </span>
                </div>
              </div>
              <LogoutButton />
            </div>
          </header>
          <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
