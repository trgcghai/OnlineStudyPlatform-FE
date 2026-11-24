"use client";

import { usePathname } from "next/navigation";
import { MobileBackButton } from "@/components/layout/mobile-back-button";

type MobileRouteScope = "public" | "learner" | "admin" | "instructor";

const STATIC_TITLES: Record<string, string> = {
  "/courses": "Khóa học",
  "/learner/cart": "Giỏ hàng",
  "/learner/certificates": "Chứng chỉ",
  "/learner/checkout": "Xác nhận đơn hàng",
  "/learner/courses": "Khóa học của tôi",
  "/learner/notifications": "Thông báo",
  "/learner/payments": "Thanh toán",
  "/profile": "Hồ sơ của tôi",
  "/admin/courses/approvals": "Duyệt khóa học",
  "/admin/notifications": "Thông báo",
  "/admin/payment-config": "Cấu hình thanh toán",
  "/admin/payments": "Thanh toán",
  "/admin/risk-model": "Risk Model",
  "/admin/users": "Người dùng",
  "/admin/withdrawals": "Yêu cầu rút tiền",
  "/instructor/account": "Tài khoản",
  "/instructor/analytics": "Learning Analytics",
  "/instructor/balance": "Số dư",
  "/instructor/courses": "Khóa học",
  "/instructor/essay-grading": "Chấm tự luận",
  "/instructor/notifications": "Thông báo",
  "/instructor/profile": "Hồ sơ",
  "/instructor/risk": "Learning Risk",
  "/instructor/withdrawals": "Rút tiền",
};

function getRouteTitle(pathname: string, scope: MobileRouteScope) {
  if (STATIC_TITLES[pathname]) return STATIC_TITLES[pathname];
  if (scope === "public" && pathname.startsWith("/courses/")) {
    return "Chi tiết khóa học";
  }
  if (
    scope === "learner" &&
    pathname.startsWith("/learner/payment/checkout/")
  ) {
    return "Thanh toán";
  }
  if (scope === "admin" && pathname.startsWith("/admin/courses/approvals/")) {
    return "Nội dung khóa học";
  }
  if (scope === "admin" && pathname.startsWith("/admin/payments/")) {
    return "Chi tiết thanh toán";
  }
  if (scope === "instructor" && pathname.startsWith("/instructor/courses/")) {
    return "Chi tiết khóa học";
  }
  if (scope === "instructor" && pathname.startsWith("/instructor/risk/")) {
    return "Chi tiết Learning Risk";
  }
  return "Trang hiện tại";
}

function getFallbackHref(scope: MobileRouteScope) {
  if (scope === "learner") return "/learner/dashboard";
  if (scope === "admin") return "/admin";
  if (scope === "instructor") return "/instructor";
  return "/";
}

function isRootRoute(pathname: string, scope: MobileRouteScope) {
  if (scope === "public") return pathname === "/" || pathname === "/courses";
  if (scope === "learner") return pathname === "/learner/dashboard";
  if (scope === "admin") return pathname === "/admin";
  return pathname === "/instructor";
}

const INLINE_BACK_PREFIXES = [
  "/courses/",
  "/admin/courses/approvals/",
  "/admin/payments/provider-events/",
  "/admin/payments/transactions/",
  "/instructor/courses/",
  "/instructor/risk/",
  "/learner/payment/checkout/",
];

function hasInlineBackControl(pathname: string) {
  return (
    pathname === "/learner/checkout" ||
    INLINE_BACK_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function MobileRouteHeader({ scope }: { scope: MobileRouteScope }) {
  const pathname = usePathname();

  if (isRootRoute(pathname, scope) || hasInlineBackControl(pathname)) {
    return null;
  }

  return (
    <div className="border-b bg-muted/30 px-4 py-2.5 md:hidden">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center gap-2">
        <MobileBackButton fallbackHref={getFallbackHref(scope)} />
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">
            Đang xem
          </p>
          <h1 className="truncate text-sm font-semibold text-foreground">
            {getRouteTitle(pathname, scope)}
          </h1>
        </div>
      </div>
    </div>
  );
}
