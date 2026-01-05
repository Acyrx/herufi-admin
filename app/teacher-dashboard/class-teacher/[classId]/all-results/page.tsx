import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ClassAllResultsTable } from "@/components/class-all-results-table"

export default async function ClassAllResultsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== "teacher") {
    redirect("/auth/login")
  }

  const { data: teacher } = await supabase.from("teachers").select("*").eq("user_id", user.id).single()

  if (!teacher) {
    redirect("/auth/login")
  }

  // Verify teacher is class teacher for this class
  const { data: classInfo } = await supabase.from("classes").select("*").eq("id", classId).single()

  if (!classInfo || classInfo.class_teacher_id !== teacher.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              You do not have permission to view results for this class.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get all assessments for this class
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*, subjects(name), teachers(first_name, last_name)")
    .eq("class_id", classId)
    .order("created_at", { ascending: false })

  // Get all students in the class
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("*, students(id, first_name, last_name, email)")
    .eq("class_id", classId)

  const students = enrollments?.map((e) => e.students) || []

  // Get all results for this class
  const assessmentIds = assessments?.map((a) => a.id) || []
  const studentIds = students.map((s) => s.id)

  const { data: results } = await supabase
    .from("student_results")
    .select("*")
    .in("assessment_id", assessmentIds.length > 0 ? assessmentIds : [""])
    .in("student_id", studentIds.length > 0 ? studentIds : [""])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/teacher-dashboard/class-teacher">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class Teacher Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {classInfo.name} - All Results
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {classInfo.subject} - Grade {classInfo.grade}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClassAllResultsTable
              students={students}
              assessments={assessments || []}
              results={results || []}
              classId={classId}
              teacherId={teacher.id}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
