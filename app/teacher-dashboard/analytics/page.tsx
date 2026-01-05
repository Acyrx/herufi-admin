"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  BookOpen,
  Calendar,
  Filter,
  Download,
  Eye,
  School,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Percent,
  Calculator,
  Star,
} from "lucide-react";

const supabase = createClient();

interface PerformanceRow {
  subject_name: string;
  class_name: string;
  assessment_name: string;
  assessment_type: "test" | "exam" | "assignment";
  year?: string;
  term?: string;
  max_marks?: number;
  submissions: number;
  avg_score: number | null;
  top_score: number | null;
  lowest_score: number | null;
  date: string;
}

interface SummaryStats {
  totalAssessments: number;
  totalSubmissions: number;
  avgClassPerformance: number;
  bestSubject: string;
  weakestSubject: string;
  overallAvg: number;
}

export default function TeacherAnalysisPage() {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>("");
  const [performance, setPerformance] = useState<PerformanceRow[]>([]);
  const [filteredPerformance, setFilteredPerformance] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Available options for filters
  const [years, setYears] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get logged-in teacher
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;

        const { data: teacher } = await supabase
          .from("teachers")
          .select("id, first_name, last_name")
          .eq("user_id", authData.user.id)
          .single();

        if (!teacher) return;

        setTeacherId(teacher.id);
        setTeacherName(`${teacher.first_name} ${teacher.last_name}`);

        // 2️⃣ Fetch all test results for this teacher
        const { data: testsData } = await supabase
          .from("tests")
          .select(`
            id,
            name,
            type,
            max_marks,
            class_id,
            teacher_id,
            created_at,
            subjects(name),
            classes(name),
            test_results(marks, created_at)
          `)
          .eq("teacher_id", teacher.id);

        // 3️⃣ Fetch all exam results for this teacher
        const { data: examResults } = await supabase
          .from("results")
          .select(`
            id,
            score,
            subject_id,
            teacher_id,
            created_at,
            subjects(name),
            examinations(name, year, term_id, terms(name)),
            students(id, first_name, last_name, stream_id,
              streams(
                class_id,
                classes(name)
              )
            )
          `)
          .eq("teacher_id", teacher.id);

        // 4️⃣ Map tests
        const testRows: PerformanceRow[] = testsData?.map((t: any) => {
          const marks: number[] = t.test_results?.map((r: any) => Number(r.marks)) || [];
          const date = new Date(t.created_at);
          return {
            subject_name: t.subjects.name,
            class_name: t.classes.name,
            assessment_name: t.name,
            assessment_type: t.type as "test" | "exam" | "assignment",
            max_marks: Number(t.max_marks),
            submissions: marks.length,
            avg_score: marks.length
              ? Number((marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1))
              : null,
            top_score: marks.length ? Math.max(...marks) : null,
            lowest_score: marks.length ? Math.min(...marks) : null,
            date: date.toISOString().split('T')[0],
            year: date.getFullYear().toString(),
            term: "Not specified"
          };
        }) || [];

        // 5️⃣ Map exam results
        const examRows: PerformanceRow[] = examResults?.map((r: any) => {
          const date = new Date(r.created_at);
          return {
            subject_name: r.subjects.name,
            class_name: r.students?.streams?.classes?.name || "-",
            assessment_name: `${r.examinations.name}`,
            assessment_type: "exam",
            submissions: 1,
            avg_score: Number(r.score),
            top_score: Number(r.score),
            lowest_score: Number(r.score),
            date: date.toISOString().split('T')[0],
            year: r.examinations.year,
            term: r.examinations.terms?.name || "Not specified"
          };
        }) || [];

        const allData = [...testRows, ...examRows];
        setPerformance(allData);
        setFilteredPerformance(allData);

        // Extract filter options
        const uniqueYears = Array.from(new Set(allData.map(p => p.year).filter(Boolean))) as string[];
        const uniqueTerms = Array.from(new Set(allData.map(p => p.term).filter(Boolean))) as string[];
        const uniqueSubjects = Array.from(new Set(allData.map(p => p.subject_name).filter(Boolean))) as string[];
        const uniqueClasses = Array.from(new Set(allData.map(p => p.class_name).filter(Boolean))) as string[];

        setYears(uniqueYears);
        setTerms(uniqueTerms);
        setSubjects(uniqueSubjects);
        setClasses(uniqueClasses);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = performance;

    if (yearFilter !== "all") {
      filtered = filtered.filter(p => p.year === yearFilter);
    }

    if (termFilter !== "all") {
      filtered = filtered.filter(p => p.term === termFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(p => p.assessment_type === typeFilter);
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter(p => p.subject_name === subjectFilter);
    }

    if (classFilter !== "all") {
      filtered = filtered.filter(p => p.class_name === classFilter);
    }

    setFilteredPerformance(filtered);
  }, [yearFilter, termFilter, typeFilter, subjectFilter, classFilter, performance]);

  // Calculate summary statistics
  const calculateSummary = (): SummaryStats => {
    const totalAssessments = filteredPerformance.length;
    const totalSubmissions = filteredPerformance.reduce((sum, p) => sum + p.submissions, 0);

    const validScores = filteredPerformance.filter(p => p.avg_score !== null);
    const overallAvg = validScores.length > 0
      ? validScores.reduce((sum, p) => sum + (p.avg_score || 0), 0) / validScores.length
      : 0;

    // Group by subject
    const subjectPerformance = filteredPerformance.reduce((acc, p) => {
      if (!acc[p.subject_name]) {
        acc[p.subject_name] = { total: 0, count: 0 };
      }
      if (p.avg_score !== null) {
        acc[p.subject_name].total += p.avg_score;
        acc[p.subject_name].count++;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const subjectAverages = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? data.total / data.count : 0
    }));

    const bestSubject = subjectAverages.length > 0
      ? subjectAverages.reduce((a, b) => a.average > b.average ? a : b).subject
      : "N/A";

    const weakestSubject = subjectAverages.length > 0
      ? subjectAverages.reduce((a, b) => a.average < b.average ? a : b).subject
      : "N/A";

    return {
      totalAssessments,
      totalSubmissions,
      avgClassPerformance: overallAvg,
      bestSubject,
      weakestSubject,
      overallAvg
    };
  };

  const summary = calculateSummary();

  // Chart data preparations
  const subjectPerformanceData = filteredPerformance.reduce((acc, p) => {
    if (!acc[p.subject_name]) {
      acc[p.subject_name] = { total: 0, count: 0 };
    }
    if (p.avg_score !== null) {
      acc[p.subject_name].total += p.avg_score;
      acc[p.subject_name].count++;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const subjectChartData = Object.entries(subjectPerformanceData).map(([subject, data]) => ({
    subject,
    average: data.count > 0 ? data.total / data.count : 0
  }));

  const classPerformanceData = filteredPerformance.reduce((acc, p) => {
    if (!acc[p.class_name]) {
      acc[p.class_name] = { total: 0, count: 0 };
    }
    if (p.avg_score !== null) {
      acc[p.class_name].total += p.avg_score;
      acc[p.class_name].count++;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const classChartData = Object.entries(classPerformanceData).map(([className, data]) => ({
    className,
    average: data.count > 0 ? data.total / data.count : 0
  }));

  const assessmentTypeData = filteredPerformance.reduce((acc, p) => {
    if (!acc[p.assessment_type]) {
      acc[p.assessment_type] = { total: 0, count: 0 };
    }
    if (p.avg_score !== null) {
      acc[p.assessment_type].total += p.avg_score;
      acc[p.assessment_type].count++;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const typeChartData = Object.entries(assessmentTypeData).map(([type, data]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    average: data.count > 0 ? data.total / data.count : 0,
    count: data.count
  }));

  // Time series data (by month)
  const monthlyData = filteredPerformance.reduce((acc, p) => {
    const date = new Date(p.date);
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!acc[month]) {
      acc[month] = { total: 0, count: 0 };
    }
    if (p.avg_score !== null) {
      acc[month].total += p.avg_score;
      acc[month].count++;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const timeSeriesData = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      average: data.count > 0 ? data.total / data.count : 0,
      assessments: data.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Teacher Not Found</AlertTitle>
          <AlertDescription>
            Unable to find teacher information. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Performance Analytics
                </span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Teacher:</span>
                <Badge variant="outline" className="gap-1">
                  <School className="h-3 w-3" />
                  {teacherName}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Filter Analysis</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={termFilter} onValueChange={setTermFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map(term => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="test">Tests</SelectItem>
                  <SelectItem value="exam">Exams</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                </SelectContent>
              </Select>

              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Assessments</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{summary.totalAssessments}</div>
            <p className="text-xs text-blue-600 mt-1">
              Across {subjects.length} subjects • {classes.length} classes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Submissions</CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{summary.totalSubmissions}</div>
            <Progress value={100} className="mt-2 h-1.5" />
            <p className="text-xs text-green-600 mt-1">
              Student participation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Average Performance</CardTitle>
            <div className="p-2 rounded-lg bg-orange-100">
              <Percent className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {summary.overallAvg.toFixed(1)}%
            </div>
            <Progress value={summary.overallAvg} className="mt-2 h-1.5" />
            <p className="text-xs text-orange-600 mt-1">
              Overall student achievement
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Best Subject</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <Award className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-900 truncate">
              {summary.bestSubject}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              vs {summary.weakestSubject} (weakest)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subject Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>
              Average scores across different subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                <Legend />
                <Bar dataKey="average" fill="#8884d8" name="Average Score (%)" radius={[4, 4, 0, 0]}>
                  {subjectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Assessment Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Assessment Distribution
            </CardTitle>
            <CardDescription>
              Breakdown by assessment type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {typeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} assessments`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Performance Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Class Performance Comparison
            </CardTitle>
            <CardDescription>
              Performance across different classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={classChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="className" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Average Score"
                  dataKey="average"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Series Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Performance Over Time
            </CardTitle>
            <CardDescription>
              Monthly average performance trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name="Average Score (%)"
                />
                <Line
                  type="monotone"
                  dataKey="assessments"
                  stroke="#ff7300"
                  name="Assessments"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detailed Assessment Performance
              </CardTitle>
              <CardDescription>
                Showing {filteredPerformance.length} assessments
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Filtered Results
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead className="text-center">Average</TableHead>
                  <TableHead className="text-center">Top Score</TableHead>
                  <TableHead className="text-center">Lowest</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerformance.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <BookOpen className="h-3 w-3" />
                          {p.subject_name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{p.class_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{p.assessment_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.year} • {p.term}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        p.assessment_type === "exam" ? "default" :
                          p.assessment_type === "test" ? "secondary" : "outline"
                      }>
                        {p.assessment_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />
                        {p.submissions}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`font-bold ${(p.avg_score || 0) >= 70 ? 'text-green-600' : (p.avg_score || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {p.avg_score ? `${p.avg_score.toFixed(1)}%` : "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700">
                        <Star className="h-3 w-3" />
                        {p.top_score ? `${p.top_score.toFixed(1)}%` : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1 bg-red-50 text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        {p.lowest_score ? `${p.lowest_score.toFixed(1)}%` : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {p.date}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Showing {filteredPerformance.length} of {performance.length} total assessments
          </div>
        </CardFooter>
      </Card>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 p-4 rounded-lg border bg-blue-50/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold">Strengths</h4>
              </div>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Best performing subject: <strong>{summary.bestSubject}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Average student performance: <strong>{summary.overallAvg.toFixed(1)}%</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Total assessments conducted: <strong>{summary.totalAssessments}</strong></span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 p-4 rounded-lg border bg-yellow-50/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <h4 className="font-semibold">Areas for Improvement</h4>
              </div>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-yellow-600" />
                  <span>Weakest subject: <strong>{summary.weakestSubject}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  <span>Consider more frequent assessments in weaker areas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calculator className="h-3 w-3 text-yellow-600" />
                  <span>Focus on assessment variety to engage different learners</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 p-4 rounded-lg border bg-purple-50/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold">Recommendations</h4>
              </div>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  <span>Increase practice tests for {summary.weakestSubject}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-purple-600" />
                  <span>Consider group activities for collaborative learning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="h-3 w-3 text-purple-600" />
                  <span>Recognize top performers to motivate others</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}