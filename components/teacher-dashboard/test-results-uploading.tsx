"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Save,
    Users,
    User,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    FileText,
    Award,
    Calculator,
    BookOpen,
    Search,
    Filter,
    Sparkles,
    Target,
    BarChart3,
    X,
    Check,
    ClipboardCheck,
    School,
    Calendar,
    GraduationCap,
    Clock,
    Percent,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    stream_id?: string;
}

interface Test {
    id: string;
    name: string;
    max_marks: number;
    class_id: string;
    description?: string;
    type: string;
    created_at: string;
    subjects?: {
        name: string;
        code?: string;
    };
    classes?: {
        name: string;
        grade_level?: string;
    };
}

interface ExistingResult {
    student_id: string;
    marks: number;
    created_at: string;
}

export default function TestUpload() {
    const { testId } = useParams<{ testId: string }>();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [test, setTest] = useState<Test | null>(null);
    const [marks, setMarks] = useState<Record<string, number | "">>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [existingResults, setExistingResults] = useState<Record<string, ExistingResult>>({});
    const [showFilledOnly, setShowFilledOnly] = useState(false);

    // Statistics
    const filledCount = Object.values(marks).filter(mark => mark !== "" && mark !== undefined).length;
    const totalStudents = students.length;
    const completionPercentage = totalStudents > 0 ? (filledCount / totalStudents) * 100 : 0;
    const averageMarks = filledCount > 0
        ? Object.values(marks)
            .filter(mark => mark !== "" && mark !== undefined)
            .reduce((sum, mark) => sum + (mark as number), 0) / filledCount
        : 0;
    const maxMarks = test?.max_marks || 100;

    /* ----------------------------- */
    /* LOAD STUDENTS & TEST          */
    /* ----------------------------- */
    useEffect(() => {
        if (!testId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // 1️⃣ Load the single test details
                const { data: testData, error: testErr } = await supabase
                    .from("tests")
                    .select(`
                        id, 
                        name, 
                        max_marks, 
                        class_id,
                        type,
                        created_at,
                        subjects ( name, code ),
                        classes ( name, grade_level )
                    `)
                    .eq("id", testId)
                    .single();

                if (testErr) throw testErr;
                if (!testData) {
                    console.error("Test not found");
                    return;
                }

                setTest(testData as Test);

                const classId = testData.class_id;

                // 2️⃣ Get all streams in the class
                const { data: streams, error: streamsErr } = await supabase
                    .from("streams")
                    .select("id, name")
                    .eq("class_id", classId);

                if (streamsErr) throw streamsErr;

                const streamIds = streams?.map((s: any) => s.id) ?? [];

                // 3️⃣ Get all students in these streams
                const { data: studentsData, error: studentsErr } = await supabase
                    .from("students")
                    .select("id, first_name, last_name, admission_number, stream_id")
                    .in("stream_id", streamIds)
                    .order("admission_number", { ascending: true });

                if (studentsErr) throw studentsErr;

                const studentsList = studentsData ?? [];
                setStudents(studentsList);

                // 4️⃣ Load existing results for this test
                const { data: existingData, error: existingErr } = await supabase
                    .from("test_results")
                    .select("student_id, marks, created_at")
                    .eq("test_id", testData.id);

                if (!existingErr && existingData) {
                    const existingMap: Record<string, ExistingResult> = {};
                    existingData.forEach(result => {
                        existingMap[result.student_id] = result;
                    });
                    setExistingResults(existingMap);

                    // Initialize marks with existing values
                    const initialMarks: Record<string, number | ""> = {};
                    studentsList.forEach(student => {
                        if (existingMap[student.id]) {
                            initialMarks[student.id] = existingMap[student.id].marks;
                        } else {
                            initialMarks[student.id] = "";
                        }
                    });
                    setMarks(initialMarks);
                } else {
                    // Initialize empty marks
                    const initialMarks: Record<string, number | ""> = {};
                    studentsList.forEach(student => {
                        initialMarks[student.id] = "";
                    });
                    setMarks(initialMarks);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [testId]);

    /* ----------------------------- */
    /* HANDLE MARK CHANGE            */
    /* ----------------------------- */
    const handleMarkChange = (studentId: string, value: string) => {
        const numValue = value === "" ? "" : Number(value);
        if (numValue !== "" && (numValue < 0 || numValue > maxMarks)) {
            return; // Invalid mark
        }

        setMarks(prev => ({
            ...prev,
            [studentId]: numValue,
        }));
    };

    /* ----------------------------- */
    /* VALIDATE MARK                 */
    /* ----------------------------- */
    const validateMark = (mark: number | ""): { valid: boolean; message?: string } => {
        if (mark === "") return { valid: true };
        if (mark < 0 || mark > maxMarks) return { valid: false, message: `Mark must be between 0-${maxMarks}` };
        return { valid: true };
    };

    /* ----------------------------- */
    /* GET MARK COLOR                */
    /* ----------------------------- */
    const getMarkColor = (mark: number | "") => {
        if (mark === "") return "border-gray-200 hover:border-gray-300";
        const percentage = (mark as number) / maxMarks * 100;
        if (percentage >= 80) return "border-green-500 bg-green-50 hover:bg-green-100";
        if (percentage >= 60) return "border-blue-500 bg-blue-50 hover:bg-blue-100";
        if (percentage >= 40) return "border-yellow-500 bg-yellow-50 hover:bg-yellow-100";
        return "border-red-500 bg-red-50 hover:bg-red-100";
    };

    /* ----------------------------- */
    /* GET MARK TEXT COLOR           */
    /* ----------------------------- */
    const getMarkTextColor = (mark: number | "") => {
        if (mark === "") return "text-gray-600";
        const percentage = (mark as number) / maxMarks * 100;
        if (percentage >= 80) return "text-green-700 font-bold";
        if (percentage >= 60) return "text-blue-700 font-semibold";
        if (percentage >= 40) return "text-yellow-700";
        return "text-red-700";
    };

    /* ----------------------------- */
    /* GET GRADE                     */
    /* ----------------------------- */
    const getGrade = (mark: number): string => {
        const percentage = (mark / maxMarks) * 100;
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B";
        if (percentage >= 60) return "C";
        if (percentage >= 50) return "D";
        if (percentage >= 40) return "E";
        return "F";
    };

    /* ----------------------------- */
    /* GET GRADE COLOR               */
    /* ----------------------------- */
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

    /* ----------------------------- */
    /* GET TEST TYPE COLOR           */
    /* ----------------------------- */
    const getTestTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            quiz: "bg-blue-100 text-blue-800",
            cat: "bg-purple-100 text-purple-800",
            assignment: "bg-green-100 text-green-800",
            practical: "bg-orange-100 text-orange-800",
            exam: "bg-red-100 text-red-800",
            project: "bg-indigo-100 text-indigo-800",
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    /* ----------------------------- */
    /* SAVE MARKS                    */
    /* ----------------------------- */
    const handleSaveMarks = async () => {
        if (!testId) return;

        // Validate all marks
        const invalidMarks = Object.entries(marks).filter(([_, mark]) => {
            const validation = validateMark(mark);
            return !validation.valid;
        });

        if (invalidMarks.length > 0) {
            alert(`Please fix ${invalidMarks.length} invalid marks before saving`);
            return;
        }

        setSaving(true);

        const payload = Object.entries(marks)
            .filter(([_, mark]) => mark !== "")
            .map(([studentId, mark]) => ({
                student_id: studentId,
                test_id: testId,
                marks: mark as number,
                grade: getGrade(mark as number),
            }));

        if (payload.length === 0) {
            alert("No marks to save");
            setSaving(false);
            return;
        }

        const { error } = await supabase.from("test_results").upsert(payload, {
            onConflict: "student_id,test_id",
        });

        setSaving(false);
        setShowConfirmModal(false);

        if (error) {
            alert(`Error saving marks: ${error.message}`);
        } else {
            // Refresh existing results
            const { data: updatedResults } = await supabase
                .from("test_results")
                .select("student_id, marks, created_at")
                .eq("test_id", testId);

            if (updatedResults) {
                const updatedMap: Record<string, ExistingResult> = {};
                updatedResults.forEach(result => {
                    updatedMap[result.student_id] = result;
                });
                setExistingResults(updatedMap);
            }

            alert(`✅ Successfully saved ${payload.length} marks`);
        }
    };

    /* ----------------------------- */
    /* FILTERED STUDENTS             */
    /* ----------------------------- */
    const filteredStudents = students.filter(student => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                student.admission_number.toLowerCase().includes(term) ||
                student.first_name.toLowerCase().includes(term) ||
                student.last_name.toLowerCase().includes(term)
            );
        }
        if (showFilledOnly) {
            return marks[student.id] !== "" && marks[student.id] !== undefined;
        }
        return true;
    });

    /* ----------------------------- */
    /* CLEAR ALL MARKS               */
    /* ----------------------------- */
    const clearAllMarks = () => {
        if (!confirm("Are you sure you want to clear all marks?")) return;

        const cleared: Record<string, number | ""> = {};
        students.forEach((s) => {
            cleared[s.id] = "";
        });
        setMarks(cleared);
    };

    /* ----------------------------- */
    /* FILL SAMPLE MARKS             */
    /* ----------------------------- */
    const fillSampleMarks = () => {
        const updated = { ...marks };
        students.forEach((student) => {
            if (!updated[student.id] || updated[student.id] === "") {
                // Generate random mark between 40-100% of max marks
                const randomPercentage = Math.floor(Math.random() * 61) + 40; // 40-100%
                const randomMark = Math.floor((randomPercentage / 100) * maxMarks);
                updated[student.id] = randomMark;
            }
        });
        setMarks(updated);
    };

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

    if (!test) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Test Not Found</AlertTitle>
                    <AlertDescription>
                        The requested test could not be found. Please check the URL and try again.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => router.back()} className="mt-4 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                                Enter Test Marks
                            </span>
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {test.name}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {test.subjects?.name}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <School className="h-3 w-3" />
                            {test.classes?.name}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Target className="h-3 w-3" />
                            Max: {maxMarks} marks
                        </Badge>
                        <Badge className={getTestTypeColor(test.type)}>
                            {test.type.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={clearAllMarks}>
                        <X className="h-4 w-4" />
                        Clear All
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={fillSampleMarks}>
                        <Calculator className="h-4 w-4" />
                        Fill Sample
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Test</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-100">
                            <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-blue-900 truncate">
                            {test.name}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                            {test.type.toUpperCase()} • Created {new Date(test.created_at).toLocaleDateString()}
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
                        <CardTitle className="text-sm font-medium text-orange-700">Average Marks</CardTitle>
                        <div className="p-2 rounded-lg bg-orange-100">
                            <BarChart3 className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">
                            {filledCount > 0 ? averageMarks.toFixed(1) : "0.0"}
                            <span className="text-sm font-normal text-orange-600">/{maxMarks}</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                            {filledCount > 0 ? `${((averageMarks / maxMarks) * 100).toFixed(1)}% average` : "No marks entered"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Class Info</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-100">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-purple-900 truncate">
                            {test.classes?.name || "N/A"}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                            {totalStudents} students • {test.classes?.grade_level && `Grade ${test.classes.grade_level}`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Test Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Test Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">Test Name</Label>
                            <p className="font-medium">{test.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">Subject</Label>
                            <p className="font-medium">{test.subjects?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">Class</Label>
                            <p className="font-medium">{test.classes?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">Maximum Marks</Label>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                    {maxMarks} marks
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    ({((maxMarks / 100) * 100).toFixed(0)}% scale)
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search students by name or admission number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-11"
                    />
                </div>

                <div className="flex gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={showFilledOnly ? "default" : "outline"}
                                    onClick={() => setShowFilledOnly(!showFilledOnly)}
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    {showFilledOnly ? "Show All" : "Filled Only"}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {showFilledOnly ? "Show all students" : "Show only students with marks"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Students Table */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5" />
                                Student Marks
                            </CardTitle>
                            <CardDescription>
                                Enter or update marks for each student (0-{maxMarks})
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-2">
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
                                    <TableHead className="w-[200px]">Marks (0-{maxMarks})</TableHead>
                                    <TableHead className="w-[100px] text-center">Grade</TableHead>
                                    <TableHead className="w-[100px] text-center">Status</TableHead>
                                    <TableHead className="w-[120px] text-center">Previous</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => {
                                    const mark = marks[student.id] ?? "";
                                    const validation = validateMark(mark);
                                    const existingResult = existingResults[student.id];
                                    const grade = mark !== "" ? getGrade(mark as number) : "";
                                    const hasExisting = existingResult !== undefined;
                                    const percentage = mark !== "" ? ((mark as number) / maxMarks * 100).toFixed(1) : "";

                                    return (
                                        <TableRow key={student.id} className="hover:bg-muted/30 group">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono bg-white">
                                                        {student.admission_number}
                                                    </Badge>
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
                                                            ID: {student.id.slice(0, 8)}...
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
                                                            max={maxMarks}
                                                            step="0.5"
                                                            value={mark}
                                                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                            className={`h-10 pl-3 pr-16 transition-all ${getMarkColor(mark)} ${getMarkTextColor(mark)}`}
                                                            placeholder="Enter marks"
                                                        />
                                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                                            /{maxMarks}
                                                        </span>
                                                    </div>
                                                    {mark !== "" && (
                                                        <div className="flex flex-col items-center">
                                                            <Badge className={getGradeColor(grade)}>
                                                                {grade}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                {percentage}%
                                                            </span>
                                                        </div>
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
                                                    <Badge className={`${getGradeColor(grade)} font-bold`}>
                                                        {grade}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {mark === "" ? (
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
                                            <TableCell className="text-center">
                                                {hasExisting ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                                                                    <Sparkles className="h-3 w-3" />
                                                                    {existingResult.marks}
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="space-y-1">
                                                                    <p>Previously saved: {existingResult.marks}/{maxMarks}</p>
                                                                    <p className="text-xs">
                                                                        {((existingResult.marks / maxMarks) * 100).toFixed(1)}%
                                                                    </p>
                                                                    <p className="text-xs">
                                                                        {new Date(existingResult.created_at).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {filteredStudents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
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
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
                                Avg: {filledCount > 0 ? averageMarks.toFixed(1) : "0.0"}/{maxMarks}
                            </span>
                            <span className="font-medium text-purple-600">
                                <Percent className="inline h-3 w-3 mr-1" />
                                {filledCount > 0 ? ((averageMarks / maxMarks) * 100).toFixed(1) : "0.0"}%
                            </span>
                        </div>
                        <Progress value={completionPercentage} className="w-full md:w-64 h-1.5" />
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

                        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                            <DialogTrigger asChild>
                                <Button
                                    disabled={saving || filledCount === 0}
                                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-32"
                                >
                                    <Save className="h-4 w-4" />
                                    Save {filledCount} Marks
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        Confirm Save
                                    </DialogTitle>
                                    <DialogDescription>
                                        You are about to save marks for {filledCount} out of {totalStudents} students.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            This will update existing marks and cannot be undone.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Test:</span>
                                            <span className="font-bold">{test.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Subject:</span>
                                            <span>{test.subjects?.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Class:</span>
                                            <span>{test.classes?.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Max Marks:</span>
                                            <Badge variant="outline">{maxMarks}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Average:</span>
                                            <span className="font-bold text-green-600">
                                                {filledCount > 0 ? averageMarks.toFixed(1) : "0.0"}/{maxMarks}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveMarks}
                                        disabled={saving}
                                        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Confirm & Save
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}