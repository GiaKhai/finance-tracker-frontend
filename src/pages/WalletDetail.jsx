import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "../services/walletService";
import { transactionService } from "../services/transactionService";
import { categoryService } from "../services/categoryService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Edit,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function WalletDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [transactionType, setTransactionType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", id],
    queryFn: () => walletService.getWalletById(id),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionService.getTransactions(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  const wallet = walletData?.wallet;

  // Filter transactions for this wallet
  const walletTransactions = useMemo(() => {
    let filtered =
      transactionsData?.transactions?.filter(
        (t) => t.wallet_id === parseInt(id)
      ) || [];

    // Filter by transaction type
    if (transactionType !== "all") {
      filtered = filtered.filter((t) => t.type === transactionType);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (t) => t.category_id === parseInt(selectedCategory)
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactionsData, id, transactionType, selectedCategory]);

  // Calculate stats
  const stats = useMemo(() => {
    const income = walletTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expense = walletTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return { income, expense, total: walletTransactions.length };
  }, [walletTransactions]);

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Wallet not found</p>
        <Button onClick={() => navigate("/wallets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Wallets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/wallets")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{wallet.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {wallet.type?.replace("_", " ")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/wallets/${id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Wallet
        </Button>
      </div>

      {/* Balance Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Current Balance
            </p>
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(parseFloat(wallet.balance))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.income)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.expense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base">Transactions</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />

              <Select
                value={transactionType}
                onValueChange={setTransactionType}
              >
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesData?.categories?.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(transactionType !== "all" || selectedCategory !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTransactionType("all");
                    setSelectedCategory("all");
                  }}
                  className="h-9"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {walletTransactions.length > 0 ? (
              walletTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "INCOME"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "INCOME" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.category_name || transaction.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <p
                    className={`font-bold ${
                      transaction.type === "INCOME"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(parseFloat(transaction.amount))}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
