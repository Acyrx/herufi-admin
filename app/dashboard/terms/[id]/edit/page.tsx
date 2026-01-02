import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TermForm } from "@/components/dashboard/terms/term-form";

export default async function EditTermPage({
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

  const { data: term } = await supabase
    .from("terms")
    .select("*")
    .eq("id", id)
    .single();

  if (!term) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Term</h1>
        <p className="text-muted-foreground">Update term information</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Term Information</CardTitle>
        </CardHeader>
        <CardContent>
          <TermForm term={term} />
        </CardContent>
      </Card>
    </div>
  );
}
