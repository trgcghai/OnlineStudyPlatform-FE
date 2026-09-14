import { z } from "zod";

export const PAYMENT_CONFIG_CURRENCIES = ["VND"] as const;
export const MINIMUM_WITHDRAWAL_AMOUNT_MIN = 1_000_000;
export const MINIMUM_WITHDRAWAL_AMOUNT_STEP = 100_000;

export const PAYMENT_CONFIG_FIELD_LABELS = {
  platformFeePercent: "Phí nền tảng",
  currency: "Tiền tệ",
  allowedPrices: "Danh sách giá",
  freeCourseLimit: "Giới hạn khóa học miễn phí",
  minimumWithdrawalAmount: "Rút tiền tối thiểu",
  earningHoldDays: "Số ngày giữ thu nhập",
  updatedById: "Người cập nhật",
} as const;

export function sortPrices(prices: number[]): number[] {
  return [...prices].sort((a, b) => a - b);
}

export function formatVndAmount(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const paymentConfigSchema = z
  .object({
    platformFeePercent: z
      .number("Phí nền tảng là bắt buộc")
      .min(0, "Phí nền tảng không được nhỏ hơn 0%")
      .max(100, "Phí nền tảng không được lớn hơn 100%"),
    currency: z.enum(PAYMENT_CONFIG_CURRENCIES),
    allowedPrices: z
      .array(
        z
          .number("Giá khóa học là bắt buộc")
          .int("Giá khóa học phải là số nguyên")
          .min(0, "Giá khóa học không được âm"),
      )
      .nonempty("Danh sách giá không được trống"),
    freeCourseLimit: z
      .number()
      .int("Giới hạn khóa học miễn phí phải là số nguyên")
      .min(0, "Giới hạn khóa học miễn phí không được âm")
      .nullable(),
    minimumWithdrawalAmount: z
      .number("Số tiền rút tối thiểu là bắt buộc")
      .int("Số tiền rút tối thiểu phải là số nguyên")
      .min(
        MINIMUM_WITHDRAWAL_AMOUNT_MIN,
        "Số tiền rút tối thiểu phải từ 1.000.000 VND",
      )
      .refine(
        (amount) => amount % MINIMUM_WITHDRAWAL_AMOUNT_STEP === 0,
        "Số tiền rút tối thiểu phải tăng theo bội số 100.000 VND",
      ),
    earningHoldDays: z
      .number("Số ngày giữ thu nhập là bắt buộc")
      .int("Số ngày giữ thu nhập phải là số nguyên")
      .min(0, "Số ngày giữ thu nhập không được âm"),
  })
  .superRefine((value, ctx) => {
    if (!value.allowedPrices.includes(0)) {
      ctx.addIssue({
        code: "custom",
        path: ["allowedPrices"],
        message: "Danh sách giá phải bao gồm 0 VND cho khóa học miễn phí",
      });
    }

    if (new Set(value.allowedPrices).size !== value.allowedPrices.length) {
      ctx.addIssue({
        code: "custom",
        path: ["allowedPrices"],
        message: "Danh sách giá không được trùng lặp",
      });
    }
  });

export type PaymentConfigFormValues = z.infer<typeof paymentConfigSchema>;
