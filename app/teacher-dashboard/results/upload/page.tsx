import UploadResultsPage from '@/components/teacher-dashboard/results-uploading'
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return (
    <UploadResultsPage userId={teacher?.id} />
  )
}

