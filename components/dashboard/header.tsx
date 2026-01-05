"use client"

import type { Profile, School } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"

interface DashboardHeaderProps {
  profile?: Profile | null
  student?: Profile | null
  teacher?: Profile | null
  school?: School | null
}

export function DashboardHeader({
  profile,
  student,
  teacher,
  school,
}: DashboardHeaderProps) {
  const pathname = usePathname()

  // 🔹 Resolve role
  const role: "student" | "teacher" | "admin" = (() => {
    if (pathname.startsWith("/student-dashboard")) return "student"
    if (pathname.startsWith("/teacher-dashboard")) return "teacher"
    return "admin"
  })()

  // 🔹 Pick active user object
  const activeUser: Profile | null =
    role === "student" ? student :
      role === "teacher" ? teacher :
        profile

  // 🔹 Resolve display name
  const displayName = (() => {
    if (!activeUser) return "User"

    // Admin
    if (role === "admin" && activeUser.full_name) {
      return activeUser.full_name
    }

    // Teacher / Student
    if (activeUser.first_name || activeUser.last_name) {
      return [activeUser.first_name, activeUser.last_name]
        .filter(Boolean)
        .join(" ")
    }

    // Student fallback
    // if (role === "student" && activeUser.admission_number) {
    //   return activeUser.admission_number.toUpperCase()
    // }

    // // Email fallback
    // if (activeUser.email) {
    //   return activeUser.email.split("@")[0]
    // }

    return "User"
  })()

  // 🔹 Initials
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {school?.school_name || "My School"}
        </span>
      </div>

      <div className="flex items-center gap-4">

        {/* User */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {role}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
