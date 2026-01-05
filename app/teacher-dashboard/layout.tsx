import type React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import type { Profile, School } from "@/lib/types";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Fetch user profile and school
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const { data: teacher } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user.id)
        .single();

    let school: School | null = null;
    if (profile?.school_id) {
        const { data: schoolData } = await supabase
            .from("schools")
            .select("*")
            .eq("id", profile.school_id)
            .single();
        school = schoolData;
    }

    // Only allow super_admin or admin
    if (profile?.role === "student") {
        // Logout the user
        await supabase.auth.signOut();
        redirect("/auth/login");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader profile={profile as Profile} school={school} teacher={teacher} />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
