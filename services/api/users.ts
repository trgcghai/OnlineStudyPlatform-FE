import axiosClient from "@/services/axios";

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  id: string;
  name: string;
  email: string;
  role: "Learner" | "Instructor" | "Admin";
  avatar: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export async function registerUser(
  payload: RegisterUserPayload
): Promise<RegisterUserResponse> {
  const { data } = await axiosClient.post<RegisterUserResponse>(
    "/users",
    payload
  );

  return data;
}
