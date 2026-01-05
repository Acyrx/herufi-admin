"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar,
    Clock,
    School,
    RefreshCw,
    Eye,
    CalendarDays,
    Hash,
    Lock,
} from "lucide-react";

interface Examination {
    id: string;
    school_id: string;
    term_id: string;
    class_id?: string;
    name: string;
    year: number;
    start_date: string | null;
    end_date: string | null;
}

interface ExaminationsListProps {
    classId?: string;
}

export default function ExaminationsList({ classId }: ExaminationsListProps) {
    const supabase = createClient();
    const router = useRouter();

    const [exams, setExams] = useState<Examination[]>([]);
    const [examWithResults, setExamWithResults] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            /* ---------- AUTH ---------- */
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            /* ---------- STUDENT ---------- */
            const { data: student } = await supabase
                .from("students")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!student) return;

            /* ---------- EXAMS ---------- */
            let examQuery = supabase
                .from("examinations")
                .select("*")
                .order("year", { ascending: false })
                .order("start_date", { ascending: true });

            if (classId) examQuery = examQuery.eq("class_id", classId);

            const { data: examsData, error: examsError } = await examQuery;
            if (examsError) throw examsError;

            setExams(examsData || []);

            /* ---------- RESULTS ---------- */
            const { data: results } = await supabase
                .from("results")
                .select("examination_id")
                .eq("student_id", student.id);

            const examIds = new Set(
                (results || []).map((r) => r.examination_id)
            );

            setExamWithResults(examIds);
        } catch (err: any) {
            toast.error(err.message || "Failed to load examinations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [classId]);

    const handleExamClick = (exam: Examination) => {
        if (!examWithResults.has(exam.id)) return;

        const params = new URLSearchParams();
        params.set("examId", exam.id);
        params.set("termId", exam.term_id);
        params.set("year", exam.year.toString());
        if (classId) params.set("classId", classId);

        router.push(`/results?${params.toString()}`);
    };

    const formatDate = (date: string | null) =>
        date
            ? new Date(date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
            : "Not set";

    if (loading) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
                const hasResult = examWithResults.has(exam.id);

                return (
                    <Card
                        key={exam.id}
                        className={`transition ${hasResult
                            ? "cursor-pointer hover:shadow-lg"
                            : "opacity-70 cursor-not-allowed"
                            }`}
                        onClick={() => handleExamClick(exam)}
                    >
                        <CardHeader>
                            <div className="flex justify-between">
                                <div>
                                    <CardTitle>{exam.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        {exam.term_id}
                                    </CardDescription>
                                </div>

                                {hasResult ? (
                                    <Badge>Results Ready</Badge>
                                ) : (
                                    <Badge variant="outline">
                                        <Lock className="h-3 w-3 mr-1" />
                                        No Results
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                {exam.year}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(exam.start_date)}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatDate(exam.end_date)}
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                variant="ghost"
                                disabled={!hasResult}
                                className="w-full"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                {hasResult ? "View Results" : "Results Not Published"}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
