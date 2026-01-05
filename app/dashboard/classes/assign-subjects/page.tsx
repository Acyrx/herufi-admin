"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Loader2,
    User,
    BookOpen,
    Link,
    Save,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Search,
    Users,
    Bookmark,
    Plus,
    X,
    Eye,
    Calendar,
} from "lucide-react";

type Teacher = {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
};

type Subject = {
    id: string;
    name: string;
    code?: string;
    description?: string;
};

type TeacherAssignment = {
    teacher_id: string;
    subjects: string[];
    teacher_name: string;
};

type ExistingAssignment = {
    id: string;
    teacher_id: string;
    subject_id: string;
    teacher: Teacher;
    subject: Subject;
};

export default function AssignSubjectsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const classId = searchParams.get("classId");
    const supabase = createClient();

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [assignments, setAssignments] = useState<Record<string, TeacherAssignment>>({});
    const [existingAssignments, setExistingAssignments] = useState<ExistingAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"assign" | "view">("assign");
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());

    // Statistics
    const assignedTeacherCount = Object.values(assignments).filter(a => a.subjects.length > 0).length;
    const totalAssignments = Object.values(assignments).reduce((sum, a) => sum + a.subjects.length, 0);
    const assignedSubjectCount = new Set(
        Object.values(assignments).flatMap(a => a.subjects)
    ).size;

    /* ---------------- FETCH DATA ---------------- */
    useEffect(() => {
        if (!classId) return;

        const fetchData = async () => {
            setLoading(true);

            try {
                // Fetch class info
                const { data: classData, error: classError } = await supabase
                    .from("classes")
                    .select("id, name, school_id")
                    .eq("id", classId)
                    .single();

                if (classError || !classData) {
                    console.error("Class not found:", classError?.message);
                    setLoading(false);
                    return;
                }

                const schoolId = classData.school_id;

                // Fetch teachers
                const { data: teachersData } = await supabase
                    .from("teachers")
                    .select("id, first_name, last_name, email")
                    .eq("school_id", schoolId)
                    .order("first_name");


                // Fetch subjects
                const { data: subjectsData } = await supabase
                    .from("subjects")
                    .select("id, name, code")
                    .eq("school_id", schoolId)
                    .order("name");



                // Fetch existing assignments
                const { data: existingData } = await supabase
                    .from("teacher_subjects")
                    .select(`
            id,
            teacher_id,
            subject_id,
            teacher:teachers (id, first_name, last_name, email),
            subject:subjects (id, name, code)
          `)
                    .eq("class_id", classId);

                if (teachersData) setTeachers(teachersData);
                if (subjectsData) setSubjects(subjectsData);
                if (existingData) setExistingAssignments(existingData as any);

                // Initialize assignment state
                const initAssignments: Record<string, TeacherAssignment> = {};
                teachersData?.forEach((t) => {
                    const teacherSubjects = existingData
                        ?.filter(e => e.teacher_id === t.id)
                        .map(e => e.subject_id) || [];

                    initAssignments[t.id] = {
                        teacher_id: t.id,
                        subjects: teacherSubjects,
                        teacher_name: `${t.first_name} ${t.last_name}`
                    };
                });
                setAssignments(initAssignments);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, supabase]);

    /* ---------------- HANDLE SUBJECT SELECTION ---------------- */
    const handleSubjectToggle = (teacherId: string, subjectId: string) => {
        setAssignments((prev) => {
            const currentSubjects = prev[teacherId].subjects;
            const newSubjects = currentSubjects.includes(subjectId)
                ? currentSubjects.filter((id) => id !== subjectId)
                : [...currentSubjects, subjectId];

            return {
                ...prev,
                [teacherId]: {
                    ...prev[teacherId],
                    subjects: newSubjects,
                },
            };
        });
    };

    /* ---------------- BULK ASSIGNMENT ---------------- */
    const handleBulkAssign = () => {
        if (selectedSubjects.size === 0) return;

        const newAssignments = { ...assignments };
        const subjectIds = Array.from(selectedSubjects);

        Object.keys(newAssignments).forEach(teacherId => {
            const teacherSubs = new Set([...newAssignments[teacherId].subjects, ...subjectIds]);
            newAssignments[teacherId].subjects = Array.from(teacherSubs);
        });

        setAssignments(newAssignments);
        setSelectedSubjects(new Set());
    };

    /* ---------------- CLEAR TEACHER ASSIGNMENTS ---------------- */
    const clearTeacherAssignments = (teacherId: string) => {
        setAssignments(prev => ({
            ...prev,
            [teacherId]: {
                ...prev[teacherId],
                subjects: []
            }
        }));
    };

    /* ---------------- SAVE ASSIGNMENTS ---------------- */
    const saveAssignments = async () => {
        if (!classId) return;

        setSaving(true);

        try {
            const payload = Object.values(assignments)
                .flatMap((assignment) =>
                    assignment.subjects.map((subjectId) => ({
                        teacher_id: assignment.teacher_id,
                        subject_id: subjectId,
                        class_id: classId,
                    }))
                );

            // First, delete all existing assignments for this class
            await supabase
                .from("teacher_subjects")
                .delete()
                .eq("class_id", classId);

            // Then insert new assignments
            if (payload.length > 0) {
                const { error } = await supabase
                    .from("teacher_subjects")
                    .upsert(payload, { onConflict: "teacher_id,subject_id,class_id" });

                if (error) throw error;
            }

            // Refresh existing assignments
            const { data: updatedData } = await supabase
                .from("teacher_subjects")
                .select(`
          id,
          teacher_id,
          subject_id,
          teacher:teachers (id, first_name, last_name, email),
          subject:subjects (id, name, code)
        `)
                .eq("class_id", classId);

            if (updatedData) setExistingAssignments(updatedData as any);

            alert("Assignments saved successfully!");

        } catch (error: any) {
            alert("Error saving assignments: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    /* ---------------- FILTERED TEACHERS ---------------- */
    const filteredTeachers = teachers.filter(teacher => {
        if (!searchTerm) return true;

        const term = searchTerm.toLowerCase();
        const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
        const teacherSubjects = assignments[teacher.id]?.subjects || [];
        const assignedSubjectNames = teacherSubjects
            .map(id => subjects.find(s => s.id === id)?.name?.toLowerCase() || "")
            .join(" ");

        return (
            fullName.includes(term) ||
            teacher.email?.toLowerCase().includes(term) ||
            assignedSubjectNames.includes(term)
        );
    });

    if (!classId) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing Class</AlertTitle>
                    <AlertDescription>
                        No class selected. Please select a class to assign subjects.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
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
                        <h1 className="text-3xl font-bold tracking-tight">Assign Subjects</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Map teachers to subjects they teach in this class
                    </p>
                </div>


            </div>

            {/* Stats Cards */}

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Teachers Assigned</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignedTeacherCount}</div>
                        <p className="text-xs text-muted-foreground">
                            out of {teachers.length} teachers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAssignments}</div>
                        <p className="text-xs text-muted-foreground">
                            across {assignedSubjectCount} subjects
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subjects.length}</div>
                        <p className="text-xs text-muted-foreground">
                            available for assignment
                        </p>
                    </CardContent>
                </Card>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-auto">

                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assign" className="gap-2">
                        <Link className="h-4 w-4" />
                        Assign Subjects
                    </TabsTrigger>
                    <TabsTrigger value="view" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View Assignments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assign" className="space-y-6">
                    {/* Bulk Assignment Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Bulk Assignment
                            </CardTitle>
                            <CardDescription>
                                Select subjects to assign to all teachers at once
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {subjects.map(subject => (
                                    <Badge
                                        key={subject.id}
                                        variant={selectedSubjects.has(subject.id) ? "default" : "outline"}
                                        className="cursor-pointer gap-2"
                                        onClick={() => {
                                            const newSelected = new Set(selectedSubjects);
                                            if (newSelected.has(subject.id)) {
                                                newSelected.delete(subject.id);
                                            } else {
                                                newSelected.add(subject.id);
                                            }
                                            setSelectedSubjects(newSelected);
                                        }}
                                    >
                                        {subject.name}
                                        {selectedSubjects.has(subject.id) && (
                                            <CheckCircle className="h-3 w-3" />
                                        )}
                                    </Badge>
                                ))}
                            </div>
                            <Button
                                onClick={handleBulkAssign}
                                disabled={selectedSubjects.size === 0}
                                className="gap-2"
                            >
                                <Users className="h-4 w-4" />
                                Assign to All Teachers
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search teachers or subjects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                            Showing {filteredTeachers.length} of {teachers.length} teachers
                        </div>
                    </div>

                    {/* Teachers List */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTeachers.map((teacher) => {
                            const teacherAssignments = assignments[teacher.id]?.subjects || [];
                            const teacherSubjectCount = teacherAssignments.length;

                            return (
                                <Card key={teacher.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div>{teacher.first_name} {teacher.last_name}</div>
                                                        {teacher.email && (
                                                            <div className="text-sm text-muted-foreground font-normal">
                                                                {teacher.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="gap-1">
                                                        <BookOpen className="h-3 w-3" />
                                                        {teacherSubjectCount} subjects
                                                    </Badge>
                                                    {teacherSubjectCount > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => clearTeacherAssignments(teacher.id)}
                                                            className="h-6 px-2"
                                                        >
                                                            <X className="h-3 w-3" />
                                                            Clear
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pb-3">
                                        <Label className="text-sm font-medium mb-2 block">Assigned Subjects</Label>
                                        {teacherSubjectCount > 0 ? (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {teacherAssignments.map(subjectId => {
                                                    const subject = subjects.find(s => s.id === subjectId);
                                                    if (!subject) return null;

                                                    return (
                                                        <Badge
                                                            key={subjectId}
                                                            variant="secondary"
                                                            className="gap-1 cursor-pointer hover:bg-secondary/80"
                                                            onClick={() => handleSubjectToggle(teacher.id, subjectId)}
                                                        >
                                                            {subject.name}
                                                            <X className="h-3 w-3" />
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground italic mb-4">
                                                No subjects assigned yet
                                            </div>
                                        )}

                                        <Label className="text-sm font-medium mb-2 block">Available Subjects</Label>
                                        <ScrollArea className="h-32 pr-4">
                                            <div className="space-y-2">
                                                {subjects.map(subject => {
                                                    const isAssigned = teacherAssignments.includes(subject.id);

                                                    return (
                                                        <div key={subject.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`${teacher.id}-${subject.id}`}
                                                                checked={isAssigned}
                                                                onCheckedChange={() => handleSubjectToggle(teacher.id, subject.id)}
                                                            />
                                                            <Label
                                                                htmlFor={`${teacher.id}-${subject.id}`}
                                                                className="text-sm font-normal cursor-pointer flex-1"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span>{subject.name}</span>
                                                                    {subject.code && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {subject.code}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {subject.description && (
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                        {subject.description}
                                                                    </div>
                                                                )}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {filteredTeachers.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-semibold">No teachers found</h3>
                                <p className="text-muted-foreground mt-1">
                                    {searchTerm ? "Try a different search term" : "No teachers available"}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                <TabsContent value="view">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Current Assignments
                            </CardTitle>
                            <CardDescription>
                                View all teacher-subject mappings for this class
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {existingAssignments.length > 0 ? (
                                <div className="space-y-6">
                                    {teachers.map(teacher => {
                                        const teacherAssignments = existingAssignments
                                            .filter(a => a.teacher_id === teacher.id)
                                            .map(a => a.subject);

                                        if (teacherAssignments.length === 0) return null;

                                        return (
                                            <div key={teacher.id} className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">
                                                            {teacher.first_name} {teacher.last_name}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            Teaching {teacherAssignments.length} subjects
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pl-12">
                                                    {teacherAssignments.map(subject => (
                                                        <Card key={subject.id} className="border-border">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="space-y-1">
                                                                        <div className="font-medium">{subject.name}</div>
                                                                        {subject.code && (
                                                                            <div className="text-sm text-muted-foreground">
                                                                                Code: {subject.code}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Badge variant="outline">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        Assigned
                                                                    </Badge>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>

                                                <Separator className="my-4" />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="font-semibold">No assignments yet</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Assign subjects to teachers using the "Assign Subjects" tab
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {/* Save Button */}
            <div className="sticky bottom-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="font-medium">{assignedTeacherCount} teachers assigned</span>
                            <span className="font-medium">{totalAssignments} total assignments</span>
                            <span className="font-medium">{assignedSubjectCount} subjects covered</span>
                        </div>
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
                            onClick={saveAssignments}
                            disabled={saving || totalAssignments === 0}
                            className="gap-2 min-w-32"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Assignments
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}