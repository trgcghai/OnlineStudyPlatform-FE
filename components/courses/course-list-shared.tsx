import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_STATUS_BADGE_VARIANTS,
  COURSE_STATUS_LABELS,
} from "@/lib/schemas/course";
import type { CourseStatus } from "@/services/api/courses";

interface CourseThumbnailSource {
  thumbnail: string | null;
  title: string;
}

export function getCourseCategoryLabel(category: string): string {
  return (
    COURSE_CATEGORY_LABELS[category as keyof typeof COURSE_CATEGORY_LABELS] ??
    category
  );
}

export function CourseThumbnail({ course }: { course: CourseThumbnailSource }) {
  return (
    <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-xl bg-muted">
      {course.thumbnail ? (
        <Image
          src={course.thumbnail}
          unoptimized
          alt={course.title}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <ImageIcon
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <Badge
      variant={
        COURSE_STATUS_BADGE_VARIANTS[status] as keyof typeof badgeVariants
      }
    >
      {COURSE_STATUS_LABELS[status]}
    </Badge>
  );
}
