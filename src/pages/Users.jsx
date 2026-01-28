import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Search,
    User,
    Shield,
    ShieldAlert,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useAuthStore } from "../store/authStore";
import DataTable from "@/components/data-table";

export default function Users() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [showDialog, setShowDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");

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
            email: "",
            password: "",
            role: "user",
        },
    });

    const { data, isLoading } = useQuery({
        queryKey: ["users", page, limit, search],
        queryFn: () => userService.getUsers({ page, limit, search }),
        keepPreviousData: true,
    });

    const createMutation = useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries(["users"]);
            setShowDialog(false);
            reset();
            setEditingUser(null);
        },
        onError: (error) => {
            const message = error.response?.data?.message || "Failed to create user";
            alert(message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["users"]);
            setShowDialog(false);
            reset();
            setEditingUser(null);
        },
        onError: (error) => {
            const message = error.response?.data?.message || "Failed to update user";
            alert(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries(["users"]);
        },
        onError: (error) => {
            const message = error.response?.data?.message || "Failed to delete user";
            alert(message);
        },
    });

    const onSubmit = (data) => {
        if (editingUser) {
            if (!data.password) delete data.password;
            updateMutation.mutate({ id: editingUser.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setValue("name", user.name);
        setValue("email", user.email);
        setValue("role", user.role);
        setValue("password", "");
        setShowDialog(true);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        reset();
        setShowDialog(true);
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "User",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {row.original.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{row.original.name}</span>
                    </div>
                ),
            },
            {
                accessorKey: "email",
                header: "Email",
            },
            {
                accessorKey: "role",
                header: "Role",
                cell: ({ row }) => (
                    <Badge
                        variant={row.original.role === "admin" ? "destructive" : "secondary"}
                        className="capitalize"
                    >
                        {row.original.role === "admin" ? (
                            <Shield className="w-3 h-3 mr-1" />
                        ) : (
                            <User className="w-3 h-3 mr-1" />
                        )}
                        {row.original.role}
                    </Badge>
                ),
            },
            {
                accessorKey: "created_at",
                header: "Joined",
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {format(new Date(row.original.created_at), "MMM d, yyyy")}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(row.original)}
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (
                                    confirm(
                                        `Delete user "${row.original.name}"? This action cannot be undone.`
                                    )
                                ) {
                                    deleteMutation.mutate(row.original.id);
                                }
                            }}
                            disabled={
                                deleteMutation.isPending || row.original.id === currentUser?.id
                            }
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [deleteMutation.isPending, currentUser?.id]
    );

    if (currentUser?.role !== "admin") {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground mt-2">
                    You do not have permission to view this page.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        User Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage system users and their permissions
                    </p>
                </div>
                <Button
                    onClick={handleAddNew}
                    className="shadow-lg hover:shadow-xl transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Users List</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9 bg-background/50"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={data?.users || []}
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
                        onPageChange={(p, l) => {
                            setPage(p);
                            setLimit(l);
                        }}
                    />
                </CardContent>
            </Card>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Update user details and permissions."
                                : "Create a new account for a user."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                {...register("name", { required: "Name is required" })}
                                placeholder="John Doe"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("email", { required: "Email is required" })}
                                placeholder="john@example.com"
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password", {
                                    required: !editingUser && "Password is required",
                                })}
                                placeholder={
                                    editingUser ? "Leave blank to keep current password" : "Secure password"
                                }
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={watch("role")}
                                onValueChange={(value) => setValue("role", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowDialog(false);
                                    reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {editingUser ? "Update User" : "Create User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
