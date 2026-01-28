import { useQuery } from "@tanstack/react-query";
import { walletService } from "../services/walletService";
import { transactionService } from "../services/transactionService";
import { categoryService } from "../services/categoryService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "../store/authStore";
import { userService } from "../services/userService";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState("this_month");
  const [selectedWallet, setSelectedWallet] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => userService.getUsers({ page: 1, limit: 100 }),
    enabled: user?.role === "admin",
  });

  const { data: walletsData } = useQuery({
    queryKey: ["wallets"],
    queryFn: walletService.getAllWallets,
  });


  const getFilterDate = () => {
    const now = dayjs();
    const startOfWeek = now.startOf("week");
    const startOfMonth = now.startOf("month");
    const startOfYear = now.startOf("year");

    switch (timeRange) {
      case "today":
        return { start: now, end: now };
      case "this_week":
        return { start: startOfWeek, end: now };
      case "this_month":
        return { start: startOfMonth, end: now };
      case "this_year":
        return { start: startOfYear, end: now };
      case "all":
      default:
        return { start: undefined, end: undefined };
    }
  };

  const { data: transactionsData } = useQuery({
    queryKey: ["transactions", timeRange, selectedWallet, selectedCategory, selectedUser],
    queryFn: () => transactionService.getAllTransactions(
      {
        start_date: timeRange === "all" ? undefined : dayjs(getFilterDate().start).format("YYYY-MM-DD"),
        end_date: timeRange === "all" ? undefined : dayjs(getFilterDate().end).format("YYYY-MM-DD"),
        wallet_id: selectedWallet === "all" ? undefined : selectedWallet,
        category_id: selectedCategory === "all" ? undefined : selectedCategory,
        user_id: selectedUser === "all" ? undefined : selectedUser,
      }
    ),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAllCategories(),
  });

  const totalBalance =
    walletsData?.wallets?.reduce((sum, w) => sum + parseFloat(w.balance), 0) ||
    0;


  const data = transactionsData?.transactions || [];

  const monthlyIncome = data
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyExpense = data
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const cashFlow = monthlyIncome - monthlyExpense;

  const monthlyTrendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthTransactions =
        data?.filter((t) => {
          const tDate = new Date(t.transaction_date);
          return tDate.getMonth() === month && tDate.getFullYear() === year;
        }) || [];

      const income = monthTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expense = monthTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        income,
        expense,
      });
    }
    return months;
  }, [transactionsData]);


  const categoryStats = useMemo(() => {
    const incomeByCategory = {};
    const expenseByCategory = {};

    data.forEach((t) => {
      const categoryName = t.category_name || t.category || "Other";
      const amount = parseFloat(t.amount);

      if (t.type === "INCOME") {
        incomeByCategory[categoryName] =
          (incomeByCategory[categoryName] || 0) + amount;
      } else if (t.type === "EXPENSE") {
        expenseByCategory[categoryName] =
          (expenseByCategory[categoryName] || 0) + amount;
      }
    });

    const incomeData = Object.entries(incomeByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const expenseData = Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { incomeData, expenseData };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard</h1>
          <p className="text-sm text-muted-foreground">Financial overview</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedWallet} onValueChange={setSelectedWallet}>
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

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

          {user?.role === "admin" && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTimeRange("this_month");
              setSelectedWallet("all");
              setSelectedCategory("all");
              setSelectedUser("all");
            }}
            className="h-9"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {walletsData?.wallets?.length || 0} wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === "today"
                ? "Today"
                : timeRange === "this_week"
                  ? "This week"
                  : timeRange === "this_month"
                    ? "This month"
                    : timeRange === "this_year"
                      ? "This year"
                      : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === "today"
                ? "Today"
                : timeRange === "this_week"
                  ? "This week"
                  : timeRange === "this_month"
                    ? "This month"
                    : timeRange === "this_year"
                      ? "This year"
                      : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${cashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
            >
              {cashFlow >= 0 ? "+" : ""}
              {formatCurrency(cashFlow)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Income - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top Expenses
              {(selectedWallet !== "all" || selectedCategory !== "all") && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (
                  {selectedWallet !== "all" &&
                    walletsData?.wallets?.find(
                      (w) => w.id === parseInt(selectedWallet)
                    )?.name}
                  {selectedWallet !== "all" &&
                    selectedCategory !== "all" &&
                    " • "}
                  {selectedCategory !== "all" &&
                    categoriesData?.categories?.find(
                      (c) => c.id === parseInt(selectedCategory)
                    )?.name}
                  )
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryStats.expenseData.length > 0 ? (
              <div className="flex gap-4">
                <ResponsiveContainer width="50%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryStats.expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryStats.expenseData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryStats.expenseData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wallets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {walletsData?.wallets?.map((wallet, index) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{wallet.name}</p>
                    {wallet.type && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {wallet.type.replace("_", " ").toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatCurrency(parseFloat(wallet.balance))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (parseFloat(wallet.balance) / totalBalance) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                </div>
              </div>
            ))}
            {(!walletsData?.wallets || walletsData.wallets.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No wallets found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${transaction.type === "INCOME"
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
                      {dayjs(transaction.transaction_date).format("DD/MM/YYYY")}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-bold ${transaction.type === "INCOME"
                    ? "text-green-600"
                    : "text-red-600"
                    }`}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(parseFloat(transaction.amount))}
                </p>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
