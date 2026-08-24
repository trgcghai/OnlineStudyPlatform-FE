"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { CourseThumbnailField } from "@/components/instructor/courses/course-thumbnail-field";
import {
  useCreateInstructorCourse,
  useUpdateInstructorCourse,
} from "@/hooks/useInstructorCourses";
import {
  COURSE_CATEGORIES,
  COURSE_CATEGORY_LABELS,
  courseFormSchema,
  type CourseFormValues,
} from "@/lib/schemas/course";
import type { Course } from "@/services/api/courses";

interface CourseFormProps {
  mode: "create" | "edit";
  course?: Course;
}

export function CourseForm({ mode, course }: CourseFormProps) {
  const router = useRouter();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { createInstructorCourse, isPending: isCreating } =
    useCreateInstructorCourse();
  const { updateInstructorCourse, isPending: isUpdating } =
    useUpdateInstructorCourse();
  const isPending = isCreating || isUpdating;

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: course?.title ?? "",
      description: course?.description ?? "",
      category:
        (course?.category as CourseFormValues["category"] | undefined) ??
        "Programming",
    },
  });

  async function onSubmit(values: CourseFormValues) {
    setFormError(null);

    const result =
      mode === "create"
        ? await createInstructorCourse(values, thumbnail)
        : await updateInstructorCourse(course?.id ?? "", values, thumbnail);

    if (!result.ok) {
      setFormError(result.message ?? "Không thể lưu khóa học.");
      return;
    }

    router.push("/instructor/courses");
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Tạo khóa học" : "Chỉnh sửa khóa học"}
        </CardTitle>
        <CardDescription>
          Nhập thông tin cơ bản cho khóa học. Khóa học mới sẽ ở trạng thái bản
          nháp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-6 lg:grid-cols-[1fr_22rem]"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup>
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Không thể lưu khóa học</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="course-title" required>
                Tên khóa học
              </FieldLabel>
              <InputGroup>
                <InputGroupInput id="course-title" {...register("title")} />
              </InputGroup>
              <FieldError errors={[errors.title]} />
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="course-description" required>
                Mô tả
              </FieldLabel>
              <Textarea
                id="course-description"
                rows={8}
                {...register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <Field data-invalid={!!errors.category}>
              <FieldLabel htmlFor="course-category" required>
                Danh mục
              </FieldLabel>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={COURSE_CATEGORY_LABELS}
                  >
                    <SelectTrigger className="w-full" aria-label="Danh mục">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {COURSE_CATEGORY_LABELS[category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.category]} />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={isPending}>
                <Link href="/instructor/courses">Hủy</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner /> Đang lưu...
                  </>
                ) : mode === "create" ? (
                  "Tạo khóa học"
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </div>
          </FieldGroup>

          <CourseThumbnailField
            value={thumbnail}
            onChange={setThumbnail}
            currentUrl={course?.thumbnail}
            disabled={isPending}
          />
        </form>
      </CardContent>
    </Card>
  );
}
