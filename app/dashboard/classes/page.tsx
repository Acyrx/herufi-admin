import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ClassesTable } from "@/components/dashboard/classes/classes-table";

export default async function ClassesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: classes } = await supabase
    .from("classes")
    .select(
      `
      *,
      class_teacher:teachers(id, first_name, last_name),
      streams(id, name)
    `
    )
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground">Manage classes and streams</p>
        </div>
        <Link href="/dashboard/classes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassesTable classes={classes || []} />
        </CardContent>
      </Card>
    </div>
  );
}
