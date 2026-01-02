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
import type { Examination, Term } from "@/lib/types";

interface ExaminationFormProps {
  examination?: Examination;
  terms: Pick<Term, "id" | "name">[];
}

export function ExaminationForm({ examination, terms }: ExaminationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    name: examination?.name || "",
    term_id: examination?.term_id || "",
    year: examination?.year?.toString() || currentYear.toString(),
    start_date: examination?.start_date || "",
    end_date: examination?.end_date || "",
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

    if (!formData.term_id) {
      setError("Please select a term");
      setIsLoading(false);
      return;
    }

    const examData = {
      name: formData.name,
      term_id: formData.term_id,
      year: Number.parseInt(formData.year),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      school_id: profile.school_id,
    };

    try {
      if (examination) {
        const { error: updateError } = await supabase
          .from("examinations")
          .update(examData)
          .eq("id", examination.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("examinations")
          .insert(examData);
        if (insertError) throw insertError;
      }

      router.push("/dashboard/examinations");
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
          Examination Name *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Mid Term, Final Exam, Mock"
          required
          className="bg-secondary border-input"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="term_id" className="text-foreground">
            Term *
          </Label>
          <Select
            value={formData.term_id}
            onValueChange={(value) =>
              setFormData({ ...formData, term_id: value })
            }
          >
            <SelectTrigger className="bg-secondary border-input">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="text-foreground">
            Year *
          </Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
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
          {isLoading
            ? "Saving..."
            : examination
            ? "Update Examination"
            : "Add Examination"}
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
