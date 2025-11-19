import { useQuery } from "@tanstack/react-query";
import { walletService } from "../services/walletService";

/**
 * Hook for fetching wallets
 */
export function useWallets() {
  return useQuery({
    queryKey: ["wallets"],
    queryFn: walletService.getWallets,
    staleTime: 60000, // 1 minute
    select: (data) => data.wallets,
  });
}

/**
 * Hook for fetching single wallet
 */
export function useWallet(id) {
  return useQuery({
    queryKey: ["wallets", id],
    queryFn: () => walletService.getWalletById(id),
    enabled: !!id,
    select: (data) => data.wallet,
  });
}
