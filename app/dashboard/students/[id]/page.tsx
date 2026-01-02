import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function StudentDetailPage({
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

  const { data: student } = await supabase
    .from("students")
    .select(
      `
      *,
      stream:streams(
        id,
        name,
        class:classes(id, name)
      )
    `
    )
    .eq("id", id)
    .single();

  if (!student) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students">
            <Button variant="ghost" size="icon" className="bg-transparent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-muted-foreground">Student Details</p>
          </div>
        </div>
        <Link href={`/dashboard/students/${id}/edit`}>
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
            <InfoItem
              label="Admission Number"
              value={student.admission_number}
            />
            <InfoItem
              label="Class"
              value={
                student.stream?.class?.name
                  ? `${student.stream.class.name}${
                      student.stream?.name ? ` (${student.stream.name})` : ""
                    }`
                  : "Not assigned"
              }
            />
            <InfoItem label="First Name" value={student.first_name} />
            <InfoItem label="Last Name" value={student.last_name} />
            <InfoItem
              label="Date of Birth"
              value={student.date_of_birth || "Not specified"}
            />
            <InfoItem
              label="Gender"
              value={student.gender || "Not specified"}
              className="capitalize"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Guardian Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <InfoItem
              label="Guardian Name"
              value={student.guardian_name || "Not specified"}
            />
            <InfoItem
              label="Guardian Phone"
              value={student.guardian_phone || "Not specified"}
            />
          </div>
          <InfoItem
            label="Address"
            value={student.address || "Not specified"}
          />
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
