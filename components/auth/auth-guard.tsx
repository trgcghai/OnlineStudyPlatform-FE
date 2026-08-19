"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/lib/features/authSlice";
import type { UserRole } from "@/services/api/users";
import {
  canAccessRole,
  getRoleHomePath,
  getSignInRedirectPath,
  isAuthenticatedSession,
} from "@/utils/authUtil";

interface AuthGuardProps {
  allowedRoles: readonly UserRole[];
  children: React.ReactNode;
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const auth = useSelector(selectAuth);
  const router = useRouter();
  const isSession = isAuthenticatedSession(auth);
  const hasAllowedRole = canAccessRole(auth, allowedRoles);

  useEffect(() => {
    if (!isSession) {
      router.replace(getSignInRedirectPath());
      return;
    }

    if (!hasAllowedRole && auth.user) {
      router.replace(getRoleHomePath(auth.user.role));
    }
  }, [auth.user, hasAllowedRole, isSession, router]);

  if (!isSession || !hasAllowedRole) {
    return null;
  }

  return <>{children}</>;
}
