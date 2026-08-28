import { z } from "zod";
import type { CourseStatus, LearningOrder } from "@/services/api/courses";

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

export const LEARNING_ORDERS_VALUE = ["Sequential", "Free"] as const;

export type LearningOrderValue = (typeof LEARNING_ORDERS_VALUE)[number];

export const LEARNING_ORDER_LABELS: Record<LearningOrder, string> = {
  Sequential: "Học tuần tự",
  Free: "Học tự do",
};

export const LEARNING_ORDER_DESCRIPTIONS: Record<LearningOrder, string> = {
  Sequential: "Học viên phải hoàn thành bài học trước để mở bài tiếp theo.",
  Free: "Học viên có thể truy cập mọi bài học bất kể tiến độ.",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  Draft: "Bản nháp",
  Pending: "Chờ duyệt",
  Published: "Đã xuất bản",
  Rejected: "Bị từ chối",
};

export const COURSE_STATUS_BADGE_VARIANTS: Record<CourseStatus, string> = {
  Draft: "secondary",
  Pending: "secondary",
  Published: "default",
  Rejected: "destructive",
}

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
  category: z.enum(COURSE_CATEGORIES),
  learningOrder: z.enum(LEARNING_ORDERS_VALUE),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const COURSE_LIST_PAGE_SIZE = 10;
