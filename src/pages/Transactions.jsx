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
import { Receipt, Trash2, ArrowUpRight, ArrowDownRight, Filter, X, ArrowRightLeft } from "lucide-react";
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
        cell: ({ row }) => {
          if (row.original.type === "TRANSFER") {
            return (
              <div className="flex items-center gap-2 text-blue-600">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transfer</span>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <span>{row.original.category_icon}</span>
              <span>{row.original.category_name}</span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "wallet_name",
        header: "Wallet",
        cell: ({ row }) => {
          if (row.original.type === "TRANSFER") {
            return (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>{row.original.wallet_name}</span>
                <ArrowUpRight className="h-3 w-3" />
                <span>{row.original.target_wallet_name}</span>
              </div>
            );
          }
          return (
            <span className="text-muted-foreground">
              {row.original.wallet_name || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type;
          if (type === "TRANSFER") {
            return (
              <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
                <ArrowRightLeft className="h-3 w-3" />
                Transfer
              </Badge>
            );
          }
          return (
            <Badge
              variant={type === "INCOME" ? "success" : "destructive"}
              className="gap-1"
            >
              {type === "INCOME" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {type === "INCOME" ? "INCOME" : "EXPENSE"}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
          const type = row.original.type;
          const amount = parseFloat(row.original.amount);

          if (type === "TRANSFER") {
            return (
              <span className="font-bold text-blue-600">
                {formatCurrency(amount)}
              </span>
            );
          }

          return (
            <span
              className={`font-bold ${type === "INCOME" ? "text-green-600" : "text-red-600"
                }`}
            >
              {type === "INCOME" ? "+" : "-"}
              {formatCurrency(amount)}
            </span>
          );
        },
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
                handleDelete(row.original.id, row.original.type === 'TRANSFER' ? 'Transfer' : row.original.category_name)
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
    [deleteMutation.isPending, user?.role]
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

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium whitespace-nowrap">Filters:</span>
              </div>

              <Select
                value={filters.wallet_id}
                onValueChange={(val) => setValue("wallet_id", val)}
              >
                <SelectTrigger className="w-[140px] h-9 bg-background/50">
                  <SelectValue placeholder="All wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All wallets</SelectItem>
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
                <SelectTrigger className="w-[140px] h-9 bg-background/50">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
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
                <SelectTrigger className="w-[120px] h-9 bg-background/50">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              {user?.role === "admin" && (
                <Select
                  value={filters.user_id}
                  onValueChange={(val) => setValue("user_id", val)}
                >
                  <SelectTrigger className="w-[140px] h-9 bg-background/50">
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
                  className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
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
            <CardTitle>All transactions</CardTitle>
            <CardDescription>
              Full list of your financial activities
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
