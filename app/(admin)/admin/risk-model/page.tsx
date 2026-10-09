"use client";

import { RiskModelStatusCard } from "@/components/admin/risk-model/risk-model-status-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiskModelStatus } from "@/hooks/useRiskModel";

export default function AdminRiskModelPage() {
  const modelQuery = useRiskModelStatus();

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">AI Analytics</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Quản lý Risk Model
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Theo dõi model AI đang được dùng để dự đoán Learning Risk cho học
          viên.
        </p>
      </div>

      {modelQuery.isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : modelQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được thông tin Risk Model</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Vui lòng thử lại hoặc kiểm tra kết nối tới backend.</span>
            <Button
              type="button"
              variant="outline"
              disabled={modelQuery.isFetching}
              onClick={() => void modelQuery.refetch()}
            >
              Tải lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <RiskModelStatusCard model={modelQuery.data?.model ?? null} />
      )}
    </div>
  );
}
