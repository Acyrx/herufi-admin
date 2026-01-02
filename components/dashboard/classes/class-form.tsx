"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Class, Teacher } from "@/lib/types";

interface ClassFormProps {
  classData?: Class;
  teachers: Pick<Teacher, "id" | "first_name" | "last_name">[];
}

export function ClassForm({ classData, teachers }: ClassFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: classData?.name || "",
    grade_level: classData?.grade_level?.toString() || "",
    class_teacher_id: classData?.class_teacher_id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (!profile?.school_id) {
      setError("No school associated with your account");
      setIsLoading(false);
      return;
    }

    const classPayload = {
      name: formData.name,
      school_id: profile.school_id,
      grade_level: formData.grade_level
        ? Number.parseInt(formData.grade_level)
        : null,
      class_teacher_id: formData.class_teacher_id || null,
    };

    try {
      if (classData) {
        const { error: updateError } = await supabase
          .from("classes")
          .update(classPayload)
          .eq("id", classData.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("classes")
          .insert(classPayload);
        if (insertError) throw insertError;
      }

      router.push("/dashboard/classes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">
          Class Name *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Form 1, Grade 5"
          required
          className="bg-secondary border-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade_level" className="text-foreground">
          Grade Level
        </Label>
        <Input
          id="grade_level"
          type="number"
          value={formData.grade_level}
          onChange={(e) =>
            setFormData({ ...formData, grade_level: e.target.value })
          }
          placeholder="e.g., 1, 2, 3"
          className="bg-secondary border-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="class_teacher_id" className="text-foreground">
          Class Teacher
        </Label>
        <Select
          value={formData.class_teacher_id}
          onValueChange={(value) =>
            setFormData({ ...formData, class_teacher_id: value })
          }
        >
          <SelectTrigger className="bg-secondary border-input">
            <SelectValue placeholder="Select class teacher" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="none">No Teacher</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.first_name} {teacher.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : classData ? "Update Class" : "Add Class"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
