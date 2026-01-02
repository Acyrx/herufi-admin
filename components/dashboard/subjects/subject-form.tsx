"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Subject } from "@/lib/types";

interface SubjectFormProps {
  subject?: Subject;
}

export function SubjectForm({ subject }: SubjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: subject?.name || "",
    code: subject?.code || "",
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

    const subjectData = {
      name: formData.name,
      code: formData.code || null,
      school_id: profile.school_id,
    };

    try {
      if (subject) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update(subjectData)
          .eq("id", subject.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("subjects")
          .insert(subjectData);
        if (insertError) throw insertError;
      }

      router.push("/dashboard/subjects");
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
          Subject Name *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Mathematics, English, Science"
          required
          className="bg-secondary border-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="text-foreground">
          Subject Code
        </Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g., MATH101, ENG201"
          className="bg-secondary border-input"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : subject ? "Update Subject" : "Add Subject"}
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
