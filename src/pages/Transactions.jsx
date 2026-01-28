import { useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "../services/transactionService";
import { walletService } from "../services/walletService";
import { categoryService } from "../services/categoryService";
import { userService } from "../services/userService";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Trash2, ArrowUpRight, ArrowDownRight, Filter, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DataTable from "@/components/data-table";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Transactions() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { user } = useAuthStore();

  const { register, watch, setValue, reset: resetFilters } = useForm({
    defaultValues: {
      category_id: "all",
      wallet_id: "all",
      type: "all",
      user_id: "all"
    }
  });

  const filters = watch();

  // Fetch filter options
  const { data: walletsData } = useQuery({
    queryKey: ["wallets"],
    queryFn: walletService.getAllWallets,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAllCategories(),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => userService.getUsers({ page: 1, limit: 100 }),
    enabled: user?.role === "admin",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, limit, filters],
    queryFn: () => transactionService.getTransactions({
      page,
      limit,
      wallet_id: filters.wallet_id === "all" ? undefined : filters.wallet_id,
      category_id: filters.category_id === "all" ? undefined : filters.category_id,
      type: filters.type === "all" ? undefined : filters.type,
      user_id: filters.user_id === "all" ? undefined : filters.user_id,
    }),
  });

  const handleResetFilters = () => {
    resetFilters({
      category_id: "all",
      wallet_id: "all",
      type: "all",
      user_id: "all"
    });
  };

  const deleteMutation = useMutation({
    mutationFn: transactionService.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(["transactions"]);
      queryClient.invalidateQueries(["wallets"]);
    },
  });

  const handleDelete = (id, category) => {
    if (confirm(`Delete transaction "${category}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Define columns for DataTable
  // const { user } = useAuthStore(); // Already called at top level
  const columns = useMemo(
    () => [
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => (
          <span className="font-medium">
            {dayjs(row.original.transaction_date).format("DD/MM/YYYY")}
          </span>
        ),
        enableSorting: true,
      },
      // Admin only: User column
      ...(user?.role === 'admin' ? [{
        accessorKey: "user_name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
              {row.original.user_name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm">{row.original.user_name}</span>
          </div>
        )
      }] : []),
      {
        accessorKey: "category_name",
        header: "Category",
        enableSorting: true,
      },
      {
        accessorKey: "wallet_name",
        header: "Wallet",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.wallet_name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            variant={row.original.type === "INCOME" ? "success" : "destructive"}
            className="gap-1"
          >
            {row.original.type === "INCOME" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {row.original.type}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span
            className={`font-bold ${row.original.type === "INCOME" ? "text-green-600" : "text-red-600"
              }`}
          >
            {row.original.type === "INCOME" ? "+" : "-"}
            {formatCurrency(parseFloat(row.original.amount))}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleDelete(row.original.id, row.original.category)
              }
              disabled={deleteMutation.isPending}
              className="hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation.isPending]
  );

  const transactions = data?.transactions || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Transactions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track all your income and expenses
            </p>
          </div>
          <AddTransactionDialog />
        </div>

        {/* Filters */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
              </div>

              <Select
                value={filters.wallet_id}
                onValueChange={(val) => setValue("wallet_id", val)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  {walletsData?.wallets?.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.category_id}
                onValueChange={(val) => setValue("category_id", val)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesData?.categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.type}
                onValueChange={(val) => setValue("type", val)}
              >
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              {user?.role === "admin" && (
                <Select
                  value={filters.user_id}
                  onValueChange={(val) => setValue("user_id", val)}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {usersData?.users?.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(filters.wallet_id !== "all" || filters.category_id !== "all" || filters.type !== "all" || filters.user_id !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {transactions.length === 0 && !isLoading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your finances by adding your first transaction
            </p>
            <AddTransactionDialog />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              A complete list of your financial activities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={transactions}
              isLoading={isLoading}
              showPagination={true}
              pagination={
                data?.pagination
                  ? {
                    current: data.pagination.page,
                    pageSize: data.pagination.limit,
                    total: data.pagination.total,
                  }
                  : undefined
              }
              onPageChange={(page, pageSize) => {
                setPage(page);
                setLimit(pageSize);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
