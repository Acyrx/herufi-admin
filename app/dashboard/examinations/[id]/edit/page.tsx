import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExaminationForm } from "@/components/dashboard/examinations/examination-form";

export default async function EditExaminationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [examResult, termsResult] = await Promise.all([
    supabase.from("examinations").select("*").eq("id", id).single(),
    supabase
      .from("terms")
      .select("id, name")
      .order("start_date", { ascending: false }),
  ]);

  if (!examResult.data) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Examination</h1>
        <p className="text-muted-foreground">Update examination information</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Examination Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExaminationForm
            examination={examResult.data}
            terms={termsResult.data || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
