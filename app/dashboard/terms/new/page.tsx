import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TermForm } from "@/components/dashboard/terms/term-form";

export default async function NewTermPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Term</h1>
        <p className="text-muted-foreground">Create a new academic term</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Term Information</CardTitle>
        </CardHeader>
        <CardContent>
          <TermForm />
        </CardContent>
      </Card>
    </div>
  );
}
