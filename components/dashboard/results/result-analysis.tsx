"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Download,
    Filter,
    Search,
    AlertCircle,
    User,
    BookOpen,
    Award,
    MessageSquare,
    Loader2,
    BarChart3,
    FileText,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Result {
    id: string;
    score: number;
    grade: string | null;
    remarks: string | null;
    students: {
        id: string;
        first_name: string;
        last_name: string;
        admission_number: string;
    };
    subjects: {
        id: string;
        name: string;
    };
}

interface GradeSummary {
    grade: string;
    count: number;
    percentage: number;
}
export default function ResultPage() {
    const searchParams = useSearchParams();
    const examinationId = searchParams.get("examination");
    const supabase = createClient()
    const [results, setResults] = useState<Result[]>([]);
    const [filteredResults, setFilteredResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState<string>("all");
    const [gradeFilter, setGradeFilter] = useState<string>("all");

    // Calculate statistics
    const totalStudents = new Set(results.map(r => r.students.id)).size;
    const totalSubjects = new Set(results.map(r => r.subjects.id)).size;
    const averageScore = results.length > 0
        ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1)
        : "0.0";

    // Calculate grade distribution
    const gradeSummary: GradeSummary[] = results.reduce((acc: GradeSummary[], result) => {
        const grade = result.grade || "Ungraded";
        const existing = acc.find(g => g.grade === grade);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ grade, count: 1, percentage: 0 });
        }
        return acc;
    }, []);

    gradeSummary.forEach(g => {
        g.percentage = (g.count / results.length) * 100;
    });

    // Filter results
    useEffect(() => {
        let filtered = results;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.students.full_name.toLowerCase().includes(term) ||
                r.students.admission_number.toLowerCase().includes(term) ||
                r.subjects.name.toLowerCase().includes(term)
            );
        }

        // Subject filter
        if (subjectFilter !== "all") {
            filtered = filtered.filter(r => r.subjects.id === subjectFilter);
        }

        // Grade filter
        if (gradeFilter !== "all") {
            filtered = filtered.filter(r => r.grade === gradeFilter);
        }

        setFilteredResults(filtered);
    }, [results, searchTerm, subjectFilter, gradeFilter]);

    // Get unique subjects for filter
    const uniqueSubjects = Array.from(new Set(results.map(r => r.subjects.id)))
        .map(id => {
            const subject = results.find(r => r.subjects.id === id)?.subjects;
            return { id, name: subject?.name || "" };
        });

    // Get unique grades for filter
    const uniqueGrades = Array.from(new Set(results.map(r => r.grade).filter(Boolean)));

    const getGradeColor = (grade: string | null) => {
        if (!grade) return "secondary";

        const gradeMap: Record<string, string> = {
            'A': 'bg-green-100 text-green-800 hover:bg-green-100',
            'B': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
            'C': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
            'D': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
            'E': 'bg-red-100 text-red-800 hover:bg-red-100',
            'F': 'bg-red-100 text-red-800 hover:bg-red-100',
        };

        return gradeMap[grade] || 'secondary';
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 font-bold";
        if (score >= 60) return "text-blue-600 font-semibold";
        if (score >= 40) return "text-yellow-600";
        return "text-red-600";
    };

    const handleExport = () => {
        // Implement export functionality
        console.log("Exporting results...");
    };

    useEffect(() => {
        if (!examinationId) return;

        const fetchResults = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from("results")
                .select(`
          id,
          score,
          grade,
          remarks,
          students (
            id,
            first_name,
            last_name,
            admission_number
          ),
          subjects (
            id,
            name
          )
        `)
                .eq("examination_id", examinationId)
                .order("admission_number", {
                    foreignTable: "students",
                    ascending: true,
                });
            if (error) {
                setError(error.message);
            } else {
                setResults(data as Result[]);
                setFilteredResults(data as Result[]);
            }

            setLoading(false);
        };

        fetchResults();
    }, [examinationId]);

    if (!examinationId) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        No examination selected. Please select an examination to view results.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Results</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Examination Results</h1>
                    <p className="text-muted-foreground">
                        Detailed view of examination performance and analytics
                    </p>
                </div>
                <Button onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Results
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageScore}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all subjects
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                        <p className="text-xs text-muted-foreground">
                            Participated in examination
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSubjects}</div>
                        <p className="text-xs text-muted-foreground">
                            Total subjects assessed
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Grade Distribution */}
            {gradeSummary.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Grade Distribution</CardTitle>
                        <CardDescription>Performance overview across grades</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {gradeSummary.map(({ grade, count, percentage }) => (
                                <TooltipProvider key={grade}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="outline" className={getGradeColor(grade)}>
                                                {grade}: {count} ({percentage.toFixed(1)}%)
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{grade}: {count} students</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="results" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <TabsList>
                        <TabsTrigger value="results" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Results Table
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search students or subjects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {uniqueSubjects.map(subject => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={gradeFilter} onValueChange={setGradeFilter}>
                            <SelectTrigger className="w-full sm:w-32">
                                <SelectValue placeholder="Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grades</SelectItem>
                                {uniqueGrades.map(grade => (
                                    <SelectItem key={grade} value={grade}>
                                        {grade}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(searchTerm || subjectFilter !== "all" || gradeFilter !== "all") && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSubjectFilter("all");
                                    setGradeFilter("all");
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>

                <TabsContent value="results" className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">Student</TableHead>
                                            <TableHead>Admission No</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead className="text-center">Score</TableHead>
                                            <TableHead className="text-center">Grade</TableHead>
                                            <TableHead>Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResults.map((result) => (
                                            <TableRow key={result.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span>{result.students.first_name} {result.students.last_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono">
                                                        {result.students.admission_number}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                        {result.subjects.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={getScoreColor(result.score)}>
                                                        {result.score}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {result.grade ? (
                                                        <Badge className={getGradeColor(result.grade)}>
                                                            <Award className="mr-1 h-3 w-3" />
                                                            {result.grade}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {result.remarks ? (
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger className="text-left">
                                                                        <span className="line-clamp-1">
                                                                            {result.remarks}
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="max-w-xs">{result.remarks}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {filteredResults.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Search className="h-8 w-8 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-muted-foreground">
                                                                No results found
                                                            </p>
                                                            {results.length > 0 && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Try adjusting your filters
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {results.length > 0 && (
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>
                                Showing {filteredResults.length} of {results.length} results
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export as CSV
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="analytics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Analytics</CardTitle>
                            <CardDescription>
                                Detailed analysis of examination results
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Top Performers</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {results
                                                    .sort((a, b) => b.score - a.score)
                                                    .slice(0, 5)
                                                    .map((result, index) => (
                                                        <div key={result.id} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">{index + 1}</Badge>
                                                                <span className="text-sm">{result.students.first_name}</span>
                                                            </div>
                                                            <Badge className={getGradeColor(result.grade)}>
                                                                {result.score}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Subject Performance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {Array.from(new Set(results.map(r => r.subjects.id))).map(subjectId => {
                                                    const subject = results.find(r => r.subjects.id === subjectId)?.subjects;
                                                    const subjectResults = results.filter(r => r.subjects.id === subjectId);
                                                    const avgScore = subjectResults.reduce((sum, r) => sum + r.score, 0) / subjectResults.length;

                                                    return (
                                                        <div key={subjectId} className="flex items-center justify-between">
                                                            <span className="text-sm">{subject?.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">{avgScore.toFixed(1)}</span>
                                                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{ width: `${Math.min(avgScore, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
