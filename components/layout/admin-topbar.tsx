"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4 lg:px-8">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-3">
          <SidebarTrigger className="size-10 shrink-0 md:hidden" />
          <div className="hidden min-w-0 flex-col gap-1 sm:flex">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin console
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              Quản trị hệ thống học tập
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ModeToggle />
          <NotificationPopover mobileHref="/admin/notifications" />
          <LogoutButton mobileIconOnly className="size-10 sm:size-9" />
        </div>
      </div>
    </header>
  );
}
