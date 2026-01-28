import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { userService } from "../services/userService";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, Save, Loader2 } from "lucide-react";

export default function Profile() {
    const { user, setUser } = useAuthStore();
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const profileForm = useForm({
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
        },
    });

    const passwordForm = useForm({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onUpdateProfile = async (data) => {
        try {
            setIsUpdatingProfile(true);
            const response = await userService.updateProfile(data);
            setUser(response.user);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const onUpdatePassword = async (data) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        try {
            setIsUpdatingPassword(true);
            await userService.updatePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success("Password updated successfully");
            passwordForm.reset();
        } catch (error) {
            toast.error(error.response?.data?.message || "Password update failed");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 px-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{user?.name}</h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Information */}
                <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">
                            Update your display name and email address
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                                <Input
                                    id="name"
                                    className="bg-background/50 focus:ring-primary/20 transition-all"
                                    {...profileForm.register("name", { required: true })}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="bg-background/50 focus:ring-primary/20 transition-all"
                                    {...profileForm.register("email", { required: true })}
                                    placeholder="name@example.com"
                                />
                            </div>
                            <Button type="submit" className="w-full font-bold shadow-sm" disabled={isUpdatingProfile}>
                                {isUpdatingProfile ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Management */}
                <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Lock className="h-5 w-5 text-primary" />
                            Change Password
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">
                            Ensure your account is protected with a secure password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" className="text-sm font-semibold">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    className="bg-background/50 focus:ring-primary/20 transition-all"
                                    {...passwordForm.register("currentPassword", { required: true })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-sm font-semibold">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    className="bg-background/50 focus:ring-primary/20 transition-all"
                                    {...passwordForm.register("newPassword", { required: true, minLength: 6 })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    className="bg-background/50 focus:ring-primary/20 transition-all"
                                    {...passwordForm.register("confirmPassword", { required: true })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <Button type="submit" variant="outline" className="w-full font-bold shadow-sm border-primary/20 hover:bg-primary/5" disabled={isUpdatingPassword}>
                                {isUpdatingPassword ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Lock className="h-4 w-4 mr-2" />
                                )}
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
