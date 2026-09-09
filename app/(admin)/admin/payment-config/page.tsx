"use client";

import { PaymentConfigAuditTable } from "@/components/admin/payment-config/payment-config-audit-table";
import { PaymentConfigForm } from "@/components/admin/payment-config/payment-config-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaymentConfig } from "@/hooks/useAdminPaymentConfig";
import { useState } from "react";

const PAYMENT_CONFIG_TAB = "config";
const PAYMENT_AUDIT_TAB = "audit";

export default function AdminPaymentConfigPage() {
  const [activeTab, setActiveTab] = useState(PAYMENT_CONFIG_TAB);
  const {
    data: config,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePaymentConfig();

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Monetization</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Cấu hình thanh toán
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Quản trị phí nền tảng, danh sách giá khóa học và điều kiện rút tiền
          dùng chung cho toàn hệ thống.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : isError || !config ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được cấu hình thanh toán</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Vui lòng thử lại hoặc kiểm tra quyền truy cập của tài khoản quản
              trị.
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              Tải lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value={PAYMENT_CONFIG_TAB}>Cấu hình</TabsTrigger>
            <TabsTrigger value={PAYMENT_AUDIT_TAB}>
              Lịch sử thay đổi
            </TabsTrigger>
          </TabsList>
          <TabsContent value={PAYMENT_CONFIG_TAB}>
            <PaymentConfigForm key={config.updatedAt} config={config} />
          </TabsContent>
          <TabsContent value={PAYMENT_AUDIT_TAB}>
            <PaymentConfigAuditTable
              enabled={activeTab === PAYMENT_AUDIT_TAB}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
