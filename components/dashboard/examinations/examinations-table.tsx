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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExaminationWithTerm extends Examination {
  term?: Pick<Term, "id" | "name"> | null;
}

interface ExaminationsTableProps {
  examinations: ExaminationWithTerm[];
  schoolId: string;
}

export function ExaminationsTable({ examinations, schoolId }: ExaminationsTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<Record<string, boolean>>({});
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());
  const [examStats, setExamStats] = useState<Record<string, { count: number; avg?: number }>>({});
  const [selectedClassForUpload, setSelectedClassForUpload] = useState<Record<string, string>>({});

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

    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    if (!error && data) {
      setClasses(data);
    }

    setLoadingClasses(prev => ({ ...prev, [examId]: false }));
  };

  const goToUpload = (examId: string) => {
    const classId = selectedClassForUpload[examId];
    if (classId) {
      router.push(`/dashboard/results/upload?class=${classId}&examination=${examId}`);
    }
  };

  const toggleExpand = (examId: string) => {
    const newExpanded = new Set(expandedExams);
    if (newExpanded.has(examId)) {
      newExpanded.delete(examId);
    } else {
      newExpanded.add(examId);
      fetchClassesForExam(examId);
    }
    setExpandedExams(newExpanded);
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
                <p>{expandedExams.has(exam.id) ? "Hide classes" : "Show classes"}</p>
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
                  href={`/dashboard/results?examination=${exam.id}`}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Results
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/examinations/${exam.id}/edit`}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Examination
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
    <div className="space-y-4">
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
              <div key={`classes-${exam.id}`} className="border-t border-border px-6 py-6 bg-muted/30">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Upload Results to Classes
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Select a class to upload results for {exam.name}
                      </p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{exam.term?.name || "No term"}</span>
                      <span className="mx-2">•</span>
                      <span>{exam.year}</span>
                    </div>
                  </div>

                  {/* Classes Grid */}
                  {loadingClasses[exam.id] ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  ) : classes.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {classes.map((cls) => {
                        const isSelected = selectedClassForUpload[exam.id] === cls.id;
                        return (
                          <button
                            key={cls.id}
                            onClick={() => setSelectedClassForUpload(prev => ({
                              ...prev,
                              [exam.id]: isSelected ? "" : cls.id
                            }))}
                            className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-md ${isSelected ? 'bg-primary/10' : 'bg-muted'
                                    }`}>
                                    <School className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'
                                      }`} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold">{cls.name}</h5>

                                  </div>
                                </div>


                              </div>

                              {isSelected && (
                                <div className="rounded-full bg-primary p-1">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="font-semibold">No Classes Found</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        No classes have been created for this school yet
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      {selectedClassForUpload[exam.id] ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>
                            Selected: <span className="font-semibold text-foreground">
                              {classes.find(c => c.id === selectedClassForUpload[exam.id])?.name}
                            </span>
                          </span>
                        </div>
                      ) : (
                        "No class selected"
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(exam.id)}
                      >
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Collapse
                      </Button>

                      <Button
                        size="sm"
                        disabled={!selectedClassForUpload[exam.id]}
                        onClick={() => goToUpload(exam.id)}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Results
                        <ChevronRight className="h-3 w-3" />
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