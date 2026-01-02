"use client";

import type { Student, Stream, Class } from "@/lib/types";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
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

interface StudentWithStream extends Student {
  stream?: (Stream & { class?: Class }) | null;
}

interface StudentsTableProps {
  students: StudentWithStream[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const supabase = createClient();
    await supabase.from("students").delete().eq("id", deleteId);
    setDeleteId(null);
    setIsDeleting(false);
    router.refresh();
  };

  const columns = [
    {
      key: "admission_number",
      label: "Admission No.",
    },
    {
      key: "name",
      label: "Name",
      render: (student: StudentWithStream) =>
        `${student.first_name} ${student.last_name}`,
    },
    {
      key: "gender",
      label: "Gender",
      render: (student: StudentWithStream) => (
        <span className="capitalize">{student.gender || "-"}</span>
      ),
    },
    {
      key: "class",
      label: "Class",
      render: (student: StudentWithStream) => (
        <span>
          {student.stream?.class?.name || "-"}
          {student.stream?.name ? ` (${student.stream.name})` : ""}
        </span>
      ),
    },
    {
      key: "guardian_name",
      label: "Guardian",
    },
    {
      key: "guardian_phone",
      label: "Phone",
    },
    {
      key: "actions",
      label: "Actions",
      render: (student: StudentWithStream) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/students/${student.id}`}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/students/${student.id}/edit`}
                className="flex items-center"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(student.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={students}
        emptyMessage="No students found. Add your first student to get started."
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Student
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this student? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
