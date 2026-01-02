"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Term } from "@/lib/types";

interface TermFormProps {
  term?: Term;
}

export function TermForm({ term }: TermFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: term?.name || "",
    code: term?.code || "",
    start_date: term?.start_date || "",
    end_date: term?.end_date || "",
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

    const termData = {
      name: formData.name,
      code: formData.code,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      school_id: profile.school_id,
    };

    try {
      if (term) {
        const { error: updateError } = await supabase
          .from("terms")
          .update(termData)
          .eq("id", term.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("terms")
          .insert(termData);
        if (insertError) throw insertError;
      }

      router.push("/dashboard/terms");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">
            Term Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Term 1, First Semester"
            required
            className="bg-secondary border-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="text-foreground">
            Term Code *
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., term_1, sem_1"
            required
            className="bg-secondary border-input"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-foreground">
            Start Date
          </Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date" className="text-foreground">
            End Date
          </Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : term ? "Update Term" : "Add Term"}
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
