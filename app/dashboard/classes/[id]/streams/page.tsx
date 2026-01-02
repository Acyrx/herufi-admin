import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StreamsManager } from "@/components/dashboard/classes/streams-manager";

export default async function StreamsPage({
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

  const { data: classData } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .single();

  if (!classData) {
    notFound();
  }

  const { data: streams } = await supabase
    .from("streams")
    .select("*")
    .eq("class_id", id)
    .order("name");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/classes">
          <Button variant="ghost" size="icon" className="bg-transparent">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Streams for {classData.name}
          </h1>
          <p className="text-muted-foreground">
            Manage class streams/divisions
          </p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Class Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <StreamsManager classId={id} streams={streams || []} />
        </CardContent>
      </Card>
    </div>
  );
}
