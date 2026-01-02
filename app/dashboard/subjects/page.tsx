import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubjectsTable } from "@/components/dashboard/subjects/subjects-table";

export default async function SubjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground">
            Manage school subjects and curriculum
          </p>
        </div>
        <Link href="/dashboard/subjects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">All Subjects</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                className="w-64 pl-9 bg-secondary border-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SubjectsTable subjects={subjects || []} />
        </CardContent>
      </Card>
    </div>
  );
}
