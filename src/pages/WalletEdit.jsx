import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { walletService } from "../services/walletService";
import { transactionService } from "../services/transactionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
  Save,
} from "lucide-react";

const walletTypes = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank Account", icon: Building2 },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone },
];

export default function WalletEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const { data: walletData, isLoading } = useQuery({
    queryKey: ["wallet", id],
    queryFn: () => walletService.getWalletById(id),
  });

  const wallet = walletData?.wallet;
  const originalBalance = wallet?.balance;

  useEffect(() => {
    if (wallet) {
      reset({
        name: wallet.name,
        type: wallet.type || "cash",
        balance: wallet.balance,
      });
    }
  }, [wallet, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const newBalance = parseFloat(data.balance);
      const oldBalance = parseFloat(originalBalance);

      // Update wallet
      await walletService.updateWallet(id, {
        name: data.name,
        type: data.type,
        balance: newBalance,
      });

      // If balance changed, create a "User Edit" transaction
      if (newBalance !== oldBalance) {
        const difference = newBalance - oldBalance;
        await transactionService.createTransaction({
          wallet_id: parseInt(id),
          amount: Math.abs(difference),
          type: difference > 0 ? "income" : "expense",
          category: "User Edit", // Special category for manual edits
          description: `Balance adjustment: ${
            difference > 0 ? "+" : ""
          }${difference.toFixed(2)} (User Edit)`,
          date: new Date().toISOString().split("T")[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["wallet", id]);
      queryClient.invalidateQueries(["wallets"]);
      queryClient.invalidateQueries(["transactions"]);
      navigate(`/wallets/${id}`);
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/wallets/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Update wallet information
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Details</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="balance">
                Balance <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  {...register("balance", { required: "Balance is required" })}
                  placeholder="0.00"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  VND
                </span>
              </div>
              {errors.balance && (
                <p className="text-sm text-destructive">
                  {errors.balance.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Original balance: {originalBalance}. Changing this will create a
                "User Edit" transaction.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/wallets/${id}`)}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
