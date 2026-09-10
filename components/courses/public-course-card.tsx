import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicCourse } from "@/services/api/public-courses";
import Image from "next/image";
import { formatCoursePrice } from "@/lib/schemas/course";

function excerpt(text: string, maxLength = 140): string {
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trim()}...`;
}

interface PublicCourseCardProps {
  course: PublicCourse;
}

export function PublicCourseCard({ course }: PublicCourseCardProps) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block h-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg pt-0!">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              width={800}
              height={450}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/15 via-muted to-secondary/20">
              <BookOpen className="size-10 text-primary" aria-hidden="true" />
            </div>
          )}
        </div>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="w-fit">
              {course.category}
            </Badge>
            <span
              className={
                course.price === 0 ? "" : "font-semibold text-foreground"
              }
            >
              {formatCoursePrice(course.price)}
            </span>
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-primary">
            {course.title}
          </CardTitle>
          <CardDescription className="line-clamp-3">
            {excerpt(course.description)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4" aria-hidden="true" />
            <span>{course.instructor?.name ?? "Giảng viên đang cập nhật"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
