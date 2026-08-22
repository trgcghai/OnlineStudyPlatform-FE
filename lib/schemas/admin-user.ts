import { z } from "zod";

import { USER_ROLES, USER_STATUSES } from "@/services/api/users";

export const ASSIGNABLE_ROLES = [
  USER_ROLES.INSTRUCTOR,
  USER_ROLES.LEARNER,
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ADMIN_USER_STATUSES = [
  USER_STATUSES.ACTIVE,
  USER_STATUSES.INACTIVE,
] as const;

export type AdminManageableStatus = (typeof ADMIN_USER_STATUSES)[number];

export const PASSWORD_POLICY_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const nameSchema = z
  .string()
  .trim()
  .min(2, "Họ và tên phải có ít nhất 2 ký tự")
  .max(100, "Họ và tên tối đa 100 ký tự");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Email không hợp lệ"));

const roleSchema = z.enum(ASSIGNABLE_ROLES);

const requiredPasswordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .regex(/[A-Za-z]/, "Mật khẩu phải chứa ít nhất một chữ cái")
  .regex(/\d/, "Mật khẩu phải chứa ít nhất một chữ số")
  .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất một ký tự đặc biệt");

const optionalPasswordSchema = z
  .string()
  .refine(
    (value) => value.length === 0 || PASSWORD_POLICY_REGEX.test(value),
    "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ, số và ký tự đặc biệt",
  );

export const createAdminUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: requiredPasswordSchema,
  role: roleSchema,
});

export const editAdminUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: optionalPasswordSchema,
  role: roleSchema,
});

export type CreateAdminUserFormValues = z.infer<typeof createAdminUserSchema>;
export type EditAdminUserFormValues = z.infer<typeof editAdminUserSchema>;

export const ROLE_LABELS: Record<AssignableRole, string> = {
  Instructor: "Giảng viên",
  Learner: "Học viên",
};

export const STATUS_LABELS: Record<AdminManageableStatus, string> = {
  Active: "Hoạt động",
  Inactive: "Đã vô hiệu hóa",
};
