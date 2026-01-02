import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectForm } from "@/components/dashboard/subjects/subject-form";

export default async function EditSubjectPage({
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

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .single();

  if (!subject) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Subject</h1>
        <p className="text-muted-foreground">Update subject information</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Subject Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectForm subject={subject} />
        </CardContent>
      </Card>
    </div>
  );
}
