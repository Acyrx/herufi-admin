"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { Stream } from "@/lib/types";
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

interface StreamsManagerProps {
  classId: string;
  streams: Stream[];
}

export function StreamsManager({ classId, streams }: StreamsManagerProps) {
  const router = useRouter();
  const [newStreamName, setNewStreamName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamName.trim()) return;

    setIsAdding(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error: insertError } = await supabase.from("streams").insert({
        class_id: classId,
        name: newStreamName.trim(),
      });
      if (insertError) throw insertError;

      setNewStreamName("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStream = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const supabase = createClient();
    await supabase.from("streams").delete().eq("id", deleteId);
    setDeleteId(null);
    setIsDeleting(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Add Stream Form */}
      <form onSubmit={handleAddStream} className="flex items-center gap-2">
        <Input
          value={newStreamName}
          onChange={(e) => setNewStreamName(e.target.value)}
          placeholder="Stream name (e.g., A, B, East)"
          className="bg-secondary border-input"
        />
        <Button type="submit" disabled={isAdding || !newStreamName.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          {isAdding ? "Adding..." : "Add"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Streams List */}
      {streams.length > 0 ? (
        <div className="space-y-2">
          {streams.map((stream) => (
            <div
              key={stream.id}
              className="flex items-center justify-between p-3 bg-secondary rounded-md border border-border"
            >
              <span className="font-medium text-foreground">{stream.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteId(stream.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          No streams added yet. Add your first stream above.
        </p>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Stream
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this stream? Students in this
              stream will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStream}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
