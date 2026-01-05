"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { Student, Stream, Class } from "@/lib/types";
import bcrypt from "bcryptjs";
import { normalizeAndValidateAdmissionNumber } from "@/lib/helper";

interface StreamWithClass extends Stream {
  class?: Class | null;
}

interface StudentFormProps {
  student?: Student;
  streams: StreamWithClass[];
}

export function StudentForm({ student, streams }: StudentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admissionError, setAdmissionError] = useState<string | null>(null);
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [admissionSuffix, setAdmissionSuffix] = useState("");
  const [fullAdmissionNumber, setFullAdmissionNumber] = useState("");

  const [formData, setFormData] = useState({
    admission_number: student?.admission_number || "",
    first_name: student?.first_name || "",
    last_name: student?.last_name || "",
    date_of_birth: student?.date_of_birth || "",
    gender: student?.gender || "",
    stream_id: student?.stream_id || "",
    guardian_name: student?.guardian_name || "",
    guardian_phone: student?.guardian_phone || "",
    address: student?.address || "",
    password: "",
  });

  const supabase = createClient();

  useEffect(() => {
    const loadSchoolCode = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) {
        setSchoolCode(null);
        return;
      }

      const { data: school } = await supabase
        .from("schools")
        .select("code")
        .eq("id", profile.school_id)
        .single();

      setSchoolCode(school?.code ?? null);

      if (schoolCode && admissionSuffix) {
        setFullAdmissionNumber(`${schoolCode}/${admissionSuffix}`);
      } else {
        setFullAdmissionNumber("");
      }
    };

    loadSchoolCode();
  }, [supabase]);

  const admissionRegex = useMemo(() => {
    if (!schoolCode) return null;
    return new RegExp(`^${schoolCode}\\/\\d{1,4}$`);
  }, [schoolCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Get the user's school_id
    if (!schoolCode || !admissionRegex) {
      setError("School not allowed to register students");
      setIsLoading(false);
      return;
    }

    if (!admissionRegex.test(formData.admission_number)) {
      setError(
        `Admission number must be in format ${schoolCode}/0 – ${schoolCode}/9999`
      );
      setIsLoading(false);
      return;
    }


    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setIsLoading(false);
      return;
    }


    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("admission_number", formData.admission_number)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log(profile.id)
    const studentData = {
      admission_number: formData.admission_number,
      first_name: formData.first_name,
      last_name: formData.last_name,
      school_id: profile.school_id,
      stream_id: formData.stream_id,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender,
      guardian_name: formData.guardian_name || null,
      guardian_phone: formData.guardian_phone || null,
      address: formData.address || null,
    };

    const generatedEmail = `${normalizeAndValidateAdmissionNumber(formData.admission_number)}@herufi.app`


    try {
      if (student) {
        const { error: updateError } = await supabase
          .from("students")
          .update(studentData,)
          .eq("id", student.id);
        if (updateError) throw updateError;

      } else {

        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email: generatedEmail,
            password: formData.password,
            options: {
              data: {
                role: "student",
                admission_number: formData.admission_number,
                first_name: formData.first_name,
                last_name: formData.last_name,
                school_id: profile.school_id,
                stream_id: formData.stream_id,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                guardian_name: formData.guardian_name,
                guardian_phone: formData.guardian_phone,
                address: formData.address,
              },
            },
          })



        if (authError) throw authError
        if (!authData.user) throw new Error("Auth user not created")
      }


      router.push("/dashboard/students");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Group streams by class
  const streamsByClass = streams.reduce((acc, stream) => {
    const className = stream.class?.name || "No Class";
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(stream);
    return acc;
  }, {} as Record<string, StreamWithClass[]>);

  if (!schoolCode) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold text-destructive">
          Registration Disabled
        </h2>
        <p className="text-muted-foreground mt-2">
          Your school does not have a valid school code. Please contact the
          system administrator.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Admission Number *</Label>

          <div className="flex items-center rounded-md border border-input bg-secondary">
            {/* Prefix */}
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-r">
              {schoolCode ?? "___"}/
            </div>

            {/* Suffix */}
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="____"
              value={admissionSuffix}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                setAdmissionSuffix(value);
                setFormData({
                  ...formData,
                  admission_number: `${schoolCode}/${value}`,
                });
              }}
              className="border-0 focus-visible:ring-0"
              required
            />
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground">
            Format: {schoolCode}/0 – {schoolCode}/9999
          </p>
        </div>

        {admissionError && (
          <p className="text-sm text-destructive">{admissionError}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="stream_id" className="text-foreground">
            Class & Stream
          </Label>
          <Select
            value={formData.stream_id}
            onValueChange={(value) =>
              setFormData({ ...formData, stream_id: value })
            }
          >
            <SelectTrigger className="bg-secondary border-input">
              <SelectValue placeholder="Select class & stream" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="none">No Stream</SelectItem>
              {Object.entries(streamsByClass).map(
                ([className, classStreams]) => (
                  <div key={className}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {className}
                    </div>
                    {classStreams.map((stream) => (
                      <SelectItem key={stream.id} value={stream.id}>
                        {className} - {stream.name}
                      </SelectItem>
                    ))}
                  </div>
                )
              )}
            </SelectContent>
          </Select>
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
          <Label htmlFor="date_of_birth" className="text-foreground">
            Date of Birth
          </Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) =>
              setFormData({ ...formData, date_of_birth: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>

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
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guardian_name" className="text-foreground">
            Guardian Name
          </Label>
          <Input
            id="guardian_name"
            value={formData.guardian_name}
            onChange={(e) =>
              setFormData({ ...formData, guardian_name: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian_phone" className="text-foreground">
            Guardian Phone
          </Label>
          <Input
            id="guardian_phone"
            value={formData.guardian_phone}
            onChange={(e) =>
              setFormData({ ...formData, guardian_phone: e.target.value })
            }
            className="bg-secondary border-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-foreground">
          Address
        </Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          rows={3}
          className="bg-secondary border-input"
        />
      </div>

      {!student && (
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            Student Password *
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            className="bg-secondary border-input"
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : student ? "Update Student" : "Add Student"}
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


