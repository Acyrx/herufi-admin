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
    BookOpen,
    Eye,
    Lock,
    Hash,
    RefreshCw,
} from "lucide-react";

interface Test {
    id: string;
    name: string;
    type: string;
    class_id: string;
    stream_id?: string;
    max_marks: number;
    created_at: string;
    updated_at: string;
}

interface TestResultsListProps {
    classId?: string;
    streamId?: string;
}

export default function TestResultsList({ classId, streamId }: TestResultsListProps) {
    const [tests, setTests] = useState<Test[]>([]);
    const [testsWithResults, setTestsWithResults] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            // ---------- AUTH ----------
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            // ---------- STUDENT ----------
            const { data: student } = await supabase
                .from("students")
                .select("id")
                .eq("user_id", user.id)
                .single();
            if (!student) return;

            // ---------- TESTS ----------
            let query = supabase.from("tests").select("*").order("created_at", { ascending: false });
            if (classId) query = query.eq("class_id", classId);
            if (streamId) query = query.eq("stream_id", streamId);

            const { data: testsData, error: testsError } = await query;
            if (testsError) throw testsError;
            setTests(testsData || []);

            // ---------- TEST RESULTS ----------
            const { data: results } = await supabase
                .from("test_results")
                .select("test_id")
                .eq("student_id", student.id);

            setTestsWithResults(new Set((results || []).map((r) => r.test_id)));
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch tests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [classId, streamId]);

    const handleViewResults = (testId: string) => {
        if (!testsWithResults.has(testId)) return;
        router.push(`/test-results/${testId}`);
    };

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
            {tests.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No tests have been scheduled yet.</p>
                        <Button onClick={() => fetchData(true)} className="mt-4">
                            <RefreshCw className="h-4 w-4 mr-2" /> Reload
                        </Button>
                    </CardContent>
                </Card>
            )}

            {tests.map((test) => {
                const hasResult = testsWithResults.has(test.id);
                return (
                    <Card
                        key={test.id}
                        className={`transition ${hasResult ? "cursor-pointer hover:shadow-lg" : "opacity-70 cursor-not-allowed"}`}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{test.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        {test.type}
                                    </CardDescription>
                                </div>
                                <Badge variant={hasResult ? "default" : "outline"}>
                                    {hasResult ? "Result Ready" : <><Lock className="h-3 w-3 mr-1" />No Result</>}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Max Marks: {test.max_marks}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Created: {new Date(test.created_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                variant="ghost"
                                disabled={!hasResult}
                                className="w-full"
                                onClick={() => handleViewResults(test.id)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                {hasResult ? "View Result" : "Result Not Published"}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
