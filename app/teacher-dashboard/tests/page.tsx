"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Edit,
    Trash2,
    Eye,
    Plus,
    BarChart3,
    Users,
    Award,
    TrendingUp,
    Calendar,
    BookOpen,
    School,
    FileText,
    Upload,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Sparkles,
    Clock,
    Target,
    Loader2,
    X,
} from "lucide-react"

const supabase = createClient()

/* -------------------------------------------------- */
/* TYPES                                              */
/* -------------------------------------------------- */

type TeacherSubject = {
    id: string
    subject_id: string
    class_id: string
    subjects: {
        id: string
        name: string
        code?: string
    }
    classes: {
        id: string
        name: string
        grade_level?: string
    }
}

type Test = {
    id: string
    name: string
    type: string
    max_marks: number
    description?: string
    created_at: string
    teacher_id: string
    subject_id: string
    class_id: string
    subjects?: {
        name: string
        code?: string
    }
    classes?: {
        name: string
        grade_level?: string
    }
    stats: {
        submissions: number
        avg: number | null
        max: number | null
        min: number | null
    }
}

/* -------------------------------------------------- */
/* EDIT TEST MODAL                                    */
/* -------------------------------------------------- */

interface EditTestModalProps {
    test: Test | null
    isOpen: boolean
    onClose: () => void
    onUpdate: (updatedTest: Partial<Test>) => Promise<void>
    isLoading: boolean
}

function EditTestModal({ test, isOpen, onClose, onUpdate, isLoading }: EditTestModalProps) {
    const [form, setForm] = useState({
        name: "",
        type: "quiz",
        max_marks: 100,
        description: "",
    })

    useEffect(() => {
        if (test) {
            setForm({
                name: test.name,
                type: test.type,
                max_marks: test.max_marks,
                description: test.description || "",
            })
        }
    }, [test])

    const handleSubmit = async () => {
        if (!test) return
        await onUpdate(form)
        onClose()
    }

    const testTypes = [
        { value: "quiz", label: "Quiz", color: "bg-blue-100 text-blue-800" },
        { value: "cat", label: "CAT", color: "bg-purple-100 text-purple-800" },
        { value: "assignment", label: "Assignment", color: "bg-green-100 text-green-800" },
        { value: "practical", label: "Practical", color: "bg-orange-100 text-orange-800" },
        { value: "exam", label: "Exam", color: "bg-red-100 text-red-800" },
        { value: "project", label: "Project", color: "bg-indigo-100 text-indigo-800" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Test
                    </DialogTitle>
                    <DialogDescription>
                        Update test details and configuration
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Test Name *</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Enter test name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Test Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {testTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: type.value })}
                                    className={`p-3 rounded-lg border text-center transition-all ${form.type === type.value
                                        ? `${type.color} border-current font-semibold`
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max_marks">Maximum Marks</Label>
                        <Input
                            id="max_marks"
                            type="number"
                            value={form.max_marks}
                            onChange={(e) => setForm({ ...form, max_marks: Number(e.target.value) })}
                            min="1"
                            max="1000"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Add a brief description..."
                        />
                    </div>

                    {test && (
                        <Alert className="bg-muted">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-1">
                                    <div className="font-medium">Current Subject & Class</div>
                                    <div className="text-sm">
                                        {test.subjects?.name} • {test.classes?.name}
                                        {test.classes?.grade_level && ` (Grade ${test.classes.grade_level})`}
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !form.name.trim()}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Update Test
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/* -------------------------------------------------- */
/* MAIN COMPONENT                                     */
/* -------------------------------------------------- */

export default function TeacherTestsPage() {
    const router = useRouter()
    const [teacherId, setTeacherId] = useState<string | null>(null)
    const [schoolId, setSchoolId] = useState<string | null>(null)
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([])
    const [tests, setTests] = useState<Test[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedTest, setSelectedTest] = useState<Test | null>(null)
    const [activeTab, setActiveTab] = useState("all")

    const [form, setForm] = useState({
        name: "",
        type: "quiz",
        teacher_subject_id: "",
        max_marks: 100,
        description: "",
    })

    /* -------------------------------------------------- */
    /* INIT                                              */
    /* -------------------------------------------------- */
    useEffect(() => {
        const init = async () => {
            setLoading(true)
            const { data: auth } = await supabase.auth.getUser()
            if (!auth.user) return

            const { data: teacher } = await supabase
                .from("teachers")
                .select("id, school_id, first_name, last_name")
                .eq("user_id", auth.user.id)
                .single()

            if (!teacher) return

            setTeacherId(teacher.id)
            setSchoolId(teacher.school_id)

            const { data } = await supabase
                .from("teacher_subjects")
                .select(`
                    id,
                    subject_id,
                    class_id,
                    subjects ( id, name, code ),
                    classes ( id, name, grade_level )
                `)
                .eq("teacher_id", teacher.id)

            setTeacherSubjects(data ?? [])
            await loadTestsWithStats(teacher.id)
            setLoading(false)
        }

        init()
    }, [])

    /* -------------------------------------------------- */
    /* LOAD TESTS + STATS                                 */
    /* -------------------------------------------------- */
    const loadTestsWithStats = async (teacherId: string) => {
        const { data: tests, error } = await supabase
            .from("tests")
            .select(`
                id,
                name,
                type,
                max_marks,
                created_at,
                teacher_id,
                subject_id,
                class_id,
                subjects ( name, code ),
                classes ( name, grade_level )
            `)
            .eq("teacher_id", teacherId)
            .order("created_at", { ascending: false })

        if (!tests) return

        const enriched: Test[] = []

        for (const test of tests) {
            const { data: results } = await supabase
                .from("test_results")
                .select("marks")
                .eq("test_id", test.id)

            const marks = results?.map((r) => Number(r.marks)) ?? []

            enriched.push({
                ...test,
                stats: {
                    submissions: marks.length,
                    avg:
                        marks.length > 0
                            ? Number(
                                (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1)
                            )
                            : null,
                    max: marks.length > 0 ? Math.max(...marks) : null,
                    min: marks.length > 0 ? Math.min(...marks) : null,
                },
            })
        }

        setTests(enriched)
    }

    /* -------------------------------------------------- */
    /* FILTERED TESTS                                     */
    /* -------------------------------------------------- */
    const filteredTests = tests.filter(test => {
        if (activeTab === "all") return true
        if (activeTab === "active") return test.stats.submissions > 0
        if (activeTab === "draft") return test.stats.submissions === 0
        if (activeTab === test.type) return true
        return false
    })

    /* -------------------------------------------------- */
    /* CREATE TEST                                       */
    /* -------------------------------------------------- */
    const createTest = async () => {
        if (!teacherId || !form.teacher_subject_id || !form.name.trim()) {
            alert("Please fill all required fields")
            return
        }

        const selected = teacherSubjects.find(
            (ts) => ts.id === form.teacher_subject_id
        )

        if (!selected) return

        setCreating(true)

        const { error } = await supabase.from("tests").upsert({
            name: form.name.trim(),
            type: form.type,
            school_id: schoolId,
            subject_id: selected.subject_id,
            class_id: selected.class_id,
            max_marks: form.max_marks,
            teacher_id: teacherId,
        })

        if (error) {
            alert(`Error creating test: ${error.message}`)
        } else {
            setForm({
                name: "",
                type: "quiz",
                teacher_subject_id: "",
                max_marks: 100,
                description: "",
            })
            await loadTestsWithStats(teacherId)
        }

        setCreating(false)
    }

    /* -------------------------------------------------- */
    /* UPDATE TEST                                        */
    /* -------------------------------------------------- */
    const updateTest = async (updatedData: Partial<Test>) => {
        if (!selectedTest) return

        setUpdating(true)

        const { error } = await supabase
            .from("tests")
            .update({
                name: updatedData.name,
                type: updatedData.type,
                max_marks: updatedData.max_marks,
            })
            .eq("id", selectedTest.id)

        if (error) {
            alert(`Error updating test: ${error.message}`)
        } else {
            await loadTestsWithStats(teacherId!)
        }

        setUpdating(false)
    }

    /* -------------------------------------------------- */
    /* DELETE TEST                                        */
    /* -------------------------------------------------- */
    const deleteTest = async (testId: string) => {
        if (!confirm("Are you sure you want to delete this test? All results will also be deleted.")) return

        const { error } = await supabase
            .from("tests")
            .delete()
            .eq("id", testId)

        if (error) {
            alert(`Error deleting test: ${error.message}`)
        } else {
            await loadTestsWithStats(teacherId!)
        }
    }

    /* -------------------------------------------------- */
    /* GET TYPE COLOR                                     */
    /* -------------------------------------------------- */
    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            quiz: "bg-blue-100 text-blue-800",
            cat: "bg-purple-100 text-purple-800",
            assignment: "bg-green-100 text-green-800",
            practical: "bg-orange-100 text-orange-800",
            exam: "bg-red-100 text-red-800",
            project: "bg-indigo-100 text-indigo-800",
        }
        return colors[type] || "bg-gray-100 text-gray-800"
    }

    /* -------------------------------------------------- */
    /* GET TYPE ICON                                      */
    /* -------------------------------------------------- */
    const getTypeIcon = (type: string) => {
        const icons: Record<string, React.ReactNode> = {
            quiz: <FileText className="h-4 w-4" />,
            cat: <BookOpen className="h-4 w-4" />,
            assignment: <Upload className="h-4 w-4" />,
            practical: <Target className="h-4 w-4" />,
            exam: <Award className="h-4 w-4" />,
            project: <Sparkles className="h-4 w-4" />,
        }
        return icons[type] || <FileText className="h-4 w-4" />
    }

    /* -------------------------------------------------- */
    /* RENDER                                             */
    /* -------------------------------------------------- */
    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Test Management
                        </span>
                    </h1>
                    <p className="text-muted-foreground">
                        Create, manage, and analyze tests for your classes
                    </p>
                </div>
                <Badge variant="outline" className="gap-2">
                    <School className="h-3 w-3" />
                    {teacherSubjects.length} subjects • {new Set(teacherSubjects.map(ts => ts.class_id)).size} classes
                </Badge>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column - Create Test Form */}
                <Card className="border-2 border-dashed border-primary/20">
                    <CardHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Create New Test</CardTitle>
                                <CardDescription>
                                    Set up a new test for your students
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Test Name *
                            </Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g., Mid-term Quiz, Final Exam"
                                className="h-11"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Test Type
                                </Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) => setForm({ ...form, type: v })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                        <SelectItem value="cat">CAT</SelectItem>
                                        <SelectItem value="assignment">Assignment</SelectItem>
                                        <SelectItem value="practical">Practical</SelectItem>
                                        <SelectItem value="exam">Exam</SelectItem>
                                        <SelectItem value="project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Max Marks
                                </Label>
                                <Input
                                    type="number"
                                    value={form.max_marks}
                                    onChange={(e) =>
                                        setForm({ ...form, max_marks: Number(e.target.value) })
                                    }
                                    className="h-11"
                                    min="1"
                                    max="1000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Subject & Class *
                            </Label>
                            <Select
                                value={form.teacher_subject_id}
                                onValueChange={(v) =>
                                    setForm({ ...form, teacher_subject_id: v })
                                }
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select subject and class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teacherSubjects.map((ts) => (
                                        <SelectItem key={ts.id} value={ts.id}>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-medium">{ts.subjects.name}</span>
                                                <span className="text-muted-foreground text-sm ml-2">
                                                    {ts.classes.name}
                                                    {ts.classes.grade_level && ` • Grade ${ts.classes.grade_level}`}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                    </CardContent>

                    <CardFooter>
                        <Button
                            onClick={createTest}
                            disabled={creating || !form.name.trim() || !form.teacher_subject_id}
                            className="w-full gap-2 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    Create Test
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Right Column - Tests List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-4">
                                <TabsTrigger value="all" className="gap-1">
                                    All
                                    <Badge variant="secondary" className="ml-1 h-5 min-w-5">
                                        {tests.length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="active" className="gap-1">
                                    Active
                                    <Badge variant="secondary" className="ml-1 h-5 min-w-5">
                                        {tests.filter(t => t.stats.submissions > 0).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="draft" className="gap-1">
                                    Draft
                                    <Badge variant="secondary" className="ml-1 h-5 min-w-5">
                                        {tests.filter(t => t.stats.submissions === 0).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="quiz" className="gap-1">
                                    Quizzes
                                    <Badge variant="secondary" className="ml-1 h-5 min-w-5">
                                        {tests.filter(t => t.type === 'quiz').length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-4">
                        {filteredTests.length > 0 ? (
                            filteredTests.map((test) => (
                                <Card key={test.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-3 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={`gap-1 ${getTypeColor(test.type)}`}>
                                                            {getTypeIcon(test.type)}
                                                            {test.type.toUpperCase()}
                                                        </Badge>
                                                        <div className="text-sm text-muted-foreground">
                                                            <Calendar className="inline h-3 w-3 mr-1" />
                                                            {new Date(test.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <h3 className="font-bold text-lg cursor-pointer hover:text-primary"
                                                        onClick={() => router.push(`/teacher/tests/${test.id}`)}>
                                                        {test.name}
                                                        <ChevronRight className="inline h-4 w-4 ml-1" />
                                                    </h3>

                                                    {test.description && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {test.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">{test.subjects?.name}</span>
                                                        </div>
                                                        <Separator orientation="vertical" className="h-4" />
                                                        <div className="flex items-center gap-1">
                                                            <School className="h-3 w-3 text-green-600" />
                                                            <span>{test.classes?.name}</span>
                                                            {test.classes?.grade_level && (
                                                                <span className="text-muted-foreground">
                                                                    (Grade {test.classes.grade_level})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Separator orientation="vertical" className="h-4" />
                                                        <div className="flex items-center gap-1">
                                                            <Target className="h-3 w-3 text-orange-600" />
                                                            <span>Max: {test.max_marks} marks</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setSelectedTest(test)
                                                                setEditModalOpen(true)
                                                            }}
                                                            className="h-8 w-8"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteTest(test.id)}
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/teacher-dashboard/tests/${test.id}`)}
                                                        className="gap-1"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="h-4 w-4 text-blue-600" />
                                                        <p className="text-lg font-bold">{test.stats.submissions}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Submissions</p>
                                                </div>

                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <BarChart3 className="h-4 w-4 text-green-600" />
                                                        <p className="text-lg font-bold">
                                                            {test.stats.avg ? `${test.stats.avg}` : "-"}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Average</p>
                                                </div>

                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <TrendingUp className="h-4 w-4 text-purple-600" />
                                                        <p className="text-lg font-bold">
                                                            {test.stats.max ? `${test.stats.max}` : "-"}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Top Score</p>
                                                </div>

                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                                        <p className="text-lg font-bold">
                                                            {test.stats.min ? `${test.stats.min}` : "-"}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Lowest</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <FileText className="h-12 w-12 text-muted-foreground" />
                                        <div>
                                            <h3 className="font-semibold">No Tests Found</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {activeTab === "all"
                                                    ? "Create your first test to get started"
                                                    : `No ${activeTab} tests found`}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Test Modal */}
            <EditTestModal
                test={selectedTest}
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false)
                    setSelectedTest(null)
                }}
                onUpdate={updateTest}
                isLoading={updating}
            />
        </div>
    )
}