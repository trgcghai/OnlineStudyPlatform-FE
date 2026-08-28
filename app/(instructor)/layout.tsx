import { AuthGuard } from "@/components/auth/auth-guard";
import { USER_ROLES } from "@/services/api/users";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { InstructorSidebar } from "@/components/instructor-sidebar";
import { InstructorTopbar } from "@/components/layout/instructor-topbar";

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
          <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
