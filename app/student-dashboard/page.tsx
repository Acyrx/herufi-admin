import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { School, Users, GraduationCap, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  // 🔐 Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 🎓 Fetch student with stream + class + school
  const { data: student } = await supabase
    .from("students")
    .select(`
      id,
      admission_number,
      first_name,
      last_name,
      date_of_birth,
      guardian_name,
      guardian_phone,
      schools (
        id,
        school_name
      ),
      streams (
        id,
        name,
        classes (
          id,
          name,
          grade_level
        )
      )
    `)
    .eq("user_id", user?.id)
    .single()

  if (!student) {
    redirect("/auth/login")
  }

  const classId = student.streams?.classes?.id ?? null

  // 👩‍🏫 Fetch teachers teaching this class
  const { data: teachers } = classId
    ? await supabase
      .from("teacher_subjects")
      .select(`
          id,
          teachers (
            first_name,
            last_name
          ),
          subjects (
            name
          )
        `)
      .eq("class_id", classId)
    : { data: [] }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {student.first_name}
          </h1>
          <p className="text-muted-foreground">
            {student.streams?.classes
              ? `Class ${student.streams.classes.name} · Stream ${student.streams.name}`
              : "No class assigned"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm">School</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="font-semibold">
              {student.schools?.school_name ?? "N/A"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm">Class</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="font-semibold">
              {student.streams?.classes?.name ?? "N/A"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm">Stream</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="font-semibold">
              {student.streams?.name ?? "N/A"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="font-semibold">
              {teachers?.length ?? 0}
            </CardContent>
          </Card>
        </div>

        {/* Teachers */}
        <Card>
          <CardHeader>
            <CardTitle>Class Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            {teachers && teachers.length > 0 ? (
              <div className="space-y-3">
                {teachers.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {t.teachers.first_name} {t.teachers.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Subject: {t.subjects.name}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {t.subjects.name}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No teachers assigned yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">
                {student.first_name} {student.last_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Admission Number</p>
              <p className="font-medium uppercase">
                {student.admission_number}
              </p>
            </div>

            {student.guardian_name && (
              <div>
                <p className="text-sm text-muted-foreground">Guardian</p>
                <p className="font-medium">{student.guardian_name}</p>
                {student.guardian_phone && (
                  <p className="text-xs text-muted-foreground">
                    {student.guardian_phone}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/student-dashboard/results">
              View Results
            </Link>
          </Button>

          <form action="/auth/signout" method="post">
            <Button variant="outline">Sign Out</Button>
          </form>
        </div>
      </main>
    </div>
  )
}
