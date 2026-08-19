import type { AuthState } from "@/lib/features/authSlice";
import { USER_ROLES, type UserRole } from "@/services/api/users";

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "/admin/users";
    case USER_ROLES.INSTRUCTOR:
      return "/instructor/courses";
    case USER_ROLES.LEARNER:
      return "/courses";
    default:
      return "/courses";
  }
}

export function isAuthenticatedSession(auth: AuthState): boolean {
  return Boolean(
    auth.isAuthenticated &&
      typeof auth.accessToken === "string" &&
      auth.accessToken.trim().length > 0 &&
      auth.user &&
      Object.values(USER_ROLES).includes(auth.user.role),
  );
}

export function canAccessRole(
  auth: AuthState,
  allowedRoles: readonly UserRole[],
): boolean {
  if (!isAuthenticatedSession(auth) || !auth.user) {
    return false;
  }

  return allowedRoles.includes(auth.user.role);
}
