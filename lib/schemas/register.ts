import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Email không hợp lệ")),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Za-z]/, "Mật khẩu phải chứa ít nhất một chữ cái")
    .regex(/\d/, "Mật khẩu phải chứa ít nhất một chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất một ký tự đặc biệt"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
