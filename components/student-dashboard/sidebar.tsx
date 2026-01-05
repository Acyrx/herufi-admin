"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    GraduationCap,
    LayoutDashboard,
    Users,
    School,
    BookOpen,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const navItems = [
    { href: "/student-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student-dashboard/profile", label: "Profile", icon: Users },
    { href: "/student-dashboard/examinations", label: "Examinations", icon: ClipboardList },
    { href: "/student-dashboard/test", label: "Classes", icon: School },
    { href: "/student-dashboard/analytics", label: "Subjects", icon: BookOpen },
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <aside
            className={cn(
                "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <GraduationCap
                        className={cn(
                            "flex-shrink-0",
                            collapsed ? "h-6 w-6" : "h-8 w-8"
                        )}
                    />
                    {!collapsed && (
                        <span className="text-lg font-bold text-sidebar-foreground">
                            Herufi
                        </span>
                    )}
                </Link>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-primary"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                                collapsed && "justify-center px-0"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon
                                className={cn(
                                    "flex-shrink-0",
                                    collapsed ? "h-6 w-6" : "h-5 w-5"
                                )}
                            />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Sign Out */}
            <div className="p-2 border-t border-sidebar-border">
                <button
                    onClick={handleSignOut}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <LogOut
                        className={cn(
                            "flex-shrink-0",
                            collapsed ? "h-6 w-6" : "h-5 w-5"
                        )}
                    />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
