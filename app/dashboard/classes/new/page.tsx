import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassForm } from "@/components/dashboard/classes/class-form";

export default async function NewClassPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, first_name, last_name")
    .order("first_name");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Class</h1>
        <p className="text-muted-foreground">
          Create a new class for your school
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm teachers={teachers || []} />
        </CardContent>
      </Card>
    </div>
  );
}
