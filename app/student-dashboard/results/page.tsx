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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Download,
    Filter,
    Search,
    Award,
    BookOpen,
    User,
    Star,
    BarChart3,
    TrendingUp,
    Target,
    Calendar,
    Hash,
    School,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface Result {
    id: string;
    student_id: string;
    student_name: string;
    subject_id: string;
    subject_name: string;
    score: number;
    grade: string | null;
    remarks: string | null;
    teacher_id: string;
    examination_id: string;
}

interface StudentSummary {
    student_id: string;
    student_name: string;
    totalScore: number;
    averageScore: number;
    subjectsCount: number;
    highestScore: number;
    lowestScore: number;
}

export default function ResultsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const year = searchParams.get("year");
    const examId = searchParams.get("examId");
    const termId = searchParams.get("termId");
    const classId = searchParams.get("classId");

    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"score" | "name" | "subject">("score");
    const [currentPage, setCurrentPage] = useState(1);
    const [view, setView] = useState<"detailed" | "summary">("detailed");
    const itemsPerPage = 10;

    const supabase = createClient();

    const fetchResults = async () => {
        if (!examId) {
            toast.error("No examination selected");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("results")
                .select(`
          id,
          student_id,
          students!inner(id, first_name, last_name),
          subject_id,
          subjects!inner(id, name),
          score,
          grade,
          remarks,
          teacher_id,
          examination_id
        `)
                .eq("examination_id", examId);

            if (error) throw error;

            const mapped = (data || []).map((r: any) => ({
                id: r.id,
                student_id: r.student_id,
                student_name: `${r.students.first_name} ${r.students.last_name}`,
                subject_id: r.subject_id,
                subject_name: r.subjects.name,
                score: r.score,
                grade: r.grade || getGrade(r.score),
                remarks: r.remarks || getRemarks(r.score),
                teacher_id: r.teacher_id,
                examination_id: r.examination_id,
            }));

            setResults(mapped);

            if (mapped.length > 0) {
                toast.success(`Loaded ${mapped.length} results`);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch results");
        } finally {
            setLoading(false);
        }
    };

    const getGrade = (score: number): string => {
        if (score >= 90) return "A+";
        if (score >= 80) return "A";
        if (score >= 70) return "B";
        if (score >= 60) return "C";
        if (score >= 50) return "D";
        return "F";
    };

    const getRemarks = (score: number): string => {
        if (score >= 90) return "Excellent";
        if (score >= 80) return "Very Good";
        if (score >= 70) return "Good";
        if (score >= 60) return "Satisfactory";
        if (score >= 50) return "Needs Improvement";
        return "Fail";
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case "A+": return "bg-green-500/20 text-green-700 border-green-200";
            case "A": return "bg-green-400/20 text-green-600 border-green-200";
            case "B": return "bg-blue-500/20 text-blue-700 border-blue-200";
            case "C": return "bg-yellow-500/20 text-yellow-700 border-yellow-200";
            case "D": return "bg-orange-500/20 text-orange-700 border-orange-200";
            case "F": return "bg-red-500/20 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-blue-600";
        if (score >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    useEffect(() => {
        fetchResults();
    }, [examId]);

    // Calculate unique subjects
    const uniqueSubjects = Array.from(new Set(results.map(r => r.subject_name)));

    // Calculate student summaries
    const studentSummaries = results.reduce((acc: Record<string, StudentSummary>, result) => {
        if (!acc[result.student_id]) {
            acc[result.student_id] = {
                student_id: result.student_id,
                student_name: result.student_name,
                totalScore: 0,
                averageScore: 0,
                subjectsCount: 0,
                highestScore: 0,
                lowestScore: 100,
            };
        }

        acc[result.student_id].totalScore += result.score;
        acc[result.student_id].subjectsCount += 1;
        acc[result.student_id].highestScore = Math.max(acc[result.student_id].highestScore, result.score);
        acc[result.student_id].lowestScore = Math.min(acc[result.student_id].lowestScore, result.score);

        return acc;
    }, {});

    Object.values(studentSummaries).forEach(summary => {
        summary.averageScore = summary.totalScore / summary.subjectsCount;
    });

    // Filter and sort results
    const filteredResults = results
        .filter(result => {
            const matchesSearch = result.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                result.subject_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSubject = selectedSubject === "all" || result.subject_name === selectedSubject;
            return matchesSearch && matchesSubject;
        })
        .sort((a, b) => {
            if (sortBy === "score") return b.score - a.score;
            if (sortBy === "name") return a.student_name.localeCompare(b.student_name);
            return a.subject_name.localeCompare(b.subject_name);
        });

    // Pagination
    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);

    // Calculate statistics
    const averageScore = results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 0;
    const highestScore = results.length > 0
        ? Math.max(...results.map(r => r.score))
        : 0;
    const topPerformer = Object.values(studentSummaries)
        .sort((a, b) => b.averageScore - a.averageScore)[0];

    const handleExport = () => {
        toast.info("Export feature coming soon!");
    };

    const handleGoBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!examId) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <School className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Examination Selected</h3>
                        <p className="text-gray-500 mb-6">
                            Please select an examination to view results.
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
                        <h1 className="text-2xl font-bold">Examination Results</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Year: {year || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span>Exam ID: {examId?.slice(0, 8)}...</span>
                        </div>
                        {termId && (
                            <div className="flex items-center gap-1">
                                <School className="h-3 w-3" />
                                <span>Term: {termId}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                                <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
                                <p className="text-2xl font-bold">{highestScore.toFixed(1)}</p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Results</p>
                                <p className="text-2xl font-bold">{results.length}</p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Top Performer</p>
                                <p className="text-lg font-bold truncate">
                                    {topPerformer?.student_name.split(" ")[0] || "N/A"}
                                </p>
                            </div>
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Award className="h-6 w-6 text-yellow-600" />
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
                            <CardTitle>Results Overview</CardTitle>
                            <CardDescription>
                                {classId ? `Class: ${classId} • ` : ""}
                                {filteredResults.length} results found
                            </CardDescription>
                        </div>

                        <Tabs
                            defaultValue="detailed"
                            className="w-full sm:w-auto"
                            onValueChange={(value) => setView(value as any)}
                        >
                            <TabsList>
                                <TabsTrigger value="detailed">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Detailed
                                </TabsTrigger>
                                <TabsTrigger value="summary">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Summary
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
                                    placeholder="Search students or subjects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {uniqueSubjects.map(subject => (
                                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="score">Highest Score</SelectItem>
                                    <SelectItem value="name">Student Name</SelectItem>
                                    <SelectItem value="subject">Subject</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {view === "detailed" ? (
                        // Detailed Results Table
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Student
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4" />
                                                    Subject
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4" />
                                                    Score
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-2">
                                                    <Star className="h-4 w-4" />
                                                    Grade
                                                </div>
                                            </TableHead>
                                            <TableHead>Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedResults.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">
                                                    <div className="text-center">
                                                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                                        <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                                                        <p className="text-gray-500">
                                                            {searchQuery
                                                                ? "No results match your search criteria."
                                                                : "No results available for this examination."
                                                            }
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedResults.map((result) => (
                                                <TableRow key={result.id} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <div className="font-medium">{result.student_name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            ID: {result.student_id.slice(0, 8)}...
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{result.subject_name}</TableCell>
                                                    <TableCell>
                                                        <div className={`font-bold ${getScoreColor(result.score)}`}>
                                                            {result.score.toFixed(1)}
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
                                                            <span>{result.remarks}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredResults.length)} of {filteredResults.length} results
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        className="w-8 h-8 p-0"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Student Summary View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.values(studentSummaries)
                                .sort((a, b) => b.averageScore - a.averageScore)
                                .map((student) => (
                                    <Card key={student.student_id}>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold">{student.student_name}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {student.subjectsCount} subject{student.subjectsCount !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className={`text-lg font-bold ${getScoreColor(student.averageScore)}`}>
                                                        {student.averageScore.toFixed(1)}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Highest:</span>
                                                        <span className="font-medium text-green-600">
                                                            {student.highestScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Lowest:</span>
                                                        <span className="font-medium text-red-600">
                                                            {student.lowestScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t">
                                                    <Badge
                                                        variant="outline"
                                                        className={`${getGradeColor(getGrade(student.averageScore))} w-full justify-center`}
                                                    >
                                                        Overall: {getGrade(student.averageScore)} ({getRemarks(student.averageScore)})
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}