import { AuthGuard } from "@/components/auth/auth-guard";
import { USER_ROLES } from "@/services/api/users";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { InstructorTopbar } from "@/components/layout/instructor-topbar";
import { MobileRouteHeader } from "@/components/layout/mobile-route-header";

const INSTRUCTOR_ROLES = [USER_ROLES.INSTRUCTOR] as const;

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={INSTRUCTOR_ROLES}>
      <SidebarProvider className="min-h-full bg-muted/30">
        <InstructorSidebar />
        <SidebarInset className="bg-muted/30">
          <InstructorTopbar />
          <MobileRouteHeader scope="instructor" />
          <div className="min-w-0 flex-1 bg-background p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
