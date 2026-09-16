"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWithdrawRequest } from "@/hooks/usePayment";
import { MINIMUM_WITHDRAWAL_AMOUNT_MIN } from "@/lib/schemas/payment-config";
import { useMyInstructorAccount } from "@/hooks/useUsers";
import { CircleDollarSignIcon } from "lucide-react";

const withdrawRequestSchema = z.object({
  amount: z
    .number("Số tiền rút là bắt buộc")
    .int("Số tiền rút phải là số nguyên")
    .min(
      MINIMUM_WITHDRAWAL_AMOUNT_MIN,
      `Số tiền rút phải từ ${MINIMUM_WITHDRAWAL_AMOUNT_MIN.toLocaleString("vi-VN")} VND`,
    ),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

type WithdrawRequestFormValues = z.infer<typeof withdrawRequestSchema>;

function formatAmountInput(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("vi-VN") : "";
}

function parseAmountInput(value: string): number {
  const digits = value.replace(/\D/g, "");

  return digits ? Number(digits) : Number.NaN;
}

export function CreateWithdrawRequestDialog() {
  const [open, setOpen] = useState(false);
  const [accountAlertOpen, setAccountAlertOpen] = useState(false);
  const accountQuery = useMyInstructorAccount();
  const createMutation = useCreateWithdrawRequest();
  const form = useForm<WithdrawRequestFormValues>({
    resolver: zodResolver(withdrawRequestSchema),
    defaultValues: { amount: MINIMUM_WITHDRAWAL_AMOUNT_MIN, note: "" },
  });

  function handleOpenRequest() {
    if (!accountQuery.data) {
      setAccountAlertOpen(true);
      return;
    }

    setOpen(true);
  }

  async function onSubmit(values: WithdrawRequestFormValues) {
    await createMutation.mutateAsync({
      amount: values.amount,
      note: values.note?.trim() || undefined,
    });
    form.reset({ amount: MINIMUM_WITHDRAWAL_AMOUNT_MIN, note: "" });
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleOpenRequest}
        disabled={accountQuery.isLoading}
      >
        {accountQuery.isLoading ? <Spinner /> : <CircleDollarSignIcon />}
        Tạo yêu cầu rút tiền
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Tiền tệ cố định là VND. Hệ thống sẽ kiểm tra mức rút tối thiểu
              hiện hành khi gửi yêu cầu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Field data-invalid={!!form.formState.errors.amount}>
              <FieldLabel htmlFor="withdrawAmount" required>
                Số tiền
              </FieldLabel>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <Input
                      id="withdrawAmount"
                      type="text"
                      inputMode="numeric"
                      min={MINIMUM_WITHDRAWAL_AMOUNT_MIN}
                      value={formatAmountInput(field.value)}
                      onBlur={field.onBlur}
                      onChange={(event) =>
                        field.onChange(parseAmountInput(event.target.value))
                      }
                    />
                  )}
                />
                <div className="flex h-9 items-center rounded-4xl border border-input bg-input/30 px-4 text-sm font-medium">
                  VND
                </div>
              </div>
              <FieldError errors={[form.formState.errors.amount]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.note}>
              <FieldLabel htmlFor="withdrawNote">Ghi chú</FieldLabel>
              <Textarea
                id="withdrawNote"
                rows={4}
                placeholder="Ví dụ: rút doanh thu khóa học tháng này"
                {...form.register("note")}
              />
              <FieldError errors={[form.formState.errors.note]} />
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Spinner /> : null}
                {createMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={accountAlertOpen} onOpenChange={setAccountAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cần cấu hình tài khoản nhận tiền
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn cần thêm thông tin ngân hàng trước khi tạo yêu cầu rút tiền.
              Thông tin này giúp quản trị viên xử lý thanh toán chính xác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Để sau</AlertDialogCancel>
            <AlertDialogAction
              nativeButton={false}
              render={<Link href="/instructor/account" />}
            >
              Cấu hình tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
