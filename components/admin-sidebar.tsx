"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  BanknoteArrowDownIcon,
  BoltIcon,
  CreditCardIcon,
  DashboardSquare01Icon,
  GraduationCapIcon,
  Notification01Icon,
  UserMultipleIcon,
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
    href: "/admin",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Thông báo",
    href: "/admin/notifications",
    icon: Notification01Icon,
  },
  {
    title: "Người dùng",
    href: "/admin/users",
    icon: UserMultipleIcon,
  },
  {
    title: "Duyệt khóa học",
    href: "/admin/courses/approvals",
    icon: GraduationCapIcon,
  },
  {
    title: "Thanh toán",
    href: "/admin/payments",
    icon: CreditCardIcon,
  },
  {
    title: "Yêu cầu rút tiền",
    href: "/admin/withdrawals",
    icon: BanknoteArrowDownIcon,
  },
  {
    title: "Cấu hình thanh toán",
    href: "/admin/payment-config",
    icon: BoltIcon,
  },
  {
    title: "Risk Model",
    href: "/admin/risk-model",
    icon: BoltIcon,
  },
];

export function AdminSidebar({
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
              render={<Link href="/admin" />}
            >
              <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon icon={GraduationCapIcon} strokeWidth={2} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate font-semibold">Online Study</span>
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
                  item.href === "/admin"
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
