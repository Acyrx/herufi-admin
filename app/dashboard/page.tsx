import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Users,
  UserCog,
  School,
  BookOpen,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch counts
  const [
    studentsResult,
    teachersResult,
    classesResult,
    subjectsResult,
    examsResult,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase.from("examinations").select("id", { count: "exact", head: true }),
  ]);

  const stats = {
    students: studentsResult.count || 0,
    teachers: teachersResult.count || 0,
    classes: classesResult.count || 0,
    subjects: subjectsResult.count || 0,
    exams: examsResult.count || 0,
  };

  // Fetch recent students
  const { data: recentStudents } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch recent teachers
  const { data: recentTeachers } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your school management dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.students}
          icon={<Users className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Teachers"
          value={stats.teachers}
          icon={<UserCog className="h-6 w-6" />}
        />
        <StatsCard
          title="Classes"
          value={stats.classes}
          icon={<School className="h-6 w-6" />}
        />
        <StatsCard
          title="Subjects"
          value={stats.subjects}
          icon={<BookOpen className="h-6 w-6" />}
        />
        <StatsCard
          title="Examinations"
          value={stats.exams}
          icon={<ClipboardList className="h-6 w-6" />}
        />
      </div>

      {/* Recent Data */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recent Students</CardTitle>
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentStudents && recentStudents.length > 0 ? (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Admission: {student.admission_number}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {student.gender || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No students added yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Teachers */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recent Teachers</CardTitle>
            <UserCog className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentTeachers && recentTeachers.length > 0 ? (
              <div className="space-y-3">
                {recentTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {teacher.first_name} {teacher.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {teacher.qualification || "No qualification"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {teacher.employee_number}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No teachers added yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
