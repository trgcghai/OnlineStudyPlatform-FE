import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { cartKeys } from "@/lib/query-keys";
import { isApiErrorResponse } from "@/services/axios";
import {
  addCartItem,
  checkoutCart,
  getCart,
  removeCartItem,
  type CartFilters,
  type CartItem,
} from "@/services/api/cart";
import type { CheckoutResult } from "@/services/api/payment";

function mapCartError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) return NETWORK_ERROR_MESSAGE;

  const { status, data } = error.response;
  if (!isApiErrorResponse(data)) return GENERIC_ERROR_MESSAGE;

  if (status === 400)
    return data.error.message || "Không thể cập nhật giỏ hàng.";
  if (status === 401) return "Vui lòng đăng nhập để sử dụng giỏ hàng.";
  if (status === 403)
    return "Chỉ tài khoản học viên mới có thể sử dụng giỏ hàng.";
  if (status === 404) return "Khóa học không còn khả dụng.";
  if (status === 409)
    return data.error.message || "Khóa học đã có trong giỏ hàng.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useCart(filters: CartFilters) {
  return useQuery({
    queryKey: cartKeys.list(filters),
    queryFn: () => getCart(filters),
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation<CartItem, unknown, string>({
    mutationFn: addCartItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      toast.add({ title: "Đã thêm khóa học vào giỏ hàng.", type: "success" });
    },
    onError: (error) => {
      toast.add({ title: mapCartError(error), type: "error" });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: removeCartItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      toast.add({ title: "Đã xóa khóa học khỏi giỏ hàng.", type: "info" });
    },
    onError: (error) => {
      toast.add({ title: mapCartError(error), type: "error" });
    },
  });
}

export function useCheckoutCart() {
  const queryClient = useQueryClient();

  return useMutation<CheckoutResult, unknown, void>({
    mutationFn: checkoutCart,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (error) => {
      toast.add({ title: mapCartError(error), type: "error" });
    },
  });
}
