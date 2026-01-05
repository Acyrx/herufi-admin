import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  School,
  GraduationCap,
  Clock,
  Calendar,
  FileText,
  ChevronRight,
  BookMarked,
  Award,
  BarChart3,
  UserCheck,
  Sparkles,
  Shield,
  BookKey,
  Layers
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/teacher-dashboard/stat-card";
import { Progress } from "@/components/ui/progress";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "teacher") {
    redirect("/auth/login");
  }

  // Get teacher profile
  const { data: teacher } = await supabase
    .from("teachers")
    .select("*, schools(*)")
    .eq("user_id", user.id)
    .single();

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Your teacher profile has not been set up yet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              Please contact your school administrator to set up your teacher profile.
            </p>
            <form action="/auth/signout" method="post" className="w-full">
              <Button className="w-full" variant="outline">
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get teacher subjects
  const { data: teacherSubjects } = await supabase
    .from("teacher_subjects")
    .select(`
      id, 
      class_id, 
      subject_id, 
      subjects(name),
      classes(name)
    `)
    .eq("teacher_id", teacher.id);

  // Unique class IDs
  const classIds = Array.from(new Set(teacherSubjects?.map((ts) => ts.class_id).filter(Boolean)));

  // Fetch class details
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .in("id", classIds);

  // Fetch classes where teacher is class teacher
  const { data: classTeacherClasses } = await supabase
    .from("classes")
    .select("*")
    .eq("class_teacher_id", teacher.id);

  // Fetch streams (divisions) for these classes
  const { data: streams } = await supabase
    .from("streams")
    .select("id, name, class_id")
    .in("class_id", classIds);

  const streamIds = streams?.map((s) => s.id) || [];

  // Count students in all streams
  const { count: studentsCount } = await supabase
    .from("students")
    .select("*", { count: "exact" })
    .in("stream_id", streamIds);

  // Get recent assessments
  const { data: recentAssessments } = await supabase
    .from("examinations")
    .select("*, terms(name)")
    .eq("school_id", teacher.school_id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate stats
  const uniqueSubjects = new Set(teacherSubjects?.map(ts => ts.subjects?.name).filter(Boolean)).size;
  const totalStreams = streams?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="School"
            value={teacher.schools?.school_name}
            icon={<School className="h-5 w-5" />}
            variant="default"
            description="Your school"
          />
          <StatCard
            title="My Classes"
            value={classes?.length || 0}
            icon={<BookOpen className="h-5 w-5" />}
            variant="primary"
            description="Subject teacher"
            trend="+2 this term"
          />
          <StatCard
            title="Class Teacher"
            value={classTeacherClasses?.length || 0}
            icon={<GraduationCap className="h-5 w-5" />}
            variant="secondary"
            description="Classes managed"
            trend={classTeacherClasses?.length > 0 ? "Active" : "Not assigned"}
          />
          <StatCard
            title="Total Students"
            value={studentsCount || 0}
            icon={<Users className="h-5 w-5" />}
            variant="accent"
            description="Across all streams"
            trend={`${totalStreams} streams`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Class Teacher Card & Recent */}
          <div className="lg:col-span-2 space-y-6">
            {/* Class Teacher Banner */}
            {classTeacherClasses && classTeacherClasses.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Class Teacher
                        </Badge>
                        <Badge variant="outline">
                          {classTeacherClasses.length} class{classTeacherClasses.length !== 1 ? "es" : ""}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Enhanced Permissions Active</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You have full administrative access to manage all assessments, results, and student data for your assigned classes.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link href="/teacher-dashboard/class-teacher">
                          <Button className="gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Manage Classes
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href="/teacher-dashboard/students">
                          <Button variant="outline" className="gap-2">
                            <UserCheck className="h-4 w-4" />
                            View Students
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Classes & Subjects Card */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <BookMarked className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <CardTitle>My Classes & Subjects</CardTitle>
                      <CardDescription>
                        {uniqueSubjects} subjects across {classes?.length || 0} classes
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Layers className="h-3 w-3" />
                    {totalStreams} Streams
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {classes && classes.length > 0 ? (
                  <div className="space-y-4">
                    {classes.map((classItem) => {
                      const classStreams = streams?.filter((s) => s.class_id === classItem.id) || [];
                      const classSubjects = teacherSubjects
                        ?.filter((ts) => ts.class_id === classItem.id)
                        .map(ts => ts.subjects?.name) || [];

                      return (
                        <div
                          key={classItem.id}
                          className="group border rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                    {classItem.name}
                                  </h3>
                                  {classItem.section && (
                                    <p className="text-sm text-muted-foreground">Section: {classItem.section}</p>
                                  )}
                                </div>
                              </div>

                              {/* Subjects */}
                              {classSubjects.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookKey className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Subjects</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {classSubjects.map((subject, idx) => (
                                      <Badge key={idx} variant="secondary" className="gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {subject}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Streams */}
                              {classStreams.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Streams</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {classStreams.map((stream) => (
                                      <Link
                                        key={stream.id}
                                        href={`/teacher-dashboard/timetable?class=${classItem.id}&stream=${stream.id}`}
                                      >
                                        <Button variant="outline" size="sm" className="gap-1 hover:bg-primary hover:text-primary-foreground">
                                          Timetable of {stream.name}
                                          <ChevronRight className="h-3 w-3" />
                                        </Button>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2">No Classes Assigned</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't been assigned to any classes yet.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/support">
                        Contact Administrator
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}