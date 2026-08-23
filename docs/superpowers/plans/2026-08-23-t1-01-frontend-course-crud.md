# T1-01 Frontend Course CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Instructor-facing course list, create, edit, thumbnail upload, and delete UI for `T1-01`.

**Architecture:** Add a `courses` API module and React Query hooks, then build separate App Router pages for list/create/edit under the existing Instructor route group. Reuse established admin-user table/dialog patterns and profile avatar upload/dropzone patterns while keeping status transitions, lessons, quizzes, and enrollments out of scope.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, React Query, React Hook Form, Zod, Tailwind CSS v4, shared axios client, pnpm.

**Source Spec:** `docs/superpowers/specs/2026-08-23-t1-01-frontend-course-crud-design.md`

**Commit Policy:** Do not commit during execution unless the user explicitly asks.

---

## File Structure

Create these files:

| File | Responsibility |
|---|---|
| `services/api/courses.ts` | Course types and API calls through `services/axios.ts` |
| `hooks/useInstructorCourses.ts` | React Query hooks, mutations, invalidation, error mapping |
| `lib/schemas/course.ts` | Zod schemas, course categories, status/category labels |
| `components/instructor/courses/course-thumbnail-field.tsx` | Thumbnail dropzone, preview, validation messages |
| `components/instructor/courses/course-form.tsx` | Shared create/edit form with chained thumbnail upload |
| `components/instructor/courses/delete-course-dialog.tsx` | Confirm delete dialog and conflict handling |
| `app/(instructor)/instructor/courses/new/page.tsx` | Create course page |
| `app/(instructor)/instructor/courses/[id]/edit/page.tsx` | Edit course page |

Modify these files:

| File | Change |
|---|---|
| `app/(instructor)/instructor/courses/page.tsx` | Replace placeholder with list page |
| `app/(instructor)/layout.tsx` | Remove vertical centering so list/form pages can use full width |

---

## Related Skills By Task

| Task | Required Related Skills |
|---|---|
| Task 1 | `test-driven-development`, `nextjs`, `vercel-react-best-practices` |
| Task 2 | `test-driven-development`, `nextjs`, `vercel-react-best-practices` |
| Task 3 | `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices` |
| Task 4 | `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices` |
| Task 5 | `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices` |
| Task 6 | `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices` |
| Task 7 | `nextjs`, `frontend-design`, `verification-before-completion` |

If skill loading fails during execution, read the corresponding skill file directly before continuing.

Before implementation, read relevant Next.js 16 local docs from `node_modules/next/dist/docs/` because `AGENTS.md` says this Next.js version has breaking changes.

---

### Task 1: Course API Client

**Related Skills:** `test-driven-development`, `nextjs`, `vercel-react-best-practices`

**Files:**
- Create: `services/api/courses.ts`

- [ ] **Step 1: Create course API module**

Create `services/api/courses.ts`:

```ts
import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export const COURSE_STATUSES = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PUBLISHED: "Published",
} as const;

export type CourseStatus =
  (typeof COURSE_STATUSES)[keyof typeof COURSE_STATUSES];

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  status: CourseStatus;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListFilters {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  status?: CourseStatus;
  sortBy?: "createdAt" | "updatedAt" | "title" | "category" | "status";
  sortOrder?: "ASC" | "DESC";
}

export interface CourseListResult {
  items: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
}

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

function buildCourseListQuery(filters: CourseListFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.q && filters.q.trim().length > 0) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const query = params.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function listMyCourses(
  filters: CourseListFilters = {},
): Promise<CourseListResult> {
  const { data } = await axiosClient.get<ApiSuccessResponse<CourseListResult>>(
    `/courses/me${buildCourseListQuery(filters)}`,
  );

  return data.data;
}

export async function getCourse(courseId: string): Promise<Course> {
  const { data } = await axiosClient.get<ApiSuccessResponse<Course>>(
    `/courses/${courseId}`,
  );

  return data.data;
}

export async function createCourse(
  payload: CreateCoursePayload,
): Promise<Course> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Course>>(
    "/courses",
    payload,
  );

  return data.data;
}

export async function updateCourse(
  courseId: string,
  payload: UpdateCoursePayload,
): Promise<Course> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<Course>>(
    `/courses/${courseId}`,
    payload,
  );

  return data.data;
}

export async function uploadCourseThumbnail(
  courseId: string,
  file: File,
): Promise<Course> {
  const formData = new FormData();
  formData.append("thumbnail", file);

  const { data } = await axiosClient.post<ApiSuccessResponse<Course>>(
    `/courses/${courseId}/thumbnail`,
    formData,
  );

  return data.data;
}

export async function deleteCourse(courseId: string): Promise<void> {
  await axiosClient.delete(`/courses/${courseId}`);
}
```

- [ ] **Step 2: Verify static typing through build later**

There is no test framework. This task is verified by Task 7 using `pnpm build` and `pnpm lint`.

---

### Task 2: Course Schema And React Query Hooks

**Related Skills:** `test-driven-development`, `nextjs`, `vercel-react-best-practices`

**Files:**
- Create: `lib/schemas/course.ts`
- Create: `hooks/useInstructorCourses.ts`

- [ ] **Step 1: Create schema and labels**

Create `lib/schemas/course.ts`:

```ts
import { z } from "zod";
import { COURSE_STATUSES, type CourseStatus } from "@/services/api/courses";

export const COURSE_CATEGORIES = [
  "Programming",
  "Data",
  "Design",
  "Business",
  "Language",
  "Other",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  Programming: "Lập trình",
  Data: "Dữ liệu",
  Design: "Thiết kế",
  Business: "Kinh doanh",
  Language: "Ngoại ngữ",
  Other: "Khác",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  Draft: "Bản nháp",
  Pending: "Chờ duyệt",
  Published: "Đã xuất bản",
};

export const COURSE_THUMBNAIL_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

export const COURSE_THUMBNAIL_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const courseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Tên khóa học phải có ít nhất 2 ký tự")
    .max(150, "Tên khóa học tối đa 150 ký tự"),
  description: z
    .string()
    .trim()
    .min(1, "Mô tả không được để trống")
    .max(5000, "Mô tả tối đa 5000 ký tự"),
  category: z.enum(COURSE_CATEGORIES, "Vui lòng chọn danh mục"),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const COURSE_LIST_PAGE_SIZE = 10;
```

- [ ] **Step 2: Create hooks with error mapping**

Create `hooks/useInstructorCourses.ts`:

```ts
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { isApiErrorResponse } from "@/services/axios";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listMyCourses,
  updateCourse,
  uploadCourseThumbnail,
  type Course,
  type CourseListFilters,
} from "@/services/api/courses";
import type { CourseFormValues } from "@/lib/schemas/course";

export const instructorCourseKeys = {
  all: ["instructor-courses"] as const,
  list: (filters: CourseListFilters) =>
    [...instructorCourseKeys.all, "list", filters] as const,
  detail: (courseId: string) =>
    [...instructorCourseKeys.all, "detail", courseId] as const,
};

const NETWORK_ERROR_MESSAGE =
  "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
const GENERIC_ERROR_MESSAGE = "Đã xảy ra lỗi. Vui lòng thử lại sau.";

export interface CourseMutationResult<T = Course> {
  ok: boolean;
  data?: T;
  message?: string;
  thumbnailFailed?: boolean;
}

export function mapCourseError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 403) return "Bạn không có quyền quản lý khóa học này.";
  if (status === 404) return "Khóa học không tồn tại hoặc đã bị xóa.";
  if (status === 409) return "Không thể xóa khóa học đã có học viên đăng ký.";
  if (status === 400) return data.error.message || "Thông tin khóa học không hợp lệ.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

function useInvalidateCourses() {
  const queryClient = useQueryClient();

  return async (courseId?: string) => {
    await queryClient.invalidateQueries({ queryKey: instructorCourseKeys.all });
    if (courseId) {
      await queryClient.invalidateQueries({
        queryKey: instructorCourseKeys.detail(courseId),
      });
    }
  };
}

export function useInstructorCoursesList(filters: CourseListFilters) {
  return useQuery({
    queryKey: instructorCourseKeys.list(filters),
    queryFn: () => listMyCourses(filters),
  });
}

export function useInstructorCourse(courseId: string) {
  return useQuery({
    queryKey: instructorCourseKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: courseId.trim().length > 0,
  });
}

export function useCreateInstructorCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<
    CourseMutationResult,
    unknown,
    { values: CourseFormValues; thumbnail?: File | null }
  >({
    mutationFn: async ({ values, thumbnail }) => {
      const course = await createCourse(values);

      if (!thumbnail) {
        return { ok: true, data: course };
      }

      try {
        const courseWithThumbnail = await uploadCourseThumbnail(course.id, thumbnail);
        return { ok: true, data: courseWithThumbnail };
      } catch {
        return { ok: true, data: course, thumbnailFailed: true };
      }
    },
    onSuccess: async (result) => {
      await invalidate();
      toast.add({
        title: result.thumbnailFailed
          ? "Đã tạo khóa học nhưng chưa tải được ảnh."
          : "Đã tạo khóa học.",
        type: result.thumbnailFailed ? "warning" : "success",
      });
    },
  });

  async function createInstructorCourse(
    values: CourseFormValues,
    thumbnail?: File | null,
  ): Promise<CourseMutationResult> {
    try {
      return await mutation.mutateAsync({ values, thumbnail });
    } catch (error) {
      return { ok: false, message: mapCourseError(error) };
    }
  }

  return { createInstructorCourse, isPending: mutation.isPending };
}

export function useUpdateInstructorCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<
    Course,
    unknown,
    { courseId: string; values: CourseFormValues; thumbnail?: File | null }
  >({
    mutationFn: async ({ courseId, values, thumbnail }) => {
      const course = await updateCourse(courseId, values);

      if (thumbnail) {
        return uploadCourseThumbnail(course.id, thumbnail);
      }

      return course;
    },
    onSuccess: async (course) => {
      await invalidate(course.id);
      toast.add({ title: "Đã cập nhật khóa học.", type: "success" });
    },
  });

  async function updateInstructorCourse(
    courseId: string,
    values: CourseFormValues,
    thumbnail?: File | null,
  ): Promise<CourseMutationResult> {
    try {
      const course = await mutation.mutateAsync({ courseId, values, thumbnail });
      return { ok: true, data: course };
    } catch (error) {
      return { ok: false, message: mapCourseError(error) };
    }
  }

  return { updateInstructorCourse, isPending: mutation.isPending };
}

export function useDeleteInstructorCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<void, unknown, string>({
    mutationFn: (courseId) => deleteCourse(courseId),
    onSuccess: async () => {
      await invalidate();
      toast.add({ title: "Đã xóa khóa học.", type: "success" });
    },
  });

  async function deleteInstructorCourse(
    courseId: string,
  ): Promise<CourseMutationResult<void>> {
    try {
      await mutation.mutateAsync(courseId);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapCourseError(error) };
    }
  }

  return { deleteInstructorCourse, isPending: mutation.isPending };
}
```

- [ ] **Step 3: Keep thumbnail failure non-destructive**

Confirm the implemented create mutation returns `{ ok: true, data: course, thumbnailFailed: true }` when metadata creation succeeds but thumbnail upload fails. The course must remain created and the create page must still redirect to `/instructor/courses`.

---

### Task 3: Thumbnail Field Component

**Related Skills:** `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices`

**Files:**
- Create: `components/instructor/courses/course-thumbnail-field.tsx`

- [ ] **Step 1: Create thumbnail field**

Create `components/instructor/courses/course-thumbnail-field.tsx` using the profile avatar dropzone pattern:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  COURSE_THUMBNAIL_ACCEPT,
  COURSE_THUMBNAIL_MAX_SIZE_BYTES,
} from "@/lib/schemas/course";

interface CourseThumbnailFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  currentUrl?: string | null;
  disabled?: boolean;
}

function getThumbnailRejectionMessage(rejections: FileRejection[]): string {
  if (rejections.length > 1) return "Chỉ được chọn 1 ảnh khóa học.";

  const errors = rejections[0]?.errors ?? [];

  if (errors.some((error) => error.code === "file-too-large")) {
    return "Ảnh khóa học phải có dung lượng tối đa 5MB.";
  }

  if (errors.some((error) => error.code === "file-invalid-type")) {
    return "Ảnh khóa học phải là JPEG, PNG, WebP hoặc GIF.";
  }

  return "Không thể chọn ảnh này. Vui lòng thử ảnh khác.";
}

export function CourseThumbnailField({
  value,
  onChange,
  currentUrl,
  disabled,
}: CourseThumbnailFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: COURSE_THUMBNAIL_ACCEPT,
      disabled,
      maxFiles: 1,
      maxSize: COURSE_THUMBNAIL_MAX_SIZE_BYTES,
      multiple: false,
      onDropAccepted: (files) => onChange(files[0] ?? null),
      onDropRejected: (rejections) => {
        const message = getThumbnailRejectionMessage(rejections);
        toast.add({ title: message, type: "error" });
      },
    });

  const imageUrl = previewUrl ?? currentUrl ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps({
          className: cn(
            "group relative flex min-h-52 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/30 outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isDragActive && "border-primary bg-primary/5",
            isDragReject && "border-destructive bg-destructive/5",
            disabled && "cursor-not-allowed opacity-70",
          ),
        })}
      >
        <input {...getInputProps()} />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Ảnh khóa học"
            className="h-full min-h-52 w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <ImagePlus className="size-8" aria-hidden="true" />
            <span>Kéo thả ảnh hoặc bấm để chọn ảnh khóa học</span>
            <span>JPEG, PNG, WebP hoặc GIF · tối đa 5MB</span>
          </div>
        )}
        {value ? (
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute right-3 top-3 rounded-full"
            disabled={disabled}
            aria-label="Bỏ ảnh đã chọn"
            onClick={(event) => {
              event.stopPropagation();
              onChange(null);
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
```

---

### Task 4: Shared Course Form And Create/Edit Pages

**Related Skills:** `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices`

**Files:**
- Create: `components/instructor/courses/course-form.tsx`
- Create: `app/(instructor)/instructor/courses/new/page.tsx`
- Create: `app/(instructor)/instructor/courses/[id]/edit/page.tsx`

- [ ] **Step 1: Create shared form component**

Create `components/instructor/courses/course-form.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { CourseThumbnailField } from "@/components/instructor/courses/course-thumbnail-field";
import { useCreateInstructorCourse, useUpdateInstructorCourse } from "@/hooks/useInstructorCourses";
import { COURSE_CATEGORIES, COURSE_CATEGORY_LABELS, courseFormSchema, type CourseFormValues } from "@/lib/schemas/course";
import type { Course } from "@/services/api/courses";

interface CourseFormProps {
  mode: "create" | "edit";
  course?: Course;
}

export function CourseForm({ mode, course }: CourseFormProps) {
  const router = useRouter();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { createInstructorCourse, isPending: isCreating } = useCreateInstructorCourse();
  const { updateInstructorCourse, isPending: isUpdating } = useUpdateInstructorCourse();
  const isPending = isCreating || isUpdating;

  const { control, formState: { errors }, handleSubmit, register } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: course?.title ?? "",
      description: course?.description ?? "",
      category: (course?.category as CourseFormValues["category"] | undefined) ?? "Programming",
    },
  });

  async function onSubmit(values: CourseFormValues) {
    setFormError(null);

    const result = mode === "create"
      ? await createInstructorCourse(values, thumbnail)
      : await updateInstructorCourse(course?.id ?? "", values, thumbnail);

    if (!result.ok) {
      setFormError(result.message ?? "Không thể lưu khóa học.");
      return;
    }

    if (result.thumbnailFailed) {
      toast.add({
        title: "Đã lưu khóa học nhưng chưa tải được ảnh.",
        description: "Bạn có thể mở lại khóa học để tải ảnh sau.",
        type: "warning",
      });
    }

    router.push("/instructor/courses");
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Tạo khóa học" : "Chỉnh sửa khóa học"}</CardTitle>
        <CardDescription>
          Nhập thông tin cơ bản cho khóa học. Khóa học mới sẽ ở trạng thái bản nháp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6 lg:grid-cols-[1fr_22rem]" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Không thể lưu khóa học</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="course-title">Tên khóa học</FieldLabel>
              <InputGroup>
                <InputGroupInput id="course-title" {...register("title")} />
              </InputGroup>
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="course-description">Mô tả</FieldLabel>
              <Textarea id="course-description" rows={8} {...register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <Field data-invalid={!!errors.category}>
              <FieldLabel>Danh mục</FieldLabel>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} items={COURSE_CATEGORY_LABELS}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COURSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{COURSE_CATEGORY_LABELS[category]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.category]} />
            </Field>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild disabled={isPending}>
                <Link href="/instructor/courses">Hủy</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Spinner /> Đang lưu...</> : mode === "create" ? "Tạo khóa học" : "Lưu thay đổi"}
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
```

- [ ] **Step 2: Create new page**

Create `app/(instructor)/instructor/courses/new/page.tsx`:

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/instructor/courses/course-form";

export default function NewCoursePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/instructor/courses"><ArrowLeft /> Quay lại danh sách</Link>
      </Button>
      <CourseForm mode="create" />
    </div>
  );
}
```

- [ ] **Step 3: Create edit page**

Create `app/(instructor)/instructor/courses/[id]/edit/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseForm } from "@/components/instructor/courses/course-form";
import { useInstructorCourse, mapCourseError } from "@/hooks/useInstructorCourses";

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { data, error, isError, isPending, refetch } = useInstructorCourse(courseId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/instructor/courses"><ArrowLeft /> Quay lại danh sách</Link>
      </Button>
      {isPending ? <Skeleton className="h-[32rem] w-full" /> : null}
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải khóa học</AlertTitle>
          <AlertDescription>{mapCourseError(error)}</AlertDescription>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Thử lại</Button>
        </Alert>
      ) : null}
      {data ? <CourseForm mode="edit" course={data} /> : null}
    </div>
  );
}
```

---

### Task 5: Delete Dialog

**Related Skills:** `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices`

**Files:**
- Create: `components/instructor/courses/delete-course-dialog.tsx`

- [ ] **Step 1: Create delete confirmation dialog**

Create `components/instructor/courses/delete-course-dialog.tsx`:

```tsx
"use client";

import { LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { useDeleteInstructorCourse } from "@/hooks/useInstructorCourses";
import type { Course } from "@/services/api/courses";

interface DeleteCourseDialogProps {
  course: Course | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCourseDialog({ course, onOpenChange }: DeleteCourseDialogProps) {
  const { deleteInstructorCourse, isPending } = useDeleteInstructorCourse();

  async function handleConfirm() {
    if (!course) return;

    const result = await deleteInstructorCourse(course.id);

    if (result.ok) {
      onOpenChange(false);
      return;
    }

    toast.add({
      title: result.message ?? "Không thể xóa khóa học.",
      type: "error",
    });
  }

  return (
    <AlertDialog
      open={Boolean(course)}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa khóa học?</AlertDialogTitle>
          <AlertDialogDescription>
            Khóa học <span className="font-medium text-foreground">{course?.title}</span> sẽ bị xóa khỏi danh sách bản nháp của bạn. Thao tác này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isPending ? <><LoaderCircle className="animate-spin" /> Đang xóa...</> : "Xóa khóa học"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### Task 6: Instructor Course List Page And Layout

**Related Skills:** `test-driven-development`, `nextjs`, `frontend-design`, `vercel-react-best-practices`

**Files:**
- Modify: `app/(instructor)/instructor/courses/page.tsx`
- Modify: `app/(instructor)/layout.tsx`

- [ ] **Step 1: Update Instructor layout to allow full pages**

Modify `app/(instructor)/layout.tsx` so the `main` element is:

```tsx
<main className="flex flex-1 p-6">{children}</main>
```

- [ ] **Step 2: Replace list placeholder**

Replace `app/(instructor)/instructor/courses/page.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, ImageIcon, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteCourseDialog } from "@/components/instructor/courses/delete-course-dialog";
import { useInstructorCoursesList } from "@/hooks/useInstructorCourses";
import { COURSE_CATEGORIES, COURSE_CATEGORY_LABELS, COURSE_LIST_PAGE_SIZE, COURSE_STATUS_LABELS } from "@/lib/schemas/course";
import { COURSE_STATUSES, type Course, type CourseListFilters, type CourseStatus } from "@/services/api/courses";
import { formatDate } from "@/utils/dateTimeUtil";

type CategoryFilter = "" | (typeof COURSE_CATEGORIES)[number];
type StatusFilter = "" | CourseStatus;

const ALL_OPTION = "";
const STATUS_FILTER_ITEMS: Record<StatusFilter, string> = {
  [ALL_OPTION]: "Tất cả trạng thái",
  Draft: COURSE_STATUS_LABELS.Draft,
  Pending: COURSE_STATUS_LABELS.Pending,
  Published: COURSE_STATUS_LABELS.Published,
};

export default function InstructorCoursesPage() {
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(ALL_OPTION);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_OPTION);
  const [page, setPage] = useState(1);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const filters = useMemo<CourseListFilters>(() => ({
    page,
    limit: COURSE_LIST_PAGE_SIZE,
    q: appliedSearch || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    sortBy: "createdAt",
    sortOrder: "DESC",
  }), [appliedSearch, categoryFilter, page, statusFilter]);

  const { data, isError, isPending, refetch } = useInstructorCoursesList(filters);
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function applySearch() {
    setPage(1);
    setAppliedSearch(searchDraft.trim());
  }

  function handleFilterChange(apply: () => void) {
    apply();
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Quản lý khóa học</CardTitle>
            <CardDescription>Tạo, chỉnh sửa và quản lý các khóa học bản nháp của bạn.</CardDescription>
          </div>
          <Button asChild><Link href="/instructor/courses/new"><Plus /> Tạo khóa học</Link></Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
            <form className="xl:min-w-80 xl:flex-1" onSubmit={(event) => { event.preventDefault(); applySearch(); }}>
              <InputGroup>
                <InputGroupInput placeholder="Tìm theo tên hoặc mô tả..." value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} />
                <Button type="submit" variant="ghost" size="icon-xs" aria-label="Tìm kiếm"><Search /></Button>
              </InputGroup>
            </form>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={categoryFilter} onValueChange={(value) => handleFilterChange(() => setCategoryFilter(value as CategoryFilter))} items={{ [ALL_OPTION]: "Tất cả danh mục", ...COURSE_CATEGORY_LABELS }}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>Tất cả danh mục</SelectItem>
                  {COURSE_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{COURSE_CATEGORY_LABELS[category]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange(() => setStatusFilter(value as StatusFilter))} items={STATUS_FILTER_ITEMS}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>Tất cả trạng thái</SelectItem>
                  {Object.values(COURSE_STATUSES).map((status) => <SelectItem key={status} value={status}>{COURSE_STATUS_LABELS[status]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isError ? (
            <Alert variant="destructive">
              <AlertTitle>Không thể tải danh sách khóa học</AlertTitle>
              <AlertDescription>Vui lòng thử lại.</AlertDescription>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>Thử lại</Button>
            </Alert>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khóa học</TableHead><TableHead>Danh mục</TableHead><TableHead>Trạng thái</TableHead><TableHead>Cập nhật</TableHead><TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>) : null}
                    {!isPending && items.length === 0 ? <TableRow><TableCell colSpan={5}><div className="flex flex-col items-center gap-2 py-12 text-center"><BookOpen className="size-10 text-muted-foreground" /><p className="font-medium">Chưa có khóa học</p><p className="text-sm text-muted-foreground">Tạo khóa học đầu tiên để bắt đầu xây dựng nội dung.</p></div></TableCell></TableRow> : null}
                    {!isPending ? items.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell><div className="flex items-center gap-3"><div className="flex size-14 items-center justify-center overflow-hidden rounded-xl bg-muted bg-cover bg-center" style={course.thumbnail ? { backgroundImage: `url(${course.thumbnail})` } : undefined}>{course.thumbnail ? <span className="sr-only">Có ảnh khóa học</span> : <ImageIcon className="size-5 text-muted-foreground" />}</div><div><p className="font-medium">{course.title}</p><p className="line-clamp-1 text-sm text-muted-foreground">{course.description}</p></div></div></TableCell>
                        <TableCell>{COURSE_CATEGORY_LABELS[course.category as keyof typeof COURSE_CATEGORY_LABELS] ?? course.category}</TableCell>
                        <TableCell><Badge variant="secondary">{COURSE_STATUS_LABELS[course.status]}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(course.updatedAt)}</TableCell>
                        <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" asChild><Link href={`/instructor/courses/${course.id}/edit`} aria-label={`Chỉnh sửa ${course.title}`}><PencilLine /></Link></Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingCourse(course)} aria-label={`Xóa ${course.title}`}><Trash2 /></Button></div></TableCell>
                      </TableRow>
                    )) : null}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {!isError && !isPending && totalPages > 1 ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Trang {data?.page} / {totalPages} · {data?.total} khóa học</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trước</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Sau</Button></div></div> : null}
        </CardContent>
      </Card>
      <DeleteCourseDialog course={deletingCourse} onOpenChange={(open) => { if (!open) setDeletingCourse(null); }} />
    </div>
  );
}
```

- [ ] **Step 3: During implementation, split long JSX if build/lint readability requires it**

The replacement above is intentionally explicit. If line length or readability is poor, split small local render helpers inside the same page file; do not create extra components unless reused.

---

### Task 7: Final Verification And Manual Checklist

**Related Skills:** `nextjs`, `frontend-design`, `verification-before-completion`

**Files:**
- Verify all files from Tasks 1-6

- [ ] **Step 1: Run production build**

Run from `onlinestudyplatform-fe`:

```bash
pnpm build
```

Expected: Next.js build completes successfully with type checking.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: ESLint exits with code 0.

- [ ] **Step 3: Manual route checklist**

With backend running and an Instructor account logged in, verify:

| Scenario | Expected Result |
|---|---|
| Open `/instructor/courses` | List page loads and does not use the old empty-state placeholder |
| Click `Tạo khóa học` | Navigates to `/instructor/courses/new` |
| Create metadata only | Redirects to `/instructor/courses`; new Draft appears |
| Create metadata plus thumbnail | Redirects to list; thumbnail appears |
| Edit metadata | Changes persist after returning to list |
| Replace thumbnail | New thumbnail appears after save |
| Delete owned course | Confirm dialog appears; successful delete removes course from list |
| Backend `403` response | Vietnamese permission message appears |
| Backend `409` delete conflict | Vietnamese enrollment-conflict message appears |

- [ ] **Step 4: Final response evidence**

Report exact verification commands and results. Do not claim completion unless `pnpm build` has passed.
