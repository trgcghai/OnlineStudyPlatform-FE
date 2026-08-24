import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/instructor/courses/course-form";

export default function NewCoursePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
      >
        <Link href="/instructor/courses" className="flex items-center gap-2">
          <ArrowLeft /> Quay lại danh sách
        </Link>
      </Button>
      <CourseForm mode="create" />
    </div>
  );
}
