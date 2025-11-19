import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { walletService } from "../services/walletService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Plus,
  Trash2,
  Loader2,
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Wallet types with icons
const walletTypes = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank Account", icon: Building2 },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone },
];

export default function Wallets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "cash",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["wallets", page, limit],
    queryFn: () => walletService.getWallets({ page, limit }),
  });

  const createMutation = useMutation({
    mutationFn: walletService.createWallet,
    onSuccess: () => {
      queryClient.invalidateQueries(["wallets"]);
      setShowDialog(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: walletService.deleteWallet,
    onSuccess: () => {
      queryClient.invalidateQueries(["wallets"]);
    },
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading wallets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Wallets
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your financial accounts
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Wallet
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
            <DialogDescription>
              Add a new wallet to track your finances
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Wallet Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name", { required: "Wallet name is required" })}
                placeholder="e.g., Cash, Bank Account"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Wallet Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet type" />
                </SelectTrigger>
                <SelectContent>
                  {walletTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance</Label>
              <div className="relative">
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  {...register("balance")}
                  defaultValue={0}
                  placeholder="0.00"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  VND
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  reset();
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Wallet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.wallets?.map((wallet) => {
          const walletType =
            walletTypes.find((t) => t.value === wallet.type) || walletTypes[0];
          const WalletIcon = walletType.icon;

          return (
            <Card
              key={wallet.id}
              className="relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/wallets/${wallet.id}`)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <WalletIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{wallet.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{walletType.label}</Badge>
                        <Badge variant="secondary">{wallet.currency}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Balance
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      {formatCurrency(parseFloat(wallet.balance))}
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete wallet "${wallet.name}"?`)) {
                        deleteMutation.mutate(wallet.id);
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data?.wallets?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No wallets yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first wallet to start tracking finances
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages} (
            {data.pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.pagination.totalPages, p + 1))
              }
              disabled={page === data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
