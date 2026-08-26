import { PublicCourseCard } from "@/components/courses/public-course-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicCourse } from "@/services/api/public-courses";

interface PublicCourseSectionProps {
  title: string;
  description: string;
  courses?: PublicCourse[];
  isLoading?: boolean;
}

export function PublicCourseSection({
  title,
  description,
  courses = [],
  isLoading = false,
}: PublicCourseSectionProps) {
  if (!isLoading && courses.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-72 rounded-2xl" />
            ))
          : courses.map((course) => (
              <PublicCourseCard key={course.id} course={course} />
            ))}
      </div>
    </section>
  );
}
