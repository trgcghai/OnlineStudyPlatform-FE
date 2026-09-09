"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  formatVndAmount,
  paymentConfigSchema,
  sortPrices,
  type PaymentConfigFormValues,
} from "@/lib/schemas/payment-config";
import { cn } from "@/lib/utils";
import { useUpdatePaymentConfig } from "@/hooks/useAdminPaymentConfig";
import type { PaymentConfig } from "@/services/api/payment-config";

interface PaymentConfigFormProps {
  config: PaymentConfig;
}

function toFormValues(config: PaymentConfig): PaymentConfigFormValues {
  return {
    platformFeePercent: config.platformFeePercent,
    currency: config.currency,
    allowedPrices: sortPrices(config.allowedPrices),
    freeCourseLimit: config.freeCourseLimit,
    minimumWithdrawalAmount: config.minimumWithdrawalAmount,
  };
}

export function PaymentConfigForm({ config }: PaymentConfigFormProps) {
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { updateConfig, isPending } = useUpdatePaymentConfig();

  const form = useForm<PaymentConfigFormValues>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: toFormValues(config),
  });

  const allowedPrices = useWatch({
    control: form.control,
    name: "allowedPrices",
  });

  function addPrice() {
    const trimmedValue = priceInput.trim();
    const parsedPrice = Number(trimmedValue);

    if (!trimmedValue || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setPriceError("Giá mới phải là số nguyên không âm.");
      return;
    }

    if (allowedPrices.includes(parsedPrice)) {
      setPriceError("Giá này đã có trong danh sách.");
      return;
    }

    form.setValue(
      "allowedPrices",
      sortPrices([...allowedPrices, parsedPrice]),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
    setPriceInput("");
    setPriceError(null);
  }

  function removePrice(price: number) {
    if (price === 0) return;

    form.setValue(
      "allowedPrices",
      allowedPrices.filter((item) => item !== price),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  async function onSubmit(values: PaymentConfigFormValues) {
    setFormError(null);

    const result = await updateConfig({
      ...values,
      allowedPrices: sortPrices(values.allowedPrices),
    });

    if (!result.ok) {
      setFormError(result.failure?.formError ?? "Không thể lưu cấu hình.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình thanh toán</CardTitle>
          <CardDescription>
            Thiết lập phí nền tảng, bậc giá khóa học và ngưỡng rút tiền cho hệ
            thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-5 md:grid-cols-2">
              <Controller
                control={form.control}
                name="platformFeePercent"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="platformFeePercent" required>
                      Phí nền tảng
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="platformFeePercent"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={Number.isNaN(field.value) ? "" : field.value}
                        aria-invalid={fieldState.invalid}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                      />
                      <InputGroupAddon align="inline-end">%</InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Tỷ lệ nền tảng thu trên mỗi giao dịch khóa học trả phí.
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="minimumWithdrawalAmount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="minimumWithdrawalAmount" required>
                      Rút tiền tối thiểu
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="minimumWithdrawalAmount"
                        type="number"
                        min={1}
                        step={1000}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        aria-invalid={fieldState.invalid}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                      />
                      <InputGroupAddon align="inline-end">VND</InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Số dư tối thiểu để giảng viên tạo yêu cầu rút tiền.
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Controller
                control={form.control}
                name="freeCourseLimit"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="freeCourseLimit">
                      Giới hạn khóa học miễn phí
                    </FieldLabel>
                    <Input
                      id="freeCourseLimit"
                      type="number"
                      min={0}
                      step={1}
                      value={field.value ? field.value : ""}
                      placeholder="Không giới hạn"
                      aria-invalid={fieldState.invalid}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === "" ? null : Number(value));
                      }}
                    />
                    <FieldDescription>
                      Để trống nếu không giới hạn số khóa học miễn phí mỗi giảng
                      viên.
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="currency"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="currency" required>
                      Tiền tệ
                    </FieldLabel>
                    <Input
                      id="currency"
                      value={field.value}
                      disabled
                      readOnly
                    />
                    <FieldDescription>
                      Hệ thống hiện chỉ hỗ trợ cấu hình thanh toán bằng VND.
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="allowedPrices"
              render={({ fieldState }) => (
                <Field data-invalid={fieldState.invalid || !!priceError}>
                  <FieldLabel required>Danh sách giá khóa học</FieldLabel>
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-muted/20 p-3">
                    {allowedPrices.map((price) => (
                      <span
                        key={price}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
                          price === 0
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-background",
                        )}
                      >
                        {formatVndAmount(price)}
                        {price === 0 ? (
                          <span className="text-xs text-primary/80">
                            Bắt buộc
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-muted-foreground transition hover:text-destructive"
                            onClick={() => removePrice(price)}
                          >
                            Xóa
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <InputGroup className="sm:max-w-xs">
                      <InputGroupInput
                        type="number"
                        min={0}
                        step={1000}
                        value={priceInput}
                        placeholder="Nhập giá mới"
                        onChange={(event) => setPriceInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addPrice();
                          }
                        }}
                      />
                      <InputGroupAddon align="inline-end">VND</InputGroupAddon>
                      <InputGroupButton onClick={addPrice}>
                        Thêm
                      </InputGroupButton>
                    </InputGroup>
                  </div>
                  <FieldDescription>
                    `0 VND` được khóa để tiếp tục hỗ trợ khóa học miễn phí.
                  </FieldDescription>
                  <FieldError>{priceError}</FieldError>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Field>
              <FieldDescription>
                Cập nhật gần nhất:{" "}
                {new Date(config.updatedAt).toLocaleString("vi-VN")}
              </FieldDescription>
              <FieldError>{formError}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !form.formState.isDirty}
            onClick={() => {
              form.reset(toFormValues(config));
              setPriceInput("");
              setPriceError(null);
              setFormError(null);
            }}
          >
            Hoàn tác
          </Button>
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
