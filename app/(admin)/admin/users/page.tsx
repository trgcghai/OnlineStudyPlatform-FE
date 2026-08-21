import { EmptyState } from "@/components/empty-state";
import { UsersRound } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <EmptyState
      title="Quản lý người dùng"
      description="Quản trị viên sẽ quản lý người dùng tại đây."
      icon={<UsersRound className="size-5" aria-hidden="true" />}
    />
  );
}
