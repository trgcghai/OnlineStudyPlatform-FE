"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Atm01FreeIcons,
  BookEditIcon,
  CircleUserRound,
  CreditCardIcon,
  DashboardSquare01Icon,
  ChartBarLineIcon,
  Money01Icon,
  Notification01Icon,
  Presentation,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const adminNavItems = [
  {
    title: "Tổng quan",
    href: "/instructor",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Thông báo",
    href: "/instructor/notifications",
    icon: Notification01Icon,
  },
  {
    title: "Khóa học",
    href: "/instructor/courses",
    icon: Presentation,
  },
  {
    title: "Learning Risk",
    href: "/instructor/risk",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Learning Analytics",
    href: "/instructor/analytics",
    icon: ChartBarLineIcon,
  },
  {
    title: "Chấm tự luận",
    href: "/instructor/essay-grading",
    icon: BookEditIcon,
  },
  {
    title: "Hồ sơ",
    href: "/instructor/profile",
    icon: CircleUserRound,
  },
  {
    title: "Tài khoản",
    href: "/instructor/account",
    icon: CreditCardIcon,
  },
  {
    title: "Số dư",
    href: "/instructor/balance",
    icon: Money01Icon,
  },
  {
    title: "Rút tiền",
    href: "/instructor/withdrawals",
    icon: Atm01FreeIcons,
  },
];

export function InstructorSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Online Study"
              render={<Link href="/instructor" />}
            >
              <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon icon={Presentation} strokeWidth={2} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate font-semibold">Giảng viên</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Bảng điều khiển quản trị
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const isActive =
                  item.href === "/instructor"
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
