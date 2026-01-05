"use client";

import type { Class, Teacher, Stream } from "@/lib/types";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Layers } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface ClassWithRelations extends Class {
  class_teacher?: Pick<Teacher, "id" | "first_name" | "last_name"> | null;
  streams?: Pick<Stream, "id" | "name">[];
}

interface ClassesTableProps {
  classes: ClassWithRelations[];
}

export function ClassesTable({ classes }: ClassesTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const supabase = createClient();
    await supabase.from("classes").delete().eq("id", deleteId);
    setDeleteId(null);
    setIsDeleting(false);
    router.refresh();
  };

  const columns = [
    {
      key: "name",
      label: "Class Name",
    },
    {
      key: "grade_level",
      label: "Grade Level",
      render: (cls: ClassWithRelations) => cls.grade_level || "-",
    },
    {
      key: "class_teacher",
      label: "Class Teacher",
      render: (cls: ClassWithRelations) =>
        cls.class_teacher
          ? `${cls.class_teacher.first_name} ${cls.class_teacher.last_name}`
          : "-",
    },
    {
      key: "streams",
      label: "Streams",
      render: (cls: ClassWithRelations) => (
        <div className="flex flex-wrap gap-1">
          {cls.streams && cls.streams.length > 0 ? (
            cls.streams.map((stream) => (
              <Badge key={stream.id} variant="secondary" className="text-xs">
                {stream.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">No streams</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (cls: ClassWithRelations) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/classes/${cls.id}/streams`}
                className="flex items-center"
              >
                <Layers className="h-4 w-4 mr-2" />
                Manage Streams
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/classes/assign-subjects?classId=${cls.id}`}
                className="flex items-center"
              >
                <Layers className="h-4 w-4 mr-2" />
                Assign Subjects
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/classes/${cls.id}/edit`}
                className="flex items-center"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(cls.id)}
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
        data={classes}
        emptyMessage="No classes found. Add your first class to get started."
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Class
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this class? All streams in this
              class will also be deleted.
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
