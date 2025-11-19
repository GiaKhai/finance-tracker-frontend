import { useQuery } from "@tanstack/react-query";
import { categoryService } from "../services/categoryService";

/**
 * Hook for fetching categories
 */
export function useCategories(type = null) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => categoryService.getCategories(type ? { type } : {}),
    staleTime: 300000, // 5 minutes (categories don't change often)
    select: (data) => data.categories,
  });
}

/**
 * Hook for fetching grouped categories (INCOME and EXPENSE)
 */
export function useGroupedCategories() {
  const { data: allCategories, ...rest } = useCategories();

  const grouped = allCategories?.reduce((acc, category) => {
    const type = category.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(category);
    return acc;
  }, {});

  return {
    data: grouped,
    incomeCategories: grouped?.INCOME || [],
    expenseCategories: grouped?.EXPENSE || [],
    ...rest,
  };
}
