import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import StatCard from "@/components/admin/users/StatCard";
import type { UserProfile } from "@/services/api/users";

export function AdminUsersStats({
  items,
  totalUsers,
}: {
  items: UserProfile[];
  totalUsers: number;
}) {
  const activeUsersOnPage = items.filter(
    (user) => user.status === "Active",
  ).length;
  const instructorsOnPage = items.filter(
    (user) => user.role === "Instructor",
  ).length;
  const learnersOnPage = items.filter((user) => user.role === "Learner").length;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Tổng tài khoản"
        value={totalUsers}
        description="Theo bộ lọc hiện tại"
        icon={UsersRound}
      />
      <StatCard
        title="Đang hoạt động"
        value={activeUsersOnPage}
        description="Trên trang hiện tại"
        icon={UserCheck}
      />
      <StatCard
        title="Giảng viên"
        value={instructorsOnPage}
        description="Trên trang hiện tại"
        icon={ShieldCheck}
      />
      <StatCard
        title="Học viên"
        value={learnersOnPage}
        description="Trên trang hiện tại"
        icon={GraduationCap}
      />
    </section>
  );
}
