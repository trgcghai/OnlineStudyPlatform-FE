import { z } from "zod";
import { QuizQuestionType } from "@/services/api/quizzes";

export const QUIZ_QUESTION_TYPES = [
  QuizQuestionType.MCQ,
  QuizQuestionType.ESSAY,
] as const;

export const QUIZ_QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
  MCQ: "Trắc nghiệm",
  ESSAY: "Tự luận",
};

export const QUIZ_TIME_LIMIT_MIN = 1;
export const QUIZ_TIME_LIMIT_MAX = 600;
export const QUIZ_PASS_SCORE_MIN = 1;
export const QUIZ_PASS_SCORE_MAX = 100;
export const QUIZ_OPTION_COUNT_MIN = 2;
export const QUIZ_OPTION_COUNT_MAX = 10;
export const QUIZ_POINTS_MIN = 1;
export const QUIZ_POINTS_MAX = 1000;

const timeLimitMessage = `Phải là số phút trong khoảng ${QUIZ_TIME_LIMIT_MIN}-${QUIZ_TIME_LIMIT_MAX}`;

export const quizFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề bài kiểm tra không được để trống")
    .max(200, "Tiêu đề bài kiểm tra tối đa 200 ký tự"),
  description: z
    .string()
    .trim()
    .max(5000, "Mô tả tối đa 5000 ký tự")
    .optional()
    .or(z.literal("")),
  timeLimitMinutes: z.string().refine(
    (value) => {
      if (value === "") return true;
      const parsed = Number(value);
      return (
        !Number.isNaN(parsed) &&
        Number.isInteger(parsed) &&
        parsed >= QUIZ_TIME_LIMIT_MIN &&
        parsed <= QUIZ_TIME_LIMIT_MAX
      );
    },
    { message: timeLimitMessage },
  ),
  passScore: z
    .number()
    .int()
    .min(QUIZ_PASS_SCORE_MIN, `Điểm đạt tối thiểu ${QUIZ_PASS_SCORE_MIN}%`)
    .max(QUIZ_PASS_SCORE_MAX, `Điểm đạt tối đa ${QUIZ_PASS_SCORE_MAX}%`),
});

export type QuizFormValues = z.infer<typeof quizFormSchema>;

export const questionFormSchema = z
  .object({
    type: z.enum(QUIZ_QUESTION_TYPES),
    content: z
      .string()
      .trim()
      .min(1, "Nội dung câu hỏi không được để trống")
      .max(5000, "Nội dung câu hỏi tối đa 5000 ký tự"),
    points: z
      .number()
      .int()
      .min(QUIZ_POINTS_MIN, "Điểm phải lớn hơn hoặc bằng 1")
      .max(QUIZ_POINTS_MAX, `Điểm tối đa ${QUIZ_POINTS_MAX}`),
    options: z.array(z.string().trim()),
    correctAnswers: z.array(z.number().int().min(0)),
  })
  .superRefine((value, ctx) => {
    if (value.type === QuizQuestionType.MCQ) {
      if (value.options.length < QUIZ_OPTION_COUNT_MIN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: `Câu trắc nghiệm cần ít nhất ${QUIZ_OPTION_COUNT_MIN} phương án`,
        });
      }
      if (value.options.length > QUIZ_OPTION_COUNT_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: `Tối đa ${QUIZ_OPTION_COUNT_MAX} phương án`,
        });
      }
      if (value.options.some((option) => option.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Nội dung phương án không được để trống",
        });
      }
      if (value.correctAnswers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctAnswers"],
          message: "Chọn ít nhất một đáp án đúng",
        });
      }
      const outOfRange = value.correctAnswers.some(
        (index) => index < 0 || index >= value.options.length,
      );
      if (outOfRange) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctAnswers"],
          message: "Đáp án đúng không hợp lệ",
        });
      }
    }
  });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;
