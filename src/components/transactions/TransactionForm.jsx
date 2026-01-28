import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Plus, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { QuickCategoryDialog } from "@/components/categories/QuickCategoryDialog";
import { QuickWalletDialog } from "@/components/wallets/QuickWalletDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useWallets } from "@/hooks/useWallets";
import { useGroupedCategories } from "@/hooks/useCategories";
import { useCreateTransaction } from "@/hooks/useTransactions";
import {
  formatNumber,
  parseFormattedNumber,
  formatCurrency,
  cn,
} from "@/lib/utils";

// Validation schema
const transactionSchema = z.object({
  type: z.enum(["TRANSACTION", "TRANSFER"]),
  walletId: z.string().min(1, "Please select a wallet"),
  targetWalletId: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z
    .string()
    .min(1, "Please enter an amount")
    .refine(
      (val) => parseFormattedNumber(val) > 0,
      "Amount must be greater than 0"
    ),
  date: z.date({ required_error: "Please select a date" }),
  note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
}).refine((data) => {
  if (data.type === "TRANSFER") {
    return !!data.targetWalletId && data.targetWalletId !== data.walletId;
  }
  return !!data.categoryId;
}, {
  message: "Please select a category or a different target wallet",
  path: ["targetWalletId"]
});

export function TransactionForm({ setOpen }) {
  const [amountInput, setAmountInput] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  // Fetch data
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const {
    incomeCategories,
    expenseCategories,
    isLoading: categoriesLoading,
  } = useGroupedCategories();

  // Mutation
  const createTransaction = useCreateTransaction();

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "TRANSACTION",
      walletId: "",
      targetWalletId: "",
      categoryId: "",
      amount: "",
      date: new Date(),
      note: "",
    },
  });

  const transactionType = watch("type");
  const selectedWalletId = watch("walletId");
  const selectedWallet = wallets?.find(
    (w) => w.id.toString() === selectedWalletId
  );

  // Handle amount input with formatting
  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formatted = formatNumber(value);
    setAmountInput(formatted);
    setValue("amount", formatted, { shouldValidate: true });
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      let payload = {
        wallet_id: parseInt(data.walletId),
        amount: parseFormattedNumber(data.amount),
        date: format(data.date, "yyyy-MM-dd"),
        description: data.note || "",
      };

      if (data.type === "TRANSFER") {
        payload.type = "TRANSFER";
        payload.target_wallet_id = parseInt(data.targetWalletId);
      } else {
        const allCategories = [
          ...(incomeCategories || []),
          ...(expenseCategories || []),
        ];
        const selectedCategory = allCategories.find(
          (c) => c.id.toString() === data.categoryId
        );
        payload.category = parseInt(data.categoryId);
        payload.type = selectedCategory?.type?.toLowerCase() || "expense";
      }

      await createTransaction.mutateAsync(payload);
      setOpen(false);
    } catch (error) {
      console.error("Transaction error:", error)
    }
  };

  const isLoading =
    walletsLoading || categoriesLoading || createTransaction.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Type Toggle */}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="TRANSACTION">Income / Expense</TabsTrigger>
              <TabsTrigger value="TRANSFER">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      />

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">
          Amount <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={amountInput}
                onChange={handleAmountChange}
                className={cn(
                  "text-2xl font-bold pr-16",
                  errors.amount && "border-red-500"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                đ
              </span>
            </div>
          )}
        />
        {errors.amount && (
          <p className="text-sm text-red-500">{errors.amount.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source Wallet Select */}
        <div className="space-y-2">
          <Label htmlFor="wallet">
            {transactionType === "TRANSFER" ? "From wallet" : "Wallet"} <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="walletId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  className={cn(errors.walletId && "border-red-500")}
                >
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {walletsLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Loading...
                    </div>
                  ) : (
                    <>
                      {wallets?.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500 mb-3">
                            No wallets found
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setShowWalletDialog(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create new wallet
                          </Button>
                        </div>
                      ) : (
                        <>
                          {wallets?.map((wallet) => (
                            <SelectItem
                              key={wallet.id}
                              value={wallet.id.toString()}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{wallet.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatCurrency(
                                    wallet.balance,
                                    wallet.currency
                                  )}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                          <div className="p-2 border-t">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-primary"
                              onClick={() => setShowWalletDialog(true)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create new wallet
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.walletId && (
            <p className="text-sm text-red-500">{errors.walletId.message}</p>
          )}
        </div>

        {/* Target Wallet for Transfer OR Category for Normal */}
        {transactionType === "TRANSFER" ? (
          <div className="space-y-2">
            <Label htmlFor="targetWalletId">
              To wallet <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="targetWalletId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={cn(errors.targetWalletId && "border-red-500")}
                  >
                    <SelectValue placeholder="Select receiving wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.filter(w => w.id.toString() !== selectedWalletId).map((wallet) => (
                      <SelectItem
                        key={wallet.id}
                        value={wallet.id.toString()}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{wallet.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.targetWalletId && (
              <p className="text-sm text-red-500">{errors.targetWalletId.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="category">
              Danh mục <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={cn(errors.categoryId && "border-red-500")}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : (
                      <>
                        {incomeCategories?.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-green-600">
                              💰 Income
                            </SelectLabel>
                            {incomeCategories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}

                        {expenseCategories?.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-red-600">
                              💸 Expense
                            </SelectLabel>
                            {expenseCategories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}

                        {!incomeCategories?.length && !expenseCategories?.length ? (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-500 mb-3">
                              No categories found
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setShowCategoryDialog(true)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create category
                            </Button>
                          </div>
                        ) : (
                          <div className="p-2 border-t">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-primary"
                              onClick={() => setShowCategoryDialog(true)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create new category
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label htmlFor="date">
          Transaction date <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? (
                    format(field.value, "dd/MM/yyyy")
                  ) : (
                    <span>Choose date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* Note Textarea */}
      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <Textarea
              id="note"
              placeholder="Add description..."
              className="resize-none"
              rows={3}
              {...field}
            />
          )}
        />
        {errors.note && (
          <p className="text-sm text-red-500">{errors.note.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {createTransaction.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Create transaction"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>

      {/* Quick Category Creation Dialog */}
      <QuickCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onSuccess={(newCategory) => {
          // Auto-select the newly created category
          setValue("categoryId", newCategory.id.toString());
        }}
      />

      {/* Quick Wallet Creation Dialog */}
      <QuickWalletDialog
        open={showWalletDialog}
        onOpenChange={setShowWalletDialog}
        onSuccess={(newWallet) => {
          // Auto-select the newly created wallet
          setValue("walletId", newWallet.id.toString());
        }}
      />
    </form>
  );
}
