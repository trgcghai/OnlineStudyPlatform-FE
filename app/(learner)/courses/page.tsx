import { EmptyState } from "@/components/empty-state";
import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  return (
    <EmptyState
      title="Khóa học"
      description="Danh sách khóa học sẽ được hiển thị tại đây."
      icon={<BookOpen className="size-5" aria-hidden="true" />}
    />
  );
}
