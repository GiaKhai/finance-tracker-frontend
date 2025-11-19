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
import { Receipt, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DataTable from "@/components/data-table";

export default function Transactions() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, limit],
    queryFn: () => transactionService.getTransactions({ page, limit }),
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

  // Define columns for DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="font-medium">
            {new Date(row.original.date).toLocaleDateString("vi-VN")}
          </span>
        ),
        enableSorting: true,
      },
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
            variant={row.original.type === "income" ? "success" : "destructive"}
            className="gap-1"
          >
            {row.original.type === "income" ? (
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
            className={`font-bold ${
              row.original.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {row.original.type === "income" ? "+" : "-"}
            {formatCurrency(parseFloat(row.original.amount))}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: "actions",
        header: "Actions",
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
      <div className="flex justify-between items-center">
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
