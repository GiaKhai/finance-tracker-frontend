import { useLocation, Link } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import {
    LayoutDashboard,
    Wallet,
    Receipt,
    Tag,
    User,
    Settings,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
    const { user } = useAuthStore()
    const location = useLocation()

    const navItems = [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/wallets", label: "Wallets", icon: Wallet },
        { to: "/transactions", label: "Transactions", icon: Receipt },
        { to: "/categories", label: "Categories", icon: Tag },
        { to: "/budgets", label: "Budgets", icon: Tag },
    ]

    if (user?.role === "admin") {
        navItems.push({ to: "/users", label: "Users", icon: User })
    }

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/"
        return location.pathname.startsWith(path)
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 border-b flex items-center px-6 justify-center">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                    <Wallet className="h-6 w-6 text-primary" />
                    <span className="group-data-[collapsible=icon]:hidden">
                        FinanceTracker
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.to}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.to)}
                                        tooltip={item.label}
                                    >
                                        <Link to={item.to}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/profile")}
                                    tooltip="Profile"
                                >
                                    <Link to="/profile">
                                        <Settings className="h-4 w-4" />
                                        <span>Profile Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
