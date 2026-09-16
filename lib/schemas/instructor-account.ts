import { z } from "zod";

const optionalAccountField = z
  .string()
  .max(120, "Không được vượt quá 120 ký tự")
  .transform((value) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  .nullable();

export const instructorAccountSchema = z.object({
  bankAccountNumber: z
    .string()
    .trim()
    .min(1, "Số tài khoản là bắt buộc")
    .max(120, "Số tài khoản không được vượt quá 120 ký tự"),
  accountHolderName: z
    .string()
    .trim()
    .min(1, "Tên chủ tài khoản là bắt buộc")
    .max(120, "Tên chủ tài khoản không được vượt quá 120 ký tự"),
  bankCode: z
    .string()
    .trim()
    .min(1, "Vui lòng chọn ngân hàng")
    .max(120, "Mã ngân hàng không được vượt quá 120 ký tự"),
  branchName: optionalAccountField,
  phoneNumber: optionalAccountField,
  note: z
    .string()
    .max(500, "Ghi chú không được vượt quá 500 ký tự")
    .transform((value) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .nullable(),
});

export type InstructorAccountFormValues = z.infer<
  typeof instructorAccountSchema
>;
