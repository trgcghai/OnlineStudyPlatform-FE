import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface CartCourseInstructor {
  id: string;
  name: string;
}

export interface CartCourse {
  id: string;
  title: string;
  category: string;
  thumbnail: string | null;
  price: number;
  instructor: CartCourseInstructor | null;
}

export interface CartItem {
  id: string;
  courseId: string;
  addedAt: string;
  course: CartCourse;
}

export interface CartSummary {
  totalItems: number;
  totalPrice: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: CartSummary;
}

export interface CartFilters {
  page?: number;
  limit?: number;
}

function buildCartQuery(filters: CartFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function getCart(
  filters: CartFilters = {},
): Promise<CartResponse> {
  const { data } = await axiosClient.get<ApiSuccessResponse<CartResponse>>(
    `/cart${buildCartQuery(filters)}`,
  );

  return data.data;
}

export async function addCartItem(courseId: string): Promise<CartItem> {
  const { data } = await axiosClient.post<ApiSuccessResponse<CartItem>>(
    "/cart/items",
    { courseId },
  );

  return data.data;
}

export async function removeCartItem(courseId: string): Promise<void> {
  await axiosClient.delete(`/cart/items/${courseId}`);
}
