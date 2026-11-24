import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { MobileRouteHeader } from "@/components/layout/mobile-route-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
        <AdminSidebar />
        <SidebarInset className="bg-muted/30">
          <AdminTopbar />
          <MobileRouteHeader scope="admin" />
          <div className="min-w-0 flex-1 bg-background p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
