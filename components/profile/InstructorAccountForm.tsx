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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  instructorAccountSchema,
  type InstructorAccountFormValues,
} from "@/lib/schemas/instructor-account";
import {
  useBanks,
  useMyInstructorAccount,
  useUpsertMyInstructorAccount,
} from "@/hooks/useUsers";

const emptyValues: InstructorAccountFormValues = {
  bankAccountNumber: "",
  accountHolderName: "",
  bankCode: "",
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
  const {
    data: banks = [],
    isLoading: isBanksLoading,
    isError: isBanksError,
    refetch: refetchBanks,
  } = useBanks();
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
      bankAccountNumber: account.bankAccountNumber,
      accountHolderName: account.accountHolderName,
      bankCode: account.bankCode ?? "",
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

  if (isLoading || isBanksLoading) {
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

          {isBanksError && (
            <Alert variant="destructive">
              <AlertTitle>Không tải được danh sách ngân hàng</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <span>Vui lòng tải lại danh sách ngân hàng trước khi lưu.</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refetchBanks()}
                >
                  Tải lại ngân hàng
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Controller
              control={form.control}
              name="bankCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel required>Ngân hàng</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={Object.fromEntries(
                      banks.map((bank) => [
                        bank.code,
                        `${bank.shortName} - ${bank.name}`,
                      ]),
                    )}
                    disabled={isBanksError || banks.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn ngân hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          <span className="font-medium">{bank.shortName}</span>
                          <span className="text-muted-foreground">
                            {bank.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Hệ thống tự lưu tên ngân hàng theo danh sách VietQR.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.bankAccountNumber}>
                <FieldLabel htmlFor="bankAccountNumber" required>
                  Số tài khoản
                </FieldLabel>
                <Input
                  id="bankAccountNumber"
                  placeholder="Số tài khoản..."
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
                  placeholder="Tên chủ tài khoản..."
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
                      placeholder="Chi nhánh ngân hàng..."
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
                      placeholder="Số điện thoại..."
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
                    placeholder="Ghi chú..."
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

          <Button
            type="submit"
            disabled={isPending || isBanksError || !form.formState.isDirty}
          >
            {isPending ? <Spinner /> : <Save aria-hidden="true" />}
            {isPending ? "Đang lưu..." : "Lưu tài khoản nhận tiền"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
