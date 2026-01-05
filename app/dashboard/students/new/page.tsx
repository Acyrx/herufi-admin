import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentBatchUpload } from "@/components/dashboard/students/student-batch-upload";
import { StudentForm } from "@/components/dashboard/students/student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch streams with class info for the form
  const { data: streams } = await supabase
    .from("streams")
    .select(
      `
      id,
      name,
      class:classes(id, name)
    `
    )
    .order("name");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Student</h1>
        <p className="text-muted-foreground">
          Enter student details to create a new record
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm streams={streams || []} />
        </CardContent>
      </Card>

      {/* Batch upload */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Upload (Spreadsheet)</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentBatchUpload streams={streams || []} />
        </CardContent>
      </Card>

    </div>
  );
}
