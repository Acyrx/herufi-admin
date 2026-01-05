import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BookOpen, Award, Target } from "lucide-react"
import { StudentPerformanceCharts } from "@/components/student-performance-charts"

type SubjectStat = {
  subject: string
  average: number
  count: number
  highest: number
  lowest: number
}

export default async function StudentAnalyticsPage() {
  const supabase = await createClient()

  /* ---------------- AUTH ---------------- */
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== "student") {
    redirect("/auth/login")
  }

  /* ---------------- STUDENT ---------------- */
  const { data: student } = await supabase
    .from("students")
    .select("id, school_id")
    .eq("user_id", user.id)
    .single()

  if (!student) redirect("/auth/login")

  /* ---------------- TEST RESULTS ---------------- */
  const { data: testResults = [] } = await supabase
    .from("test_results")
    .select(`
      marks,
      tests (
        id,
        max_marks,
        subject_id,
        subjects ( name )
      )
    `)
    .eq("student_id", student.id)

  /* ---------------- EXAM RESULTS ---------------- */
  const { data: examResults = [] } = await supabase
    .from("results")
    .select(`
      score,
      subject_id,
      subjects ( name )
    `)
    .eq("student_id", student.id)

  /* ---------------- NORMALIZE SCORES ---------------- */
  const normalizedScores: {
    subject: string
    percentage: number
  }[] = []

  // Tests
  for (const r of testResults) {
    if (!r.tests) continue
    const percentage =
      (Number(r.marks) / Number(r.tests.max_marks || 100)) * 100

    normalizedScores.push({
      subject: r.tests.subjects?.name || "Unknown",
      percentage,
    })
  }

  // Exams
  for (const r of examResults) {
    normalizedScores.push({
      subject: r.subjects?.name || "Unknown",
      percentage: Number(r.score),
    })
  }

  /* ---------------- METRICS ---------------- */
  const totalResults = normalizedScores.length

  const averageScore =
    totalResults === 0
      ? 0
      : normalizedScores.reduce((a, b) => a + b.percentage, 0) / totalResults

  const highestScore =
    totalResults === 0
      ? 0
      : Math.max(...normalizedScores.map((r) => r.percentage))

  const passingRate =
    totalResults === 0
      ? 0
      : (normalizedScores.filter((r) => r.percentage >= 50).length /
        totalResults) *
      100

  /* ---------------- SUBJECT STATS ---------------- */
  const subjectMap: Record<
    string,
    { scores: number[]; count: number }
  > = {}

  for (const r of normalizedScores) {
    if (!subjectMap[r.subject]) {
      subjectMap[r.subject] = { scores: [], count: 0 }
    }
    subjectMap[r.subject].scores.push(r.percentage)
    subjectMap[r.subject].count++
  }

  const subjectStats: SubjectStat[] = Object.entries(subjectMap).map(
    ([subject, data]) => ({
      subject,
      count: data.count,
      average:
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      highest: Math.max(...data.scores),
      lowest: Math.min(...data.scores),
    })
  )

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            My Performance Analytics
          </h2>
          <p className="text-muted-foreground">
            Exams and tests you have completed
          </p>
        </div>

        {/* METRICS */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Total Assessments</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResults}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageScore.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Passing Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {passingRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Highest Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {highestScore.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CHARTS */}
        <StudentPerformanceCharts
          subjectStats={subjectStats}
          results={normalizedScores}
        />
      </main>
    </div>
  )
}
