import { z } from "zod";

export const LESSON_VIDEO_ACCEPT = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

export const LESSON_MATERIAL_ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
};

export const LESSON_VIDEO_MAX_SIZE_BYTES = 200 * 1024 * 1024;
export const LESSON_MATERIAL_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export const lessonFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề bài học không được để trống")
    .max(200, "Tiêu đề bài học tối đa 200 ký tự"),
  description: z
    .string()
    .trim()
    .max(5000, "Mô tả tối đa 5000 ký tự")
    .optional()
    .or(z.literal("")),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;
