import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, Users, ClipboardList } from "lucide-react"

export default async function ClassTeacherDashboardPage() {
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

  // Get classes where this teacher is the class teacher
  const { data: classTeacherClasses } = await supabase
    .from("classes")
    .select("*")
    .eq("class_teacher_id", teacher.id)
    .order("name")

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold">Class Teacher Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {teacher.first_name} {teacher.last_name}
              </p>
            </div>
          </div>
          <Link href="/teacher-dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Classes as Class Teacher</h2>
          <p className="text-muted-foreground">
            You have full permission to manage all results and assessments for these classes
          </p>
        </div>

        {classTeacherClasses && classTeacherClasses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classTeacherClasses.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {classItem.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {classItem.subject} - Grade {classItem.grade}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/teacher-dashboard/class-teacher/${classItem.id}/all-results`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      View All Results
                    </Button>
                  </Link>
                  <Link href={`/teacher-dashboard/class-teacher/${classItem.id}/students`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Users className="h-4 w-4 mr-2" />
                      View Students
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You are not assigned as a class teacher for any classes yet. Contact your school administrator to be
              assigned as a class teacher.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
