"use client";

import type { Examination, Term, Class } from "@/lib/types";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Upload,
    Calendar,
    Award,
    ChevronDown,
    Users,
    BookOpen,
    Eye,
    ExternalLink,
    Clock,
    AlertCircle,
    ChevronRight,
    Check,
    School,
    BookMarked,
    Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExaminationWithTerm extends Examination {
    term?: Pick<Term, "id" | "name"> | null;
}

interface TeacherSubject {
    id: string;
    class_id: string;
    subject_id: string;
    subjects: {
        id: string;
        name: string;
    };
    classes?: {
        id: string;
        name: string;
    };
}

interface ExaminationsTableProps {
    examinations: ExaminationWithTerm[];
    schoolId: string;
    userId: string;
}

interface ClassWithSubjects extends Class {
    subjects: TeacherSubject[];
    teacherSubjects: TeacherSubject[];
}

export function ExaminationsTable({ examinations, schoolId, userId }: ExaminationsTableProps) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
    const [loadingClasses, setLoadingClasses] = useState<Record<string, boolean>>({});
    const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());
    const [examStats, setExamStats] = useState<Record<string, { count: number; avg?: number }>>({});
    const [selectedClassForUpload, setSelectedClassForUpload] = useState<Record<string, string>>({});
    const [selectedSubjectForUpload, setSelectedSubjectForUpload] = useState<Record<string, string>>({});
    const [filteredClasses, setFilteredClasses] = useState<Record<string, ClassWithSubjects[]>>({});

    const supabase = createClient();

    // Fetch statistics for each examination
    useEffect(() => {
        const fetchExamStats = async () => {
            const stats: Record<string, { count: number; avg?: number }> = {};

            for (const exam of examinations) {
                const { count, data } = await supabase
                    .from("results")
                    .select("score", { count: "exact" })
                    .eq("examination_id", exam.id);

                if (data && data.length > 0) {
                    const avg = data.reduce((sum, r) => sum + (r.score || 0), 0) / data.length;
                    stats[exam.id] = { count: count || 0, avg };
                } else {
                    stats[exam.id] = { count: 0 };
                }
            }

            setExamStats(stats);
        };

        fetchExamStats();
    }, [examinations, supabase]);

    // Fetch teacher's subjects and classes
    useEffect(() => {
        const fetchTeacherData = async () => {
            const { data: subjectsData } = await supabase
                .from("teacher_subjects")
                .select(`
                    id,
                    class_id,
                    subject_id,
                    subjects (
                        id,
                        name
                    ),
                    classes:class_id (
                        id,
                        name
                    )
                `)
                .eq("teacher_id", userId);

            if (subjectsData) {
                setTeacherSubjects(subjectsData as TeacherSubject[]);
            }

        };
        if (userId) {
            fetchTeacherData();
        }
    }, [userId, supabase]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);

        await supabase.from("examinations").delete().eq("id", deleteId);
        setDeleteId(null);
        setIsDeleting(false);
        router.refresh();
    };

    const fetchClassesForExam = async (examId: string) => {
        if (loadingClasses[examId]) return;

        setLoadingClasses(prev => ({ ...prev, [examId]: true }));

        // Group teacher subjects by class
        const classesMap = new Map<string, ClassWithSubjects>();

        teacherSubjects.forEach(ts => {
            if (ts.classes) {
                const classId = ts.class_id;
                if (!classesMap.has(classId)) {
                    classesMap.set(classId, {
                        ...ts.classes,
                        subjects: [],
                        teacherSubjects: []
                    });
                }
                const classObj = classesMap.get(classId)!;
                classObj.teacherSubjects.push(ts);
                if (ts.subjects) {
                    classObj.subjects.push(ts);
                }
            }
        });

        const uniqueClasses = Array.from(classesMap.values());

        setFilteredClasses(prev => ({
            ...prev,
            [examId]: uniqueClasses
        }));

        setLoadingClasses(prev => ({ ...prev, [examId]: false }));
    };

    const goToUpload = (examId: string, classId: string, subjectId: string) => {
        if (!examId || !classId || !subjectId) {
            alert("Please select both class and subject");
            return;
        }
        router.push(`/teacher-dashboard/results/upload?class=${classId}&examination=${examId}&subject=${subjectId}`);
    };

    const toggleExpand = (examId: string) => {
        const newExpanded = new Set(expandedExams);
        if (newExpanded.has(examId)) {
            newExpanded.delete(examId);
            // Clear selections when collapsing
            setSelectedClassForUpload(prev => ({
                ...prev,
                [examId]: ""
            }));
            setSelectedSubjectForUpload(prev => ({
                ...prev,
                [examId]: ""
            }));
        } else {
            newExpanded.add(examId);
            fetchClassesForExam(examId);
        }
        setExpandedExams(newExpanded);
    };

    const handleClassSelect = (examId: string, classId: string) => {
        setSelectedClassForUpload(prev => ({
            ...prev,
            [examId]: classId
        }));
        // Reset subject when class changes
        setSelectedSubjectForUpload(prev => ({
            ...prev,
            [examId]: ""
        }));
    };

    const handleSubjectSelect = (examId: string, subjectId: string) => {
        setSelectedSubjectForUpload(prev => ({
            ...prev,
            [examId]: subjectId
        }));
    };

    const getSelectedClassSubjects = (examId: string) => {
        const classId = selectedClassForUpload[examId];
        if (!classId || !filteredClasses[examId]) return [];

        const selectedClass = filteredClasses[examId].find(cls => cls.id === classId);
        return selectedClass?.subjects || [];
    };

    const getStatusColor = (exam: ExaminationWithTerm) => {
        const now = new Date();
        const start = exam.start_date ? new Date(exam.start_date) : null;
        const end = exam.end_date ? new Date(exam.end_date) : null;

        if (!start || !end) return "secondary";

        if (now < start) return "blue"; // Upcoming
        if (now >= start && now <= end) return "green"; // Active
        return "gray"; // Completed
    };

    const getStatusText = (exam: ExaminationWithTerm) => {
        const now = new Date();
        const start = exam.start_date ? new Date(exam.start_date) : null;
        const end = exam.end_date ? new Date(exam.end_date) : null;

        if (!start || !end) return "Not Scheduled";

        if (now < start) return "Upcoming";
        if (now >= start && now <= end) return "Active";
        return "Completed";
    };

    const formatDateRange = (exam: ExaminationWithTerm) => {
        if (!exam.start_date || !exam.end_date) return "No dates set";

        const start = new Date(exam.start_date);
        const end = new Date(exam.end_date);

        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            return `${start.getDate()} - ${end.getDate()} ${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`;
        }

        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    };

    // Get subjects taught by teacher
    const getTeacherSubjects = () => {
        const uniqueSubjects = Array.from(
            new Set(teacherSubjects.map(ts => ts.subjects?.name).filter(Boolean))
        );
        return uniqueSubjects;
    };

    const columns = [
        {
            key: "name",
            label: "Examination",
            render: (exam: ExaminationWithTerm) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{exam.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {exam.term?.name || "No term"} • {exam.year}
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "dates",
            label: "Dates",
            render: (exam: ExaminationWithTerm) => (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDateRange(exam)}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Start: {exam.start_date ? new Date(exam.start_date).toLocaleDateString() : "Not set"}</p>
                            <p>End: {exam.end_date ? new Date(exam.end_date).toLocaleDateString() : "Not set"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (exam: ExaminationWithTerm) => {
                const status = getStatusText(exam);
                const color = getStatusColor(exam);

                const colorClasses = {
                    blue: "bg-blue-100 text-blue-800 border-blue-200",
                    green: "bg-green-100 text-green-800 border-green-200",
                    gray: "bg-gray-100 text-gray-800 border-gray-200",
                    secondary: "bg-secondary text-secondary-foreground",
                };

                return (
                    <Badge variant="outline" className={`${colorClasses[color]} capitalize`}>
                        {status}
                    </Badge>
                );
            },
        },
        {
            key: "results",
            label: "Results",
            render: (exam: ExaminationWithTerm) => {
                const stats = examStats[exam.id] || { count: 0 };
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{stats.count}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Entries</div>
                                    </div>
                                    {stats.avg !== undefined && (
                                        <div className="space-y-1">
                                            <div className="font-medium">{stats.avg.toFixed(1)}</div>
                                            <div className="text-xs text-muted-foreground">Avg Score</div>
                                        </div>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{stats.count} result entries</p>
                                {stats.avg !== undefined && <p>Average score: {stats.avg.toFixed(1)}</p>}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
        },
        {
            key: "actions",
            label: "Actions",
            render: (exam: ExaminationWithTerm) => (
                <div className="flex items-center justify-end gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpand(exam.id)}
                                    className="h-8 w-8"
                                >
                                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedExams.has(exam.id) ? "rotate-180" : ""
                                        }`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{expandedExams.has(exam.id) ? "Hide upload options" : "Show upload options"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/teacher-dashboard/results?examination=${exam.id}`}
                                    className="flex items-center gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    View Results
                                    <ExternalLink className="ml-auto h-3 w-3" />
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => setDeleteId(exam.id)}
                                className="gap-2 text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Examination
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Teacher Info Banner */}
            {teacherSubjects.length > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white border border-blue-100">
                                    <BookMarked className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900">Your Teaching Assignments</h3>
                                    <p className="text-sm text-blue-700">
                                        Teaching {getTeacherSubjects().length} subjects across {filteredClasses[examinations[0]?.id]?.length || 0} classes
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {getTeacherSubjects().slice(0, 3).map((subject, index) => (
                                    <Badge key={index} variant="outline" className="bg-white/80 border-blue-200">
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        {subject}
                                    </Badge>
                                ))}
                                {getTeacherSubjects().length > 3 && (
                                    <Badge variant="outline" className="bg-white/80 border-blue-200">
                                        +{getTeacherSubjects().length - 3} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Award className="h-4 w-4" />
                                <span>Total Exams</span>
                            </div>
                            <div className="text-2xl font-bold">{examinations.length}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Active</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {examinations.filter(e => getStatusText(e) === "Active").length}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Upcoming</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {examinations.filter(e => getStatusText(e) === "Upcoming").length}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>Results Entered</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {Object.values(examStats).filter(s => s.count > 0).length}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Examinations Table */}
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={examinations}
                        emptyMessage={
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No Examinations Found</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create your first examination to start tracking results
                                </p>
                            </div>
                        }
                        className="border-0"
                    />

                    {/* Expanded Classes Section */}
                    {examinations.map((exam) => (
                        expandedExams.has(exam.id) && (
                            <div key={`classes-${exam.id}`} className="border-t border-border px-6 py-6 bg-gradient-to-b from-white to-muted/20">
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold">Upload Results</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Select a class and subject to upload results for <span className="font-semibold text-foreground">{exam.name}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <Badge variant="outline" className="gap-1">
                                                    <Filter className="h-3 w-3" />
                                                    Filtered to your classes and subjects only
                                                </Badge>
                                                <span className="text-muted-foreground">
                                                    Term: {exam.term?.name || "No term"} • Year: {exam.year}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selection Controls */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor={`class-select-${exam.id}`}>Select Class</Label>
                                            <Select
                                                value={selectedClassForUpload[exam.id] || ""}
                                                onValueChange={(value) => handleClassSelect(exam.id, value)}
                                            >
                                                <SelectTrigger id={`class-select-${exam.id}`}>
                                                    <SelectValue placeholder="Choose a class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredClasses[exam.id]?.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>
                                                            <div className="flex items-center gap-2">
                                                                <School className="h-4 w-4" />
                                                                <span>{cls.name}</span>
                                                                <Badge variant="outline" className="ml-auto text-xs">
                                                                    {cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''}
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`subject-select-${exam.id}`}>Select Subject</Label>
                                            <Select
                                                value={selectedSubjectForUpload[exam.id] || ""}
                                                onValueChange={(value) => handleSubjectSelect(exam.id, value)}
                                                disabled={!selectedClassForUpload[exam.id]}
                                            >
                                                <SelectTrigger id={`subject-select-${exam.id}`}>
                                                    <SelectValue placeholder={selectedClassForUpload[exam.id] ? "Choose a subject" : "Select a class first"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getSelectedClassSubjects(exam.id).map((subject) => (
                                                        <SelectItem key={subject.id} value={subject.subject_id}>
                                                            <div className="flex items-center gap-2">
                                                                <BookOpen className="h-4 w-4" />
                                                                <span>{subject.subjects.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Selected Info & Upload Button */}
                                    {selectedClassForUpload[exam.id] && selectedSubjectForUpload[exam.id] && (
                                        <Card className="border-primary/20 bg-primary/5">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-full bg-primary/10">
                                                                <Check className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold">Ready to Upload</h5>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Selected:{" "}
                                                                    <span className="font-medium text-foreground">
                                                                        {filteredClasses[exam.id]?.find(c => c.id === selectedClassForUpload[exam.id])?.name}
                                                                        {" • "}
                                                                        {getSelectedClassSubjects(exam.id).find(s => s.subject_id === selectedSubjectForUpload[exam.id])?.subjects.name}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => goToUpload(
                                                            exam.id,
                                                            selectedClassForUpload[exam.id],
                                                            selectedSubjectForUpload[exam.id]
                                                        )}
                                                        className="gap-2 bg-gradient-to-r from-primary to-primary/90"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                        Upload Results
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Classes List */}
                                    {loadingClasses[exam.id] ? (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {[1, 2, 3].map(i => (
                                                <Skeleton key={i} className="h-32 rounded-xl" />
                                            ))}
                                        </div>
                                    ) : filteredClasses[exam.id]?.length > 0 ? (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="font-medium text-lg">Your Classes</h5>
                                                <Badge variant="secondary">
                                                    {filteredClasses[exam.id].length} classes assigned
                                                </Badge>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {filteredClasses[exam.id].map((cls) => {
                                                    const isSelected = selectedClassForUpload[exam.id] === cls.id;
                                                    return (
                                                        <div
                                                            key={cls.id}
                                                            onClick={() => handleClassSelect(exam.id, cls.id)}
                                                            className={`relative rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer group ${isSelected
                                                                ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 ring-2 ring-primary/20'
                                                                : 'border-border hover:border-primary/50 hover:bg-accent/30'
                                                                }`}
                                                        >
                                                            <div className="space-y-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                                                                            <School className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="font-bold text-lg">{cls.name}</h5>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                Class ID: {cls.id.slice(0, 8)}...
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="rounded-full bg-primary p-1.5">
                                                                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Subjects List */}
                                                                {cls.subjects.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <Separator />
                                                                        <div className="flex items-center gap-2">
                                                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="text-sm font-medium">Your Subjects:</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {cls.subjects.slice(0, 3).map((subject) => (
                                                                                <Badge
                                                                                    key={subject.id}
                                                                                    variant={selectedSubjectForUpload[exam.id] === subject.subject_id ? "default" : "secondary"}
                                                                                    className="gap-1 text-xs cursor-pointer hover:bg-primary/20"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleSubjectSelect(exam.id, subject.subject_id);
                                                                                    }}
                                                                                >
                                                                                    {subject.subjects.name}
                                                                                </Badge>
                                                                            ))}
                                                                            {cls.subjects.length > 3 && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    +{cls.subjects.length - 3} more
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <Card className="border-dashed">
                                            <CardContent className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-4 rounded-full bg-muted">
                                                        <Users className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-lg">No Classes Assigned</h4>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            You haven't been assigned to teach any classes yet.
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" asChild className="mt-2">
                                                        Request Class Assignment
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border">
                                        <div className="text-sm">
                                            {selectedClassForUpload[exam.id] && selectedSubjectForUpload[exam.id] ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                                                        <Check className="h-4 w-4 text-green-600" />
                                                        <div>
                                                            <span className="font-medium">Ready: </span>
                                                            <span className="font-semibold text-foreground">
                                                                {filteredClasses[exam.id]?.find(c => c.id === selectedClassForUpload[exam.id])?.name}
                                                                {" • "}
                                                                {getSelectedClassSubjects(exam.id).find(s => s.subject_id === selectedSubjectForUpload[exam.id])?.subjects.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : selectedClassForUpload[exam.id] ? (
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                                    <span className="text-blue-700">Class selected. Now choose a subject.</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Select a class and subject to upload results</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => toggleExpand(exam.id)}
                                                className="gap-2"
                                            >
                                                <ChevronDown className="h-4 w-4 rotate-180" />
                                                Collapse
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-destructive/10 p-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <AlertDialogTitle>Delete Examination</AlertDialogTitle>
                                <AlertDialogDescription className="mt-2">
                                    This action cannot be undone. All results associated with this examination will be permanently deleted.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Examination"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}