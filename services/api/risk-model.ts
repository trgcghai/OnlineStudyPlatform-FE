import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface RiskModelInfo {
  modelName: string;
  modelVersion: string;
  featureVersion: string;
  trainedAt: string;
  sampleCount: number;
  metrics: Record<string, number>;
  artifactPath: string;
  isActive: boolean;
}

export interface RiskModelStatusResponse {
  model: RiskModelInfo | null;
}

export type RiskModelTrainingResult = RiskModelInfo;

export async function getRiskModelStatus(): Promise<RiskModelStatusResponse> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<RiskModelStatusResponse>>(
      "/risk/model",
    );

  return data.data;
}

export async function trainRiskModel(): Promise<RiskModelTrainingResult> {
  const { data } =
    await axiosClient.post<ApiSuccessResponse<RiskModelTrainingResult>>(
      "/risk/model/train",
    );

  return data.data;
}
