import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "../services/transactionService";
import { toast } from "sonner";

/**
 * Hook for fetching transactions with filters
 */
export function useTransactions(filters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => transactionService.getTransactions(filters),
    staleTime: 30000, // 30 seconds
    select: (data) => data.data,
  });
}

/**
 * Hook for fetching single transaction
 */
export function useTransaction(id) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: () => transactionService.getTransactionById(id),
    enabled: !!id,
    select: (data) => data.data.transaction,
  });
}

/**
 * Hook for creating transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.createTransaction,
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("Tạo giao dịch thành công", {
        description: `Số dư mới: ${data.data.balanceChange.current.toLocaleString(
          "vi-VN"
        )} VND`,
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Có lỗi xảy ra";
      toast.error("Tạo giao dịch thất bại", {
        description: message,
      });
    },
  });
}

/**
 * Hook for updating transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      transactionService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("Cập nhật giao dịch thành công");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Có lỗi xảy ra";
      toast.error("Cập nhật giao dịch thất bại", {
        description: message,
      });
    },
  });
}

/**
 * Hook for deleting transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("Xóa giao dịch thành công");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Có lỗi xảy ra";
      toast.error("Xóa giao dịch thất bại", {
        description: message,
      });
    },
  });
}
