"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminCourseContentTable } from "@/components/admin/courses/admin-course-content-table";
import { Button } from "@/components/ui/button";
import { useAdminCourseLessons } from "@/hooks/useAdminCourseApprovals";

export default function AdminCourseContentPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { data, isError, isPending, refetch } = useAdminCourseLessons(courseId);

  const items = data?.items ?? [];

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit">
        <Link
          href="/admin/courses/approvals"
          className="flex items-center gap-2"
        >
          <ArrowLeft /> Quay lại danh sách chờ duyệt
        </Link>
      </Button>

      {data && (
        <div>
          <h1 className="text-2xl font-bold">{data.courseTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Xem danh sách bài học và bài kiểm tra trước khi duyệt hoặc từ chối
            khóa học.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <AdminCourseContentTable
          items={items}
          isError={isError}
          isPending={isPending}
          onRefetch={() => refetch()}
        />
      </div>
    </div>
  );
}
