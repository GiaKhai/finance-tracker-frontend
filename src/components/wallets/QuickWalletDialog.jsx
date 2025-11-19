import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/services/walletService";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Wallet,
  Banknote,
  Building2,
  CreditCard,
  Smartphone,
} from "lucide-react";

// Wallet types with icons
const walletTypes = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank Account", icon: Building2 },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone },
];

export function QuickWalletDialog({ open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      type: "cash",
      balance: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: walletService.createWallet,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["wallets"]);
      reset();
      if (onSuccess) {
        onSuccess(data.wallet);
      }
      onOpenChange(false);
    },
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      balance: parseFloat(data.balance) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Create New Wallet
          </DialogTitle>
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
              placeholder="e.g., Cash, Bank Account, Credit Card"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
                placeholder="0.00"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                VND
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your current balance for this wallet
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
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
  );
}
