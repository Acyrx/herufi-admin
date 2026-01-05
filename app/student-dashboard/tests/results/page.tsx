"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Download,
    Filter,
    Search,
    Award,
    FileText,
    User,
    Star,
    BarChart3,
    TrendingUp,
    Target,
    Calendar,
    Hash,
    BookOpen,
    ChevronDown,
    Eye,
    Printer,
    Share2,
    Zap,
    Trophy,
    AlertCircle,
    Users,
    ClipboardCheck,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
} from "lucide-react";

interface TestResult {
    id: string;
    student_id: string;
    student_name: string;
    test_id: string;
    test_name: string;
    type: string;
    marks: number;
    grade: string | null;
    max_marks?: number;
}

interface TestStats {
    averageMarks: number;
    highestMarks: number;
    passRate: number;
    totalStudents: number;
    testName: string;
    testType: string;
}

export default function TestResultsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const testId = searchParams.get("testId");
    const classId = searchParams.get("classId");

    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"marks" | "name" | "grade">("marks");
    const [view, setView] = useState<"detailed" | "performance">("detailed");
    const [stats, setStats] = useState<TestStats | null>(null);

    const supabase = createClient();

    const fetchTestResults = async () => {
        if (!testId && !classId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let query = supabase
                .from("test_results")
                .select(`
          id,
          marks,
          grade,
          student_id,
          students!inner(id, first_name, last_name, class_id),
          test_id,
          tests!inner(id, name, type, max_marks)
        `)
                .order("marks", { ascending: false });

            if (testId) query = query.eq("test_id", testId);
            if (classId) query = query.eq("students.class_id", classId);

            const { data, error } = await query;
            if (error) throw error;

            const mapped = (data || []).map((r: any) => ({
                id: r.id,
                student_id: r.student_id,
                student_name: `${r.students.first_name} ${r.students.last_name}`,
                test_id: r.test_id,
                test_name: r.tests.name,
                type: r.tests.type,
                marks: r.marks,
                grade: r.grade || calculateGrade(r.marks, r.tests.max_marks || 100),
                max_marks: r.tests.max_marks || 100,
            }));

            setResults(mapped);

            // Calculate statistics
            if (mapped.length > 0) {
                const testName = mapped[0].test_name;
                const testType = mapped[0].type;
                const averageMarks = mapped.reduce((sum, r) => sum + r.marks, 0) / mapped.length;
                const highestMarks = Math.max(...mapped.map(r => r.marks));
                const passingMarks = (mapped[0].max_marks || 100) * 0.4; // 40% passing threshold
                const passedStudents = mapped.filter(r => r.marks >= passingMarks).length;
                const passRate = (passedStudents / mapped.length) * 100;

                setStats({
                    averageMarks,
                    highestMarks,
                    passRate,
                    totalStudents: mapped.length,
                    testName,
                    testType,
                });

                toast.success(`Loaded ${mapped.length} test results`);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch test results");
        } finally {
            setLoading(false);
        }
    };

    const calculateGrade = (marks: number, maxMarks: number): string => {
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B";
        if (percentage >= 60) return "C";
        if (percentage >= 50) return "D";
        if (percentage >= 40) return "E";
        return "F";
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case "A+": return "bg-emerald-500/20 text-emerald-700 border-emerald-200";
            case "A": return "bg-green-500/20 text-green-700 border-green-200";
            case "B": return "bg-blue-500/20 text-blue-700 border-blue-200";
            case "C": return "bg-yellow-500/20 text-yellow-700 border-yellow-200";
            case "D": return "bg-orange-500/20 text-orange-700 border-orange-200";
            case "E": return "bg-amber-500/20 text-amber-700 border-amber-200";
            case "F": return "bg-red-500/20 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getPerformanceColor = (marks: number, maxMarks: number) => {
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 80) return "text-emerald-600";
        if (percentage >= 60) return "text-blue-600";
        if (percentage >= 40) return "text-amber-600";
        return "text-red-600";
    };

    const getPerformanceStatus = (marks: number, maxMarks: number) => {
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 80) return "Excellent";
        if (percentage >= 60) return "Good";
        if (percentage >= 40) return "Satisfactory";
        return "Needs Improvement";
    };

    useEffect(() => {
        fetchTestResults();
    }, [testId, classId]);

    // Filter and sort results
    const filteredResults = results
        .filter(result => {
            const matchesSearch = result.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                result.test_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedType === "all" || result.type === selectedType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === "marks") return b.marks - a.marks;
            if (sortBy === "name") return a.student_name.localeCompare(b.student_name);

            // Sort by grade (A+ to F)
            const gradeOrder = ["A+", "A", "B", "C", "D", "E", "F"];
            return gradeOrder.indexOf(a.grade || "F") - gradeOrder.indexOf(b.grade || "F");
        });

    // Unique test types
    const uniqueTypes = Array.from(new Set(results.map(r => r.type)));

    const handleExport = () => {
        toast.success("Test results exported successfully!");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        toast.info("Share feature coming soon!");
    };

    const handleGoBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Controls Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-40" />
                                <Skeleton className="h-10 w-40" />
                            </div>
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!testId && !classId) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Test Selected</h3>
                        <p className="text-gray-500 mb-6">
                            Please select a test or class to view results.
                        </p>
                        <Button onClick={handleGoBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (results.length === 0) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <ClipboardCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Test Results Found</h3>
                        <p className="text-gray-500 mb-6">
                            {testId
                                ? "No results have been recorded for this test yet."
                                : "No test results found for this class."
                            }
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button onClick={fetchTestResults} variant="outline">
                                <Zap className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={handleGoBack}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Go Back
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGoBack}
                            className="h-8 w-8 p-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold">Test Results</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {stats?.testName}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {stats?.testType}
                        </Badge>
                        {testId && (
                            <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                <span className="font-mono">ID: {testId.slice(0, 8)}...</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{results.length} students</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MoreVertical className="h-4 w-4 mr-2" />
                                Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Result Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleExport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Results
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Report
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Average Marks</p>
                                <p className="text-2xl font-bold">
                                    {stats?.averageMarks.toFixed(1)}/{results[0]?.max_marks || 100}
                                </p>
                                <div className="mt-2">
                                    <Progress
                                        value={(stats?.averageMarks || 0) / (results[0]?.max_marks || 100) * 100}
                                        className="h-2"
                                    />
                                </div>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Highest Marks</p>
                                <p className="text-2xl font-bold">
                                    {stats?.highestMarks.toFixed(1)}/{results[0]?.max_marks || 100}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Trophy className="h-3 w-3 text-amber-500" />
                                    <span className="text-xs text-muted-foreground">
                                        Top performer
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Trophy className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                                <p className="text-2xl font-bold">{stats?.passRate.toFixed(1)}%</p>
                                <div className="flex items-center gap-1 mt-2">
                                    {stats && stats.passRate >= 70 ? (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {stats && stats.passRate >= 70 ? "Good" : "Needs attention"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Performance</p>
                                <p className="text-2xl font-bold">
                                    {stats && stats.averageMarks >= (results[0]?.max_marks || 100) * 0.7
                                        ? "Good"
                                        : "Needs Work"
                                    }
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Target className="h-3 w-3 text-purple-500" />
                                    <span className="text-xs text-muted-foreground">
                                        Class average
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Target className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Test Performance</CardTitle>
                            <CardDescription>
                                {classId ? `Class ${classId} • ` : ""}
                                {filteredResults.length} results • Max marks: {results[0]?.max_marks || 100}
                            </CardDescription>
                        </div>

                        <Tabs
                            defaultValue="detailed"
                            className="w-full sm:w-auto"
                            onValueChange={(value) => setView(value as any)}
                        >
                            <TabsList>
                                <TabsTrigger value="detailed">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Detailed View
                                </TabsTrigger>
                                <TabsTrigger value="performance">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Performance
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students or tests..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {uniqueTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="marks">Highest Marks</SelectItem>
                                    <SelectItem value="name">Student Name</SelectItem>
                                    <SelectItem value="grade">Grade</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {view === "detailed" ? (
                        // Detailed Results Table
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Rank</TableHead>
                                        <TableHead className="w-[250px]">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Student
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Test
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Type
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Marks
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4" />
                                                Grade
                                            </div>
                                        </TableHead>
                                        <TableHead>Performance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredResults.map((result, index) => (
                                        <TableRow key={result.id} className="hover:bg-muted/50 group">
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <Badge
                                                        variant={index < 3 ? "default" : "outline"}
                                                        className={`
                              ${index === 0 ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                              ${index === 1 ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                              ${index === 2 ? "bg-orange-100 text-orange-800 border-orange-200" : ""}
                              font-bold
                            `}
                                                    >
                                                        #{index + 1}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{result.student_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    ID: {result.student_id.slice(0, 8)}...
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{result.test_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    ID: {result.test_id.slice(0, 8)}...
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {result.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className={`font-bold ${getPerformanceColor(result.marks, result.max_marks || 100)}`}>
                                                        {result.marks.toFixed(1)}/{result.max_marks || 100}
                                                    </div>
                                                    <Progress
                                                        value={(result.marks / (result.max_marks || 100)) * 100}
                                                        className="h-1"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`${getGradeColor(result.grade || "")} font-medium`}
                                                >
                                                    {result.grade}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">
                                                        {getPerformanceStatus(result.marks, result.max_marks || 100)}
                                                    </span>
                                                    {result.marks >= (result.max_marks || 100) * 0.8 ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : result.marks >= (result.max_marks || 100) * 0.4 ? (
                                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        // Performance Cards View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredResults.map((result, index) => (
                                <Card key={result.id} className="relative overflow-hidden">
                                    {index < 3 && (
                                        <div className={`
                      absolute top-0 right-0 w-8 h-8 flex items-center justify-center
                      ${index === 0 ? "bg-amber-500" : ""}
                      ${index === 1 ? "bg-gray-500" : ""}
                      ${index === 2 ? "bg-orange-500" : ""}
                      text-white text-xs font-bold
                    `}>
                                            #{index + 1}
                                        </div>
                                    )}
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-full">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">{result.student_name}</h3>
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {result.test_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Score:</span>
                                                    <div className={`text-lg font-bold ${getPerformanceColor(result.marks, result.max_marks || 100)}`}>
                                                        {result.marks.toFixed(1)}/{result.max_marks || 100}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Percentage:</span>
                                                        <span className="font-medium">
                                                            {((result.marks / (result.max_marks || 100)) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={(result.marks / (result.max_marks || 100)) * 100}
                                                        className="h-2"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">Grade</p>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${getGradeColor(result.grade || "")} w-full justify-center`}
                                                    >
                                                        {result.grade}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">Status</p>
                                                    <div className={`
                            text-xs px-2 py-1 rounded-full text-center font-medium
                            ${getPerformanceStatus(result.marks, result.max_marks || 100) === "Excellent" ? "bg-emerald-100 text-emerald-800" : ""}
                            ${getPerformanceStatus(result.marks, result.max_marks || 100) === "Good" ? "bg-blue-100 text-blue-800" : ""}
                            ${getPerformanceStatus(result.marks, result.max_marks || 100) === "Satisfactory" ? "bg-amber-100 text-amber-800" : ""}
                            ${getPerformanceStatus(result.marks, result.max_marks || 100) === "Needs Improvement" ? "bg-red-100 text-red-800" : ""}
                          `}>
                                                        {getPerformanceStatus(result.marks, result.max_marks || 100)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>

                {view === "detailed" && (
                    <CardFooter className="border-t pt-4">
                        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                            <div>
                                Showing {filteredResults.length} of {results.length} results
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span>Excellent (&gt;80%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span>Good (60-80%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span>Needs Work (&lt;40%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}