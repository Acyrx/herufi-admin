"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Plus,
    User,
    BookOpen,
    Clock,
    MapPin,
    Calendar,
    School,
    Users,
    Edit,
    Trash2,
    Save,
    X,
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Bell,
    MoreHorizontal,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/* -------------------------------------------------- */
/* TYPES                                              */
/* -------------------------------------------------- */

interface TimetableSlot {
    id: string;
    subject: string;
    subject_code?: string;
    teacher: string;
    teacher_id?: string;
    startTime: string;
    endTime: string;
    location: string;
    day: string;
    color?: string;
}

interface Teacher {
    id: string;
    name: string;
    subjects: string[];
    email?: string;
}

interface ClassInfo {
    name: string;
    grade_level?: string;
    stream_name?: string;
}

interface TimetableProps {
    role: "admin" | "super_admin" | "teacher" | "student";
}

/* -------------------------------------------------- */
/* DAYS OF THE WEEK                                   */
/* -------------------------------------------------- */

const DAYS = [
    { value: "monday", label: "Monday", short: "Mon" },
    { value: "tuesday", label: "Tuesday", short: "Tue" },
    { value: "wednesday", label: "Wednesday", short: "Wed" },
    { value: "thursday", label: "Thursday", short: "Thu" },
    { value: "friday", label: "Friday", short: "Fri" },
    { value: "saturday", label: "Saturday", short: "Sat" },
];

/* -------------------------------------------------- */
/* TIME SLOTS                                         */
/* -------------------------------------------------- */

const TIME_SLOTS = [
    "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

/* -------------------------------------------------- */
/* COLOR SCHEMES FOR SUBJECTS                         */
/* -------------------------------------------------- */

const SUBJECT_COLORS = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-red-100 text-red-800 border-red-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
];

/* -------------------------------------------------- */
/* COMPONENT                                          */
/* -------------------------------------------------- */

export default function Timetable({ role }: TimetableProps) {
    const params = useParams<{ classId: string; streamId: string }>();
    const { classId, streamId } = params;

    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<string>("monday");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

    const [newSlot, setNewSlot] = useState<TimetableSlot>({
        id: "",
        subject: "",
        subject_code: "",
        teacher: "",
        teacher_id: "",
        startTime: "08:00",
        endTime: "09:00",
        location: "Classroom 101",
        day: "monday",
    });

    /* -------------------------------------------------- */
    /* FETCH DATA                                        */
    /* -------------------------------------------------- */

    useEffect(() => {
        if (!classId || !streamId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch timetable data
                const res = await fetch(`/api/timetable/${classId}/${streamId}`);
                const data = await res.json();

                // Add colors to subjects
                const coloredData = (data ?? []).map((slot: TimetableSlot, index: number) => ({
                    ...slot,
                    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
                }));

                setTimetable(coloredData);

                // Fetch teachers
                const teacherRes = await fetch(
                    `/api/suggestions/teachers/schoolId/${classId}`
                );
                const teacherData = await teacherRes.json();
                setTeachers(teacherData ?? []);

                // Fetch class info
                const classRes = await fetch(`/api/classes/${classId}`);
                const classData = await classRes.json();
                setClassInfo(classData);

            } catch (error) {
                console.error("Failed to load timetable:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, streamId]);

    /* -------------------------------------------------- */
    /* HELPER FUNCTIONS                                  */
    /* -------------------------------------------------- */

    const canEdit = role === "admin" || role === "super_admin";

    const getSubjectColor = (subject: string) => {
        const index = Array.from(new Set(timetable.map(s => s.subject))).indexOf(subject);
        return SUBJECT_COLORS[index % SUBJECT_COLORS.length] || "bg-gray-100 text-gray-800";
    };

    const getSlotsForDay = (day: string) => {
        return timetable
            .filter(slot => slot.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const getSlotsForTime = (day: string, time: string) => {
        return timetable.filter(slot =>
            slot.day === day &&
            slot.startTime <= time &&
            slot.endTime > time
        );
    };

    const getCurrentDaySlots = () => {
        return getSlotsForDay(activeDay);
    };

    const filteredSlots = getCurrentDaySlots().filter(slot =>
        searchTerm === "" ||
        slot.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* -------------------------------------------------- */
    /* CRUD OPERATIONS                                   */
    /* -------------------------------------------------- */

    const handleAddSlot = async () => {
        if (!newSlot.subject || !newSlot.teacher) {
            alert("Please fill in all required fields");
            return;
        }

        const res = await fetch(`/api/timetable/${classId}/${streamId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newSlot,
                color: getSubjectColor(newSlot.subject),
            }),
        });

        if (!res.ok) {
            alert("Failed to add slot");
            return;
        }

        const addedSlot = await res.json();
        setTimetable((prev) => [...prev, {
            ...addedSlot,
            color: getSubjectColor(addedSlot.subject),
        }]);

        setNewSlot({
            id: "",
            subject: "",
            subject_code: "",
            teacher: "",
            teacher_id: "",
            startTime: "08:00",
            endTime: "09:00",
            location: "Classroom 101",
            day: "monday",
        });

        setShowAddModal(false);
    };

    const handleEditSlot = (slot: TimetableSlot) => {
        setEditingSlot(slot);
        setNewSlot(slot);
        setShowAddModal(true);
    };

    const handleUpdateSlot = async () => {
        if (!editingSlot) return;

        const res = await fetch(`/api/timetable/${classId}/${streamId}/${editingSlot.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSlot),
        });

        if (!res.ok) {
            alert("Failed to update slot");
            return;
        }

        setTimetable((prev) =>
            prev.map((slot) =>
                slot.id === editingSlot.id ? { ...newSlot, color: slot.color } : slot
            )
        );

        setEditingSlot(null);
        setNewSlot({
            id: "",
            subject: "",
            subject_code: "",
            teacher: "",
            teacher_id: "",
            startTime: "08:00",
            endTime: "09:00",
            location: "Classroom 101",
            day: "monday",
        });
        setShowAddModal(false);
    };

    const handleDeleteSlot = async () => {
        if (!slotToDelete) return;

        const res = await fetch(`/api/timetable/${classId}/${streamId}/${slotToDelete}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            alert("Failed to delete slot");
            return;
        }

        setTimetable((prev) => prev.filter((slot) => slot.id !== slotToDelete));
        setSlotToDelete(null);
        setShowDeleteDialog(false);
    };

    const handleExport = () => {
        // Export functionality
        const data = timetable.map(slot => ({
            Day: slot.day.charAt(0).toUpperCase() + slot.day.slice(1),
            Subject: slot.subject,
            Teacher: slot.teacher,
            'Start Time': slot.startTime,
            'End Time': slot.endTime,
            Location: slot.location,
        }));

        const csv = [
            Object.keys(data[0]).join(','),
            ...data.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${classInfo?.name || 'timetable'}_schedule.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    /* -------------------------------------------------- */
    /* RENDER                                            */
    /* -------------------------------------------------- */

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4">
                    <Skeleton className="h-12 w-full" />
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-64 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Class Timetable
                                </span>
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <School className="h-3 w-3" />
                                    {classInfo?.name || "Class"} • {classInfo?.stream_name || "Stream"}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {getCurrentDaySlots().length} sessions today
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canEdit && (
                        <>
                            <Button variant="outline" className="gap-2" onClick={handleExport}>
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                        <Plus className="h-4 w-4" />
                                        Add Slot
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            {editingSlot ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                            {editingSlot ? "Edit Timetable Slot" : "Add New Timetable Slot"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Fill in the details for the timetable slot
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="day">Day *</Label>
                                                <Select
                                                    value={newSlot.day}
                                                    onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select day" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DAYS.map(day => (
                                                            <SelectItem key={day.value} value={day.value}>
                                                                {day.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="subject">Subject *</Label>
                                                <Input
                                                    id="subject"
                                                    value={newSlot.subject}
                                                    onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                                                    placeholder="Mathematics"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="teacher">Teacher *</Label>
                                                <Select
                                                    value={newSlot.teacher_id}
                                                    onValueChange={(value) => {
                                                        const teacher = teachers.find(t => t.id === value);
                                                        setNewSlot({
                                                            ...newSlot,
                                                            teacher: teacher?.name || "",
                                                            teacher_id: value,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select teacher" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teachers.map(teacher => (
                                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                                {teacher.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location</Label>
                                                <Input
                                                    id="location"
                                                    value={newSlot.location}
                                                    onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
                                                    placeholder="Classroom 101"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startTime">Start Time *</Label>
                                                <Input
                                                    id="startTime"
                                                    type="time"
                                                    value={newSlot.startTime}
                                                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="endTime">End Time *</Label>
                                                <Input
                                                    id="endTime"
                                                    type="time"
                                                    value={newSlot.endTime}
                                                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {newSlot.subject_code && (
                                            <div className="space-y-2">
                                                <Label htmlFor="subject_code">Subject Code</Label>
                                                <Input
                                                    id="subject_code"
                                                    value={newSlot.subject_code}
                                                    onChange={(e) => setNewSlot({ ...newSlot, subject_code: e.target.value })}
                                                    placeholder="MATH101"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={editingSlot ? handleUpdateSlot : handleAddSlot}
                                            className="gap-2"
                                        >
                                            {editingSlot ? (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Update Slot
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4" />
                                                    Add Slot
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-100">
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{timetable.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {DAYS.length} days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
                        <div className="p-2 rounded-lg bg-green-100">
                            <Clock className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getCurrentDaySlots().length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-100">
                            <User className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(timetable.map(slot => slot.teacher)).size}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Unique teachers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                        <div className="p-2 rounded-lg bg-orange-100">
                            <BookOpen className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(timetable.map(slot => slot.subject)).size}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Different subjects
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Days Navigation */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg font-medium">Select Day</Label>
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
                                <TabsList>
                                    <TabsTrigger value="grid" className="gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Grid View
                                    </TabsTrigger>
                                    <TabsTrigger value="list" className="gap-2">
                                        <List className="h-4 w-4" />
                                        List View
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <Button
                                    key={day.value}
                                    variant={activeDay === day.value ? "default" : "outline"}
                                    onClick={() => setActiveDay(day.value)}
                                    className={`flex-1 min-w-[100px] ${activeDay === day.value ? 'bg-primary text-primary-foreground' : ''}`}
                                >
                                    {day.label}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search subjects, teachers, or locations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timetable Content */}
            <TabsContent value="grid" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)} Timetable
                        </CardTitle>
                        <CardDescription>
                            {filteredSlots.length} sessions scheduled for today
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {viewMode === "grid" ? (
                            <div className="space-y-2">
                                {TIME_SLOTS.map((time, index) => {
                                    const slots = getSlotsForTime(activeDay, time);
                                    const isCurrentSlot = slots.length > 0;

                                    return (
                                        <div key={time} className="flex border-b last:border-b-0">
                                            <div className="w-24 p-3 bg-muted/50 font-medium text-sm flex items-center justify-center">
                                                {time}
                                            </div>
                                            <div className="flex-1 p-3">
                                                {isCurrentSlot ? (
                                                    <div className="space-y-2">
                                                        {slots.map((slot, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`p-3 rounded-lg border ${slot.color} hover:shadow-md transition-shadow`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className="gap-1">
                                                                                <BookOpen className="h-3 w-3" />
                                                                                {slot.subject}
                                                                                {slot.subject_code && ` (${slot.subject_code})`}
                                                                            </Badge>
                                                                            <Badge variant="outline" className="gap-1">
                                                                                <User className="h-3 w-3" />
                                                                                {slot.teacher}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                            <span className="flex items-center gap-1">
                                                                                <Clock className="h-3 w-3" />
                                                                                {slot.startTime} - {slot.endTime}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <MapPin className="h-3 w-3" />
                                                                                {slot.location}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {canEdit && (
                                                                        <div className="flex items-center gap-1">
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8"
                                                                                            onClick={() => handleEditSlot(slot)}
                                                                                        >
                                                                                            <Edit className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p>Edit slot</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                            onClick={() => {
                                                                                                setSlotToDelete(slot.id);
                                                                                                setShowDeleteDialog(true);
                                                                                            }}
                                                                                        >
                                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p>Delete slot</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                                        No class scheduled
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredSlots.length > 0 ? (
                                    filteredSlots.map((slot) => (
                                        <Card key={slot.id} className={`border-l-4 ${slot.color.split(' ')[0]}`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <Badge className={slot.color}>
                                                                <BookOpen className="h-3 w-3 mr-1" />
                                                                {slot.subject}
                                                            </Badge>
                                                            <Badge variant="outline" className="gap-1">
                                                                <User className="h-3 w-3" />
                                                                {slot.teacher}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {slot.startTime} - {slot.endTime}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {slot.location}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {canEdit && (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleEditSlot(slot)}
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setSlotToDelete(slot.id);
                                                                    setShowDeleteDialog(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="font-semibold">No sessions found</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {searchTerm ? "Try a different search term" : "No sessions scheduled for this day"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Delete Timetable Slot
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this timetable slot? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSlot}
                        >
                            Delete Slot
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper component for List icon
function List(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
    );
}