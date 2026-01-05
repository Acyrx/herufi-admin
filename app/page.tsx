import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const supabase = await createClient();

  // 1. Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Redirect to login if no user session exists
  if (!user) {
    redirect("/auth/login");
  }

  // 3. Fetch user profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 4. Handle Redirection Logic
  if (profile?.role === "student") {
    redirect("/student-dashboard");
  } else if (profile?.role === "teacher") {
    redirect("/teacher-dashboard");
  } else if (profile?.role === "admin" || profile?.role === "super_admin") {
    redirect("/dashboard");
  }

  // Fallback if role is missing or unrecognized
  return (
    <div className="p-10">
      <p>Role not recognized. Please contact support.</p>
    </div>
  );
};

export default Page;