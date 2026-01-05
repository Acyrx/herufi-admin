"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Upload,
    Save,
    Users,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Loader2,
    User,
    ArrowLeft,
    Download,
    FileSpreadsheet,
    Filter,
    Search,
    Plus,
    X,
    Calculator,
    FileUp,
    BarChart3,
    Sparkles,
    ClipboardCheck,
    Target,
} from "lucide-react";

type Student = {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    stream_id?: string;
};

type Subject = {
    id: string;
    name: string;
    code?: string;
};

type ResultInput = {
    student_id: string;
    score: number | "";
};


interface UploadResultsPageProps {
    userId: string
}

export default function UploadResultsPage({ userId }: UploadResultsPageProps) {
    const searchParams = useSearchParams();
    const supabase = createClient();
    const router = useRouter();

    const classId = searchParams.get("class");
    const examinationId = searchParams.get("examination");
    const subjectId = searchParams.get("subject");

    const [students, setStudents] = useState<Student[]>([]);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classInfo, setClassInfo] = useState<{ name: string; grade_level?: string } | null>(null);
    const [results, setResults] = useState<Record<string, ResultInput>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showValidatedOnly, setShowValidatedOnly] = useState(false);
    const [existingResults, setExistingResults] = useState<Record<string, number>>({});

    // Statistics
    const filledCount = Object.values(results).filter(r => r.score !== "").length;
    const totalStudents = students.length;
    const completionPercentage = totalStudents > 0 ? (filledCount / totalStudents) * 100 : 0;
    const averageScore = filledCount > 0
        ? Object.values(results)
            .filter(r => r.score !== "")
            .reduce((sum, r) => sum + (r.score as number), 0) / filledCount
        : 0;

    /* ---------------- FETCH INITIAL DATA ---------------- */
    useEffect(() => {
        if (!classId || !examinationId || !subjectId) return;

        const fetchData = async () => {
            setLoading(true);

            try {
                // Fetch subject details
                const { data: subjectData } = await supabase
                    .from("subjects")
                    .select("id, name, code")
                    .eq("id", subjectId)
                    .single();

                if (subjectData) {
                    setSubject(subjectData);
                }

                // Fetch class details
                const { data: classData } = await supabase
                    .from("classes")
                    .select("name, grade_level")
                    .eq("id", classId)
                    .single();

                if (classData) {
                    setClassInfo(classData);
                }

                // Fetch students
                const { data: streams } = await supabase
                    .from("streams")
                    .select("id")
                    .eq("class_id", classId);

                if (!streams || streams.length === 0) {
                    setStudents([]);
                    setLoading(false);
                    return;
                }

                const streamIds = streams.map((s) => s.id);
                const { data: studentsData } = await supabase
                    .from("students")
                    .select("id, admission_number, first_name, last_name, stream_id")
                    .in("stream_id", streamIds)
                    .order("admission_number", { ascending: true });

                if (studentsData) {
                    setStudents(studentsData);

                    // Fetch existing results for this exam and subject
                    const { data: existingResultsData } = await supabase
                        .from("results")
                        .select("student_id, score")
                        .eq("examination_id", examinationId)
                        .eq("subject_id", subjectId)
                        .in("student_id", studentsData.map(s => s.id));

                    const existingScores: Record<string, number> = {};
                    if (existingResultsData) {
                        existingResultsData.forEach(r => {
                            existingScores[r.student_id] = r.score;
                        });
                    }
                    setExistingResults(existingScores);

                    // Initialize results state with existing scores
                    const init: Record<string, ResultInput> = {};
                    studentsData.forEach((s) => {
                        init[s.id] = {
                            student_id: s.id,
                            score: existingScores[s.id] !== undefined ? existingScores[s.id] : ""
                        };
                    });
                    setResults(init);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, examinationId, subjectId, supabase]);

    /* ---------------- HANDLE SCORE CHANGE ---------------- */
    const updateScore = (studentId: string, value: string) => {
        const numValue = value === "" ? "" : Number(value);
        if (numValue !== "" && (numValue < 0 || numValue > 100)) {
            return; // Invalid score
        }

        setResults((prev) => ({
            ...prev,
            [studentId]: {
                student_id: studentId,
                score: numValue,
            },
        }));
    };

    /* ---------------- VALIDATE SCORE ---------------- */
    const validateScore = (score: number | ""): { valid: boolean; message?: string } => {
        if (score === "") return { valid: true };
        if (score < 0 || score > 100) return { valid: false, message: "Score must be between 0-100" };
        return { valid: true };
    };

    /* ---------------- GET GRADE COLOR ---------------- */
    const getScoreColor = (score: number | "") => {
        if (score === "") return "border-gray-200 hover:border-gray-300";
        if (score >= 80) return "border-green-500 bg-green-50 hover:bg-green-100";
        if (score >= 60) return "border-blue-500 bg-blue-50 hover:bg-blue-100";
        if (score >= 40) return "border-yellow-500 bg-yellow-50 hover:bg-yellow-100";
        return "border-red-500 bg-red-50 hover:bg-red-100";
    };

    const getScoreTextColor = (score: number | "") => {
        if (score === "") return "text-gray-600";
        if (score >= 80) return "text-green-700 font-bold";
        if (score >= 60) return "text-blue-700 font-semibold";
        if (score >= 40) return "text-yellow-700";
        return "text-red-700";
    };

    const getGrade = (score: number): string => {
        if (score >= 80) return "A";
        if (score >= 70) return "B";
        if (score >= 60) return "C";
        if (score >= 50) return "D";
        if (score >= 40) return "E";
        return "F";
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case "A": return "bg-green-100 text-green-800 border-green-200";
            case "B": return "bg-blue-100 text-blue-800 border-blue-200";
            case "C": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "D": return "bg-orange-100 text-orange-800 border-orange-200";
            case "E": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    /* ---------------- SUBMIT RESULTS ---------------- */
    const submitResults = async () => {
        if (!examinationId || !subjectId) {
            alert("Examination or Subject ID is required");
            return;
        }

        // Validate all scores
        const invalidScores = Object.values(results).filter(r => {
            const validation = validateScore(r.score);
            return !validation.valid;
        });

        if (invalidScores.length > 0) {
            alert(`Please fix ${invalidScores.length} invalid scores before saving`);
            return;
        }

        setSaving(true);

        const payload = Object.values(results)
            .filter((r) => r.score !== "")
            .map((r) => ({
                student_id: r.student_id,
                subject_id: subjectId,
                examination_id: examinationId,
                score: r.score as number,
                grade: getGrade(r.score as number),
                teacher_id: userId
            }));

        if (payload.length === 0) {
            alert("No scores to save");
            setSaving(false);
            return;
        }

        const { error } = await supabase
            .from("results")
            .upsert(payload, {
                onConflict: "student_id,subject_id,examination_id",
            });

        setSaving(false);

        if (error) {
            alert(`Error saving results: ${error.message}`);
        } else {
            alert(`✅ Successfully saved ${payload.length} results`);
        }
    };

    /* ---------------- CLEAR ALL SCORES ---------------- */
    const clearAllScores = () => {
        if (!confirm("Are you sure you want to clear all scores?")) return;

        const cleared: Record<string, ResultInput> = {};
        students.forEach((s) => {
            cleared[s.id] = { student_id: s.id, score: "" };
        });
        setResults(cleared);
    };

    /* ---------------- FILL SAMPLE SCORES ---------------- */
    const fillSampleScores = () => {
        const updated = { ...results };
        students.forEach((student) => {
            if (!updated[student.id].score) {
                // Generate random score between 40-100
                const randomScore = Math.floor(Math.random() * 61) + 40;
                updated[student.id].score = randomScore;
            }
        });
        setResults(updated);
    };

    /* ---------------- EXPORT TO CSV ---------------- */
    const exportToCSV = () => {
        const csvContent = [
            ["Admission Number", "First Name", "Last Name", "Score"],
            ...filteredStudents.map(student => [
                student.admission_number,
                student.first_name,
                student.last_name,
                results[student.id]?.score || ""
            ])
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${subject?.name || "results"}_scores.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    /* ---------------- FILTERED STUDENTS ---------------- */
    const filteredStudents = students.filter(student => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                student.admission_number.toLowerCase().includes(searchLower) ||
                student.first_name.toLowerCase().includes(searchLower) ||
                student.last_name.toLowerCase().includes(searchLower)
            );
        }
        if (showValidatedOnly) {
            return results[student.id]?.score !== "";
        }
        return true;
    });

    if (!classId || !examinationId || !subjectId) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing Parameters</AlertTitle>
                    <AlertDescription>
                        Class, Examination, or Subject ID is missing. Please navigate properly.
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
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Upload Results
                            </span>
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge variant="outline" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {subject?.name}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {classInfo?.name}
                        </Badge>
                        <span className="text-muted-foreground">
                            Entering scores for {totalStudents} students
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={exportToCSV}>
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={fillSampleScores}>
                        <Calculator className="h-4 w-4" />
                        Fill Sample
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={clearAllScores}>
                        <X className="h-4 w-4" />
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Subject</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-100">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 truncate">
                            {subject?.name}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                            {subject?.code && `Code: ${subject.code}`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Progress</CardTitle>
                        <div className="p-2 rounded-lg bg-green-100">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">{filledCount}/{totalStudents}</div>
                        <Progress value={completionPercentage} className="mt-2 h-2" />
                        <p className="text-xs text-green-600 mt-1">
                            {completionPercentage.toFixed(1)}% complete
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">Average Score</CardTitle>
                        <div className="p-2 rounded-lg bg-orange-100">
                            <BarChart3 className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">
                            {filledCount > 0 ? averageScore.toFixed(1) : "0.0"}
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                            Based on {filledCount} entries
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Class</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-100">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900 truncate">
                            {classInfo?.name || "N/A"}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                            {classInfo?.grade_level && `Grade ${classInfo.grade_level}`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search students by name or admission number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="flex gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={showValidatedOnly ? "default" : "outline"}
                                            onClick={() => setShowValidatedOnly(!showValidatedOnly)}
                                            className="gap-2"
                                        >
                                            <Filter className="h-4 w-4" />
                                            {showValidatedOnly ? "Show All" : "Filled Only"}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {showValidatedOnly ? "Show all students" : "Show only students with scores"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={exportToCSV}
                            >
                                <Download className="h-4 w-4" />
                                Template
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5" />
                                Student Scores
                            </CardTitle>
                            <CardDescription>
                                Enter or update scores for each student
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-1">
                            <Target className="h-3 w-3" />
                            {filteredStudents.length} students
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[120px]">Admission No</TableHead>
                                    <TableHead className="w-[250px]">Student Name</TableHead>
                                    <TableHead className="w-[200px]">Score (0-100)</TableHead>
                                    <TableHead className="w-[120px] text-center">Grade</TableHead>
                                    <TableHead className="w-[100px] text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => {
                                    const score = results[student.id]?.score ?? "";
                                    const validation = validateScore(score);
                                    const hasExistingScore = existingResults[student.id] !== undefined;
                                    const grade = score !== "" ? getGrade(score as number) : "";

                                    return (
                                        <TableRow key={student.id} className="hover:bg-muted/30 group">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono bg-white">
                                                        {student.admission_number}
                                                    </Badge>
                                                    {hasExistingScore && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Sparkles className="h-3 w-3 text-yellow-500" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Previously saved: {existingResults[student.id]}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {student.first_name} {student.last_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Student ID: {student.id.slice(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.5"
                                                            value={score}
                                                            onChange={(e) => updateScore(student.id, e.target.value)}
                                                            className={`h-10 pl-3 pr-10 transition-all ${getScoreColor(score)} ${getScoreTextColor(score)}`}
                                                            placeholder="Enter score"
                                                        />
                                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                                            /100
                                                        </span>
                                                    </div>
                                                    {score !== "" && (
                                                        <Badge className={getGradeColor(grade)}>
                                                            {grade}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {!validation.valid && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {validation.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {grade ? (
                                                    <Badge className={getGradeColor(grade)}>
                                                        {grade}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {score === "" ? (
                                                    <Badge variant="outline" className="text-gray-600 bg-gray-50">
                                                        Pending
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                                        Entered
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {filteredStudents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Search className="h-10 w-10 text-muted-foreground" />
                                                <div>
                                                    <h3 className="font-semibold">No students found</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {searchTerm ? "Try a different search term" : "No students in this class"}
                                                    </p>
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

            {/* Action Buttons */}
            <div className="sticky bottom-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-xl border shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-green-600">
                                <CheckCircle2 className="inline h-3 w-3 mr-1" />
                                {filledCount} entered
                            </span>
                            <span className="font-medium text-yellow-600">
                                <AlertCircle className="inline h-3 w-3 mr-1" />
                                {totalStudents - filledCount} pending
                            </span>
                            <span className="font-medium text-blue-600">
                                <BarChart3 className="inline h-3 w-3 mr-1" />
                                Avg: {filledCount > 0 ? averageScore.toFixed(1) : "0.0"}
                            </span>
                        </div>
                        <Progress value={completionPercentage} className="w-64 h-1.5" />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={saving}
                            className="gap-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitResults}
                            disabled={saving || filledCount === 0}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-32"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save {filledCount} Results
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}