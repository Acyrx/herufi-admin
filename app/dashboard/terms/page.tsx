import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { TermsTable } from "@/components/dashboard/terms/terms-table";

export default async function TermsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: terms } = await supabase
    .from("terms")
    .select("*")
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academic Terms</h1>
          <p className="text-muted-foreground">
            Manage academic terms and semesters
          </p>
        </div>
        <Link href="/dashboard/terms/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Term
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <TermsTable terms={terms || []} />
        </CardContent>
      </Card>
    </div>
  );
}
