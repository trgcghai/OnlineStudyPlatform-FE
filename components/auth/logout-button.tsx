"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await logout();
    } finally {
      router.replace("/signin");
    }
  }

  return (
    <Button type="button" onClick={handleLogout} disabled={pending}>
      {pending ? "Đang đăng xuất..." : "Đăng xuất"}
    </Button>
  );
}
