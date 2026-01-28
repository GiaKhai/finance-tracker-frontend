import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { budgetService } from "../services/budgetService";
import { categoryService } from "../services/categoryService";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    PieChart,
    Plus,
    Trash2,
    Loader2,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Budgets() {
    const queryClient = useQueryClient();
    const [showDialog, setShowDialog] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            category_id: "",
            amount: "",
            period: "MONTHLY",
        },
    });

    const { data: budgetsData, isLoading } = useQuery({
        queryKey: ["budgets"],
        queryFn: () => budgetService.getBudgets(),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: categoryService.getAllCategories,
    });

    // Filter only EXPENSE categories for budgeting
    const expenseCategories = categoriesData?.categories?.filter(c => c.type === 'EXPENSE') || [];

    const createMutation = useMutation({
        mutationFn: budgetService.createBudget,
        onSuccess: () => {
            queryClient.invalidateQueries(["budgets"]);
            setShowDialog(false);
            reset();
        },
        onError: (err) => {
            alert(err.response?.data?.message || "Failed to create budget");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: budgetService.deleteBudget,
        onSuccess: () => {
            queryClient.invalidateQueries(["budgets"]);
        },
    });

    const onSubmit = (data) => {
        createMutation.mutate(data);
    };

    const getProgressColor = (percent) => {
        if (percent >= 100) return "bg-red-500";
        if (percent >= 80) return "bg-yellow-500";
        return "bg-green-500";
    };

    const budgets = budgetsData?.budgets || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Budgets
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Set limits and track your spending
                    </p>
                </div>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Set Budget
                </Button>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set New Budget</DialogTitle>
                        <DialogDescription>
                            Create a spending limit for a specific category.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                onValueChange={(value) => setValue("category_id", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <span>{cat.icon}</span>
                                                <span>{cat.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category_id && <p className="text-sm text-destructive">Category is required</p>}
                            <input type="hidden" {...register("category_id", { required: true })} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Limit Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                {...register("amount", { required: "Amount is required", min: 1 })}
                                placeholder="e.g. 5000000"
                            />
                            {errors.amount && (
                                <p className="text-sm text-destructive">{errors.amount.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Budget"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading budgets...
                    </div>
                ) : budgets.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Start by setting a budget for your expenses
                            </p>
                            <Button onClick={() => setShowDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Set First Budget
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    budgets.map((budget) => {
                        const spent = parseFloat(budget.spent);
                        const limit = parseFloat(budget.amount);
                        const percent = Math.min((spent / limit) * 100, 100);
                        const isOverBudget = spent > limit;

                        return (
                            <Card key={budget.id} className="relative overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                                {budget.category_icon}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{budget.category_name}</CardTitle>
                                                <CardDescription className="text-xs">Monthly Budget</CardDescription>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                                if (confirm("Delete this budget?")) deleteMutation.mutate(budget.id)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-2 flex justify-between text-sm font-medium">
                                        <span className={isOverBudget ? "text-destructive" : "text-primary"}>
                                            {formatCurrency(spent)}
                                        </span>
                                        <span className="text-muted-foreground">
                                            / {formatCurrency(limit)}
                                        </span>
                                    </div>
                                    <Progress value={percent} className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`} indicatorClassName={getProgressColor((spent / limit) * 100)} />

                                    <div className="mt-4 flex items-center gap-2 text-xs">
                                        {isOverBudget ? (
                                            <div className="flex items-center text-destructive font-medium">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Over budget by {formatCurrency(spent - limit)}
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-green-600 font-medium">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                {formatCurrency(limit - spent)} remaining
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
