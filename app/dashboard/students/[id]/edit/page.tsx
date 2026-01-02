import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "@/components/dashboard/students/student-form";

export default async function EditStudentPage({
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

  const [studentResult, streamsResult] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    supabase
      .from("streams")
      .select(`id, name, class:classes(id, name)`)
      .order("name"),
  ]);

  if (!studentResult.data) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Student</h1>
        <p className="text-muted-foreground">Update student information</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm
            student={studentResult.data}
            streams={streamsResult.data || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
