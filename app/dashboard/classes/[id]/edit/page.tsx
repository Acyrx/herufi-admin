import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassForm } from "@/components/dashboard/classes/class-form";

export default async function EditClassPage({
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

  const [classResult, teachersResult] = await Promise.all([
    supabase.from("classes").select("*").eq("id", id).single(),
    supabase
      .from("teachers")
      .select("id, first_name, last_name")
      .order("first_name"),
  ]);

  if (!classResult.data) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Class</h1>
        <p className="text-muted-foreground">Update class information</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm
            classData={classResult.data}
            teachers={teachersResult.data || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
