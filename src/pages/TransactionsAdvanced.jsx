import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "../services/transactionService";
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
import {
  Receipt,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DataTable from "@/components/data-table";

export default function TransactionsAdvanced() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionService.getTransactions(),
  });

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

  const handlePageChange = (page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
  };

  // Define columns for DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap">
            {new Date(row.original.date).toLocaleDateString("vi-VN")}
          </span>
        ),
        enableSorting: true,
        size: 120,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-xl">{row.original.icon || "📁"}</span>
            <span className="font-medium">{row.original.category}</span>
          </div>
        ),
        enableSorting: true,
        size: 200,
      },
      {
        accessorKey: "note",
        header: "Note",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {row.original.note || "-"}
          </span>
        ),
        size: 250,
      },
      {
        accessorKey: "wallet_name",
        header: "Wallet",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.wallet_name || "N/A"}
          </span>
        ),
        size: 150,
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
        size: 120,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <div className="text-right">
            <span
              className={`font-bold ${
                row.original.type === "INCOME"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {row.original.type === "INCOME" ? "+" : "-"}
              {formatCurrency(parseFloat(row.original.amount))}
            </span>
          </div>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleDelete(row.original.id, row.original.category)
              }
              disabled={deleteMutation.isPending}
              className="hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
        size: 100,
      },
    ],
    [deleteMutation.isPending]
  );

  const transactions = data?.transactions || [];

  // Calculate summary
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const netAmount = totalIncome - totalExpense;

  // Paginate data
  const paginatedData = transactions.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  // Update total
  const updatedPagination = {
    ...pagination,
    total: transactions.length,
  };

  // Summary data for table footer
  const summaryData = {
    title: { value: "Total", align: "left" },
    amount: {
      value: (
        <div className="text-right">
          <div className="text-green-600 font-bold">
            Income: {formatCurrency(totalIncome)}
          </div>
          <div className="text-red-600 font-bold">
            Expense: {formatCurrency(totalExpense)}
          </div>
          <div
            className={`font-bold ${
              netAmount >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            Net: {formatCurrency(netAmount)}
          </div>
        </div>
      ),
      align: "right",
    },
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transactions (Advanced)
          </h1>
          <p className="text-muted-foreground">
            Full-featured table with sorting, pagination, and summary
          </p>
        </div>
        <AddTransactionDialog />
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
              Complete list with sorting, pagination, and summary row
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={paginatedData}
              isLoading={isLoading}
              showPagination={true}
              pagination={updatedPagination}
              onPageChange={handlePageChange}
              showQuickJumper={true}
              summaryData={summaryData}
              columnPinning={{
                left: [],
                right: ["actions"],
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
