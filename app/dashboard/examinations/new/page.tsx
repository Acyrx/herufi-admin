import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExaminationForm } from "@/components/dashboard/examinations/examination-form";

export default async function NewExaminationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: terms } = await supabase
    .from("terms")
    .select("id, name")
    .order("start_date", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Add New Examination
        </h1>
        <p className="text-muted-foreground">Create a new examination</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Examination Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExaminationForm terms={terms || []} />
        </CardContent>
      </Card>
    </div>
  );
}
