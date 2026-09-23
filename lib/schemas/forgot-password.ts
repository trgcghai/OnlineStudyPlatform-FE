import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .regex(/[A-Za-z]/, "Mật khẩu phải chứa ít nhất một chữ cái")
  .regex(/\d/, "Mật khẩu phải chứa ít nhất một chữ số")
  .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất một ký tự đặc biệt");

export const forgotPasswordEmailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email không hợp lệ")),
});

export const forgotPasswordResetSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().nonempty("Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type ForgotPasswordEmailValues = z.infer<
  typeof forgotPasswordEmailSchema
>;
export type ForgotPasswordResetValues = z.infer<
  typeof forgotPasswordResetSchema
>;
