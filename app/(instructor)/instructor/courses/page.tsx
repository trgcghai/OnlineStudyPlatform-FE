import { EmptyState } from "@/components/empty-state";
import { LibraryBig } from "lucide-react";

export default function InstructorCoursesPage() {
  return (
    <EmptyState
      title="Quản lý khóa học"
      description="Giảng viên sẽ quản lý khóa học và bài giảng tại đây."
      icon={<LibraryBig className="size-5" aria-hidden="true" />}
    />
  );
}
