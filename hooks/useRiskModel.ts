import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { riskModelKeys } from "@/lib/query-keys";
import { getRiskModelStatus } from "@/services/api/risk-model";
import { isApiErrorResponse } from "@/services/axios";

export function mapRiskModelError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) return NETWORK_ERROR_MESSAGE;

  const { status, data } = error.response;
  if (!isApiErrorResponse(data)) return GENERIC_ERROR_MESSAGE;

  if (status === 400) return data.error.message || GENERIC_ERROR_MESSAGE;
  if (status === 403) return "Bạn không có quyền quản lý Risk Model.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useRiskModelStatus() {
  return useQuery({
    queryKey: riskModelKeys.active(),
    queryFn: getRiskModelStatus,
  });
}
