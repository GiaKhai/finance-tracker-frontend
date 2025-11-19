import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Transaction Store
 * Manages transaction-related state
 */
export const useTransactionStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        selectedWallet: null,
        selectedCategory: null,
        dateRange: {
          startDate: null,
          endDate: null,
        },
        filters: {
          type: null, // 'INCOME' | 'EXPENSE' | null
          walletId: null,
          categoryId: null,
        },

        // Actions
        setSelectedWallet: (wallet) => set({ selectedWallet: wallet }),

        setSelectedCategory: (category) => set({ selectedCategory: category }),

        setDateRange: (startDate, endDate) =>
          set({ dateRange: { startDate, endDate } }),

        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
          })),

        clearFilters: () =>
          set({
            filters: { type: null, walletId: null, categoryId: null },
            dateRange: { startDate: null, endDate: null },
          }),

        // Reset store
        reset: () =>
          set({
            selectedWallet: null,
            selectedCategory: null,
            dateRange: { startDate: null, endDate: null },
            filters: { type: null, walletId: null, categoryId: null },
          }),
      }),
      {
        name: "transaction-storage",
        partialize: (state) => ({
          filters: state.filters,
          dateRange: state.dateRange,
        }),
      }
    ),
    { name: "TransactionStore" }
  )
);
