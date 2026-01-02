import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherForm } from "@/components/dashboard/teachers/teacher-form";
import { TeacherBatchUpload } from "@/components/dashboard/teachers/teacher-batch-upload";

export default async function NewTeacherPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Add Teachers</h1>
        <p className="text-muted-foreground">
          Add teachers individually or upload via spreadsheet
        </p>
      </div>

      {/* Single teacher */}
      <Card>
        <CardHeader>
          <CardTitle>Single Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm />
        </CardContent>
      </Card>

      {/* Batch upload */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Upload (Spreadsheet)</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherBatchUpload />
        </CardContent>
      </Card>
    </div>
  );
}
