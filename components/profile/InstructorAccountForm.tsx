"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Spinner } from "@/components/ui/spinner";
import {
  instructorAccountSchema,
  type InstructorAccountFormValues,
} from "@/lib/schemas/instructor-account";
import {
  useMyInstructorAccount,
  useUpsertMyInstructorAccount,
} from "@/hooks/useUsers";

const emptyValues: InstructorAccountFormValues = {
  bankName: "",
  bankAccountNumber: "",
  accountHolderName: "",
  bankCode: null,
  branchName: null,
  phoneNumber: null,
  note: null,
};

function valueForInput(value: string | null): string {
  return value ?? "";
}

export default function InstructorAccountForm() {
  const {
    data: account,
    isLoading,
    isError,
    refetch,
  } = useMyInstructorAccount();
  const { upsertAccount, isPending } = useUpsertMyInstructorAccount();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<InstructorAccountFormValues>({
    resolver: zodResolver(instructorAccountSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!account) {
      form.reset(emptyValues);
      return;
    }

    form.reset({
      bankName: account.bankName,
      bankAccountNumber: account.bankAccountNumber,
      accountHolderName: account.accountHolderName,
      bankCode: account.bankCode,
      branchName: account.branchName,
      phoneNumber: account.phoneNumber,
      note: account.note,
    });
  }, [account, form]);

  async function onSubmit(values: InstructorAccountFormValues) {
    setFormError(null);
    const result = await upsertAccount(values);

    if (!result.ok) {
      for (const fieldError of result.failure?.fieldErrors ?? []) {
        form.setError(fieldError.field, { message: fieldError.message });
      }
      setFormError(result.failure?.formError ?? null);
      return;
    }

    form.reset(values);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tài khoản nhận tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Không tải được tài khoản nhận tiền</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>Vui lòng thử lại hoặc kiểm tra kết nối.</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => void refetch()}
              >
                Tải lại
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
          Tài khoản nhận tiền
        </CardTitle>
        <CardDescription>
          Thông tin này dùng để xử lý yêu cầu rút tiền của giảng viên.
          {!account ? " Bạn chưa cấu hình tài khoản nhận tiền." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể lưu tài khoản</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.bankName}>
                <FieldLabel htmlFor="bankName" required>
                  Tên ngân hàng
                </FieldLabel>
                <Input id="bankName" {...form.register("bankName")} />
                <FieldError errors={[form.formState.errors.bankName]} />
              </Field>

              <Controller
                control={form.control}
                name="bankCode"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="bankCode">Mã ngân hàng</FieldLabel>
                    <Input
                      id="bankCode"
                      value={valueForInput(field.value)}
                      onBlur={field.onBlur}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.bankAccountNumber}>
                <FieldLabel htmlFor="bankAccountNumber" required>
                  Số tài khoản
                </FieldLabel>
                <Input
                  id="bankAccountNumber"
                  {...form.register("bankAccountNumber")}
                />
                <FieldError
                  errors={[form.formState.errors.bankAccountNumber]}
                />
              </Field>

              <Field data-invalid={!!form.formState.errors.accountHolderName}>
                <FieldLabel htmlFor="accountHolderName" required>
                  Tên chủ tài khoản
                </FieldLabel>
                <Input
                  id="accountHolderName"
                  {...form.register("accountHolderName")}
                />
                <FieldError
                  errors={[form.formState.errors.accountHolderName]}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={form.control}
                name="branchName"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="branchName">Chi nhánh</FieldLabel>
                    <Input
                      id="branchName"
                      value={valueForInput(field.value)}
                      onBlur={field.onBlur}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="phoneNumber"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phoneNumber">Số điện thoại</FieldLabel>
                    <Input
                      id="phoneNumber"
                      value={valueForInput(field.value)}
                      onBlur={field.onBlur}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="note"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="note">Ghi chú</FieldLabel>
                  <Input
                    id="note"
                    value={valueForInput(field.value)}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                  <FieldDescription>
                    Ví dụ: tài khoản chính dùng để nhận doanh thu khóa học.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? <Spinner /> : <Save aria-hidden="true" />}
            {isPending ? "Đang lưu..." : "Lưu tài khoản nhận tiền"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
