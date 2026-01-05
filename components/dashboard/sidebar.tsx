"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCog,
  School,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);

  // Responsive: collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (windowWidth < 768) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [windowWidth]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // Decide nav items based on dashboard path
  let navItems = [];
  if (pathname.startsWith("/student-dashboard")) {
    navItems = [
      { href: "/student-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/student-dashboard/profile", label: "Profile", icon: Users },
      { href: "/student-dashboard/examinations", label: "Examinations", icon: ClipboardList },
      { href: "/student-dashboard/classes", label: "Classes", icon: School },
      { href: "/student-dashboard/tests", label: "Tests", icon: BookOpen },
      { href: "/student-dashboard/analytics", label: "Analytics", icon: BookOpen },
    ];
  } else if (pathname.startsWith("/teacher-dashboard")) {
    navItems = [
      { href: "/teacher-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/teacher-dashboard/class-teacher", label: "Classes", icon: School },
      { href: "/teacher-dashboard/analytics", label: "Analytics", icon: BookOpen },
      { href: "/teacher-dashboard/examinations", label: "Examinations", icon: ClipboardList },
      { href: "/teacher-dashboard/tests", label: "Tests", icon: FileText },
      { href: "/teacher-dashboard/profile", label: "Profile", icon: Settings },
    ];
  } else {
    navItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/students", label: "Students", icon: Users },
      { href: "/dashboard/teachers", label: "Teachers", icon: UserCog },
      { href: "/dashboard/classes", label: "Classes", icon: School },
      { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
      { href: "/dashboard/terms", label: "Terms", icon: Calendar },
      { href: "/dashboard/examinations", label: "Examinations", icon: ClipboardList },
      { href: "/dashboard/results", label: "Results", icon: FileText },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 fixed md:relative z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + Collapse Button */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b border-sidebar-border transition-all",
          collapsed ? "flex-col items-center gap-2" : "flex-row"
        )}
      >
        {/* Logo */}
        <Link
          href={navItems[0].href}
          className={cn(
            "flex items-center gap-2 transition-all",
            collapsed && "flex-col"
          )}
        >
          <GraduationCap className="h-8 w-8 text-sidebar-primary flex-shrink-0" />
          {!collapsed && <span className="text-lg font-bold text-sidebar-foreground">Herufi</span>}
        </Link>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 transition-all",
            collapsed ? "" : ""
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>


      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== navItems[0].href && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
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
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
