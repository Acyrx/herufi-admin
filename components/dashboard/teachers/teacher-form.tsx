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
import type { Teacher } from "@/lib/types";

interface TeacherFormProps {
  teacher?: Teacher;
}

export function TeacherForm({ teacher }: TeacherFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employee_number: teacher?.employee_number || "",
    first_name: teacher?.first_name || "",
    last_name: teacher?.last_name || "",
    email: teacher?.email || "",
    phone: teacher?.phone || "",
    gender: teacher?.gender || "",
    qualification: teacher?.qualification || "",
    date_hired: teacher?.date_hired || "",
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

    const teacherData = {
      ...formData,
      school_id: profile.school_id,
      email: formData.email || null,
      phone: formData.phone || null,
      gender: formData.gender || null,
      qualification: formData.qualification || null,
      date_hired: formData.date_hired || null,
    };

    try {
      if (teacher) {
        const { error: updateError } = await supabase
          .from("teachers")
          .update(teacherData)
          .eq("id", teacher.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("teachers")
          .insert(teacherData);
        if (insertError) throw insertError;
      }

      router.push("/dashboard/teachers");
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
          <Label htmlFor="employee_number" className="text-foreground">
            Employee Number *
          </Label>
          <Input
            id="employee_number"
            value={formData.employee_number}
            onChange={(e) =>
              setFormData({ ...formData, employee_number: e.target.value })
            }
            required
            className="bg-secondary border-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualification" className="text-foreground">
            Qualification
          </Label>
          <Input
            id="qualification"
            value={formData.qualification}
            onChange={(e) =>
              setFormData({ ...formData, qualification: e.target.value })
            }
            placeholder="e.g., B.Ed, M.Sc"
            className="bg-secondary border-input"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-foreground">
            First Name *
          </Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            required
            className="bg-secondary border-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-foreground">
            Last Name *
          </Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            required
            className="bg-secondary border-input"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground">
            Phone
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-foreground">
            Gender
          </Label>
          <Select
            value={formData.gender}
            onValueChange={(value) =>
              setFormData({ ...formData, gender: value })
            }
          >
            <SelectTrigger className="bg-secondary border-input">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_hired" className="text-foreground">
            Date Hired
          </Label>
          <Input
            id="date_hired"
            type="date"
            value={formData.date_hired}
            onChange={(e) =>
              setFormData({ ...formData, date_hired: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : teacher ? "Update Teacher" : "Add Teacher"}
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
