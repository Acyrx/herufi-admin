import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function TeacherDetailPage({
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

  const { data: teacher } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .single();

  if (!teacher) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teachers">
            <Button variant="ghost" size="icon" className="bg-transparent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {teacher.first_name} {teacher.last_name}
            </h1>
            <p className="text-muted-foreground">Teacher Details</p>
          </div>
        </div>
        <Link href={`/dashboard/teachers/${id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <InfoItem label="Employee Number" value={teacher.employee_number} />
            <InfoItem
              label="Qualification"
              value={teacher.qualification || "Not specified"}
            />
            <InfoItem label="First Name" value={teacher.first_name} />
            <InfoItem label="Last Name" value={teacher.last_name} />
            <InfoItem label="Email" value={teacher.email || "Not specified"} />
            <InfoItem label="Phone" value={teacher.phone || "Not specified"} />
            <InfoItem
              label="Gender"
              value={teacher.gender || "Not specified"}
              className="capitalize"
            />
            <InfoItem
              label="Date Hired"
              value={teacher.date_hired || "Not specified"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-foreground font-medium ${className || ""}`}>
        {value}
      </p>
    </div>
  );
}
