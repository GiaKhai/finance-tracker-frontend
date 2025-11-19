import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../services/categoryService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Trash2,
  Edit,
  Tag,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useForm } from "react-hook-form";

// Icon options for categories
const iconOptions = [
  { value: "🍔", label: "Food" },
  { value: "🚗", label: "Transport" },
  { value: "🏠", label: "Home" },
  { value: "💼", label: "Work" },
  { value: "🎮", label: "Entertainment" },
  { value: "🏥", label: "Health" },
  { value: "📚", label: "Education" },
  { value: "👕", label: "Shopping" },
  { value: "✈️", label: "Travel" },
  { value: "💰", label: "Salary" },
  { value: "📈", label: "Investment" },
  { value: "🎁", label: "Gift" },
];

export default function Categories() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedType, setSelectedType] = useState("EXPENSE");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

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
      type: "EXPENSE",
      icon: "🍔",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["categories", page, limit],
    queryFn: () => categoryService.getCategories({ page, limit }),
  });

  const createMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setShowDialog(false);
      reset();
      setEditingCategory(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setShowDialog(false);
      reset();
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to delete category";
      alert(message);
    },
  });

  const onSubmit = (data) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("type", category.type);
    setValue("icon", category.icon || "🍔");
    setShowDialog(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    reset();
    setShowDialog(true);
  };

  const incomeCategories =
    data?.categories?.filter((c) => c.type === "INCOME") || [];
  const expenseCategories =
    data?.categories?.filter((c) => c.type === "EXPENSE") || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading categories...</div>
      </div>
    );
  }

  const CategoryCard = ({ category }) => (
    <Card className="group hover:shadow-lg transition-all hover:border-primary/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-4xl p-2 bg-background rounded-lg shadow-sm">
              {category.icon || "📁"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{category.name}</h3>
              <Badge
                variant={category.type === "INCOME" ? "success" : "destructive"}
                className="mt-1"
              >
                {category.type}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {category.user_id !== null && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(category)}
                  className="hover:bg-primary/10"
                  title="Edit category"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete category "${category.name}"?`)) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="hover:bg-destructive/10"
                  title="Delete category"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
            {category.user_id === null && (
              <Badge variant="secondary" className="text-xs">
                Global
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Categories
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your income and expense categories
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="expense" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Expenses ({expenseCategories.length})
          </TabsTrigger>
          <TabsTrigger value="income" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Income ({incomeCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          {expenseCategories.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No expense categories
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first expense category
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          {incomeCategories.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No income categories
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first income category
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below"
                : "Add a new category to organize your transactions"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Category name is required" })}
                placeholder="e.g., Food, Transport, Salary"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Expense
                    </div>
                  </SelectItem>
                  <SelectItem value="INCOME">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Income
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={watch("icon")}
                onValueChange={(value) => setValue("icon", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{option.value}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingCategory(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
