"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

type Student = {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
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

export default function UploadResultsPage() {
    const searchParams = useSearchParams();
    const supabase = createClient();
    const router = useRouter();

    const classId = searchParams.get("class");
    const examinationId = searchParams.get("examination");


    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [results, setResults] = useState<Record<string, ResultInput>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showValidatedOnly, setShowValidatedOnly] = useState(false);
    const [importMode, setImportMode] = useState<"manual" | "bulk">("manual");

    // Statistics
    const filledCount = Object.values(results).filter(r => r.score !== "").length;
    const totalStudents = students.length;
    const completionPercentage = totalStudents > 0 ? (filledCount / totalStudents) * 100 : 0;
    const averageScore = filledCount > 0
        ? Object.values(results)
            .filter(r => r.score !== "")
            .reduce((sum, r) => sum + (r.score as number), 0) / filledCount
        : 0;

    /* ---------------- FETCH STREAMS AND STUDENTS ---------------- */
    useEffect(() => {
        if (!classId) return;

        const fetchStudents = async () => {
            setLoading(true);

            // 1️⃣ get streams for this class
            const { data: streams } = await supabase
                .from("streams")
                .select("id, name")
                .eq("class_id", classId);


            if (!streams || streams.length === 0) {
                setStudents([]);
                setLoading(false);
                return;
            }

            const streamIds = streams.map((s) => s.id);

            // 2️⃣ get students in these streams
            const { data: studentsData } = await supabase
                .from("students")
                .select("id, admission_number, first_name, last_name, stream_id")
                .in("stream_id", streamIds)
                .order("admission_number", { ascending: true });

            if (studentsData) {
                setStudents(studentsData);

                // initialize results state
                const init: Record<string, ResultInput> = {};
                studentsData.forEach((s) => {
                    init[s.id] = { student_id: s.id, score: "" };
                });
                setResults(init);
            }

            setLoading(false);
        };

        fetchStudents();
    }, [classId]);

    /* ---------------- FETCH SUBJECTS ---------------- */
    useEffect(() => {
        const fetchSubjects = async () => {
            const { data } = await supabase
                .from("subjects")
                .select("id, name, code")
                .order("name");

            if (data) setSubjects(data);
        };

        fetchSubjects();
    }, []);

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
        if (score === "") return "border-gray-200";
        if (score >= 80) return "border-green-500 bg-green-50";
        if (score >= 60) return "border-blue-500 bg-blue-50";
        if (score >= 40) return "border-yellow-500 bg-yellow-50";
        return "border-red-500 bg-red-50";
    };

    /* ---------------- SUBMIT RESULTS ---------------- */
    const submitResults = async () => {
        if (!examinationId) {
            alert("Examination ID is required");
            return;
        }

        if (!selectedSubject) {
            alert("Please select a subject");
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
                subject_id: selectedSubject,
                examination_id: examinationId,
                score: r.score as number,
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
            alert(`Successfully saved ${payload.length} results`);
            router.push(`/dashboard/results?examination=${examinationId}`);
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

    if (!classId || !examinationId) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing Parameters</AlertTitle>
                    <AlertDescription>
                        Class or Examination ID is missing. Please navigate properly.
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
                        <h1 className="text-3xl font-bold tracking-tight">Upload Results</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Enter scores for {students.length} students
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={clearAllScores}>
                        <X className="h-4 w-4" />
                        Clear All
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={fillSampleScores}>
                        <Calculator className="h-4 w-4" />
                        Sample Scores
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                        <Progress value={completionPercentage} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {filledCount} of {totalStudents} completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionPercentage.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {filledCount} scores entered
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on {filledCount} entries
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subject</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold truncate">
                            {selectedSubject ?
                                subjects.find(s => s.id === selectedSubject)?.name || "Not selected"
                                : "Not selected"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Select subject to continue
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Subject Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Subject Selection
                    </CardTitle>
                    <CardDescription>
                        Select a subject to enter scores for
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject *</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.name} {subject.code && `(${subject.code})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedSubject && (
                            <Alert className="border-blue-200 bg-blue-50">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                <AlertTitle>Ready to enter scores</AlertTitle>
                                <AlertDescription>
                                    You're entering scores for <span className="font-semibold">
                                        {subjects.find(s => s.id === selectedSubject)?.name}
                                    </span>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Input Mode Tabs */}
            <Tabs value={importMode} onValueChange={(v) => setImportMode(v as any)}>
                <TabsList className="grid w-full md:w-auto grid-cols-2">
                    <TabsTrigger value="manual" className="gap-2">
                        <User className="h-4 w-4" />
                        Manual Entry
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Bulk Upload
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                    {/* Search and Filter */}
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

                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Template
                            </Button>
                        </div>
                    </div>

                    {/* Students Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Admission No</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead className="w-[200px]">Score (0-100)</TableHead>
                                            <TableHead className="w-[100px] text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.map((student) => {
                                            const score = results[student.id]?.score ?? "";
                                            const validation = validateScore(score);

                                            return (
                                                <TableRow key={student.id} className="hover:bg-muted/50">
                                                    <TableCell className="font-mono font-medium">
                                                        <Badge variant="outline" className="font-mono">
                                                            {student.admission_number}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                                <User className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <span>
                                                                {student.first_name} {student.last_name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.5"
                                                                value={score}
                                                                onChange={(e) => updateScore(student.id, e.target.value)}
                                                                className={`w-32 ${getScoreColor(score)}`}
                                                                placeholder="Enter score"
                                                            />
                                                            <span className="text-sm text-muted-foreground">
                                                                / 100
                                                            </span>
                                                        </div>
                                                        {!validation.valid && (
                                                            <p className="text-xs text-red-500 mt-1">
                                                                {validation.message}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {score === "" ? (
                                                            <Badge variant="outline" className="text-gray-600">
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
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Search className="h-8 w-8 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-muted-foreground">No students found</p>
                                                            {searchTerm && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Try a different search term
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
                </TabsContent>

                <TabsContent value="bulk">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5" />
                                Bulk Upload
                            </CardTitle>
                            <CardDescription>
                                Upload a CSV file with student scores
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="font-semibold mb-2">Upload CSV File</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Download the template, fill in scores, and upload here
                                </p>
                                <Button className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Choose File
                                </Button>
                                <p className="text-xs text-muted-foreground mt-4">
                                    Supports .csv files with columns: admission_number, score
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <Card>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        <p>
                            <span className="font-semibold">{filledCount}</span> scores entered •
                            <span className="font-semibold"> {totalStudents - filledCount}</span> pending
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitResults}
                            disabled={saving || !selectedSubject || filledCount === 0}
                            className="gap-2"
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
                </CardFooter>
            </Card>
        </div>
    );
}