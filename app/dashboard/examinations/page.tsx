import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ExaminationsTable } from "@/components/dashboard/examinations/examinations-table";

export default async function ExaminationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: examinations } = await supabase
    .from("examinations")
    .select(
      `
      *,
      term:terms(id, name)
    `
    )
    .order("year", { ascending: false })
    .order("start_date", { ascending: false });


  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Examinations</h1>
          <p className="text-muted-foreground">
            Manage examinations and assessments
          </p>
        </div>
        <Link href="/dashboard/examinations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Examination
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Examinations</CardTitle>
        </CardHeader>
        <CardContent>
          <ExaminationsTable examinations={examinations || []} schoolId={profile?.school_id} />
        </CardContent>
      </Card>
    </div>
  );
}
