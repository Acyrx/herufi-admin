"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Papa from "papaparse";
import bcrypt from "bcryptjs";
import type { Stream } from "@/lib/types";

interface Class {
  id: string;
  name: string;
}
interface StreamWithClass extends Stream {
  class?: Class | null;
}

export function StudentBatchUpload({
  streams,
}: {
  streams: StreamWithClass[];
}) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string[]>([]);
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamWithClass | null>(
    null
  );

  // Get current user and school code
  const fetchSchoolCode = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (!profile?.school_id) return null;

    const { data: school } = await supabase
      .from("schools")
      .select("code")
      .eq("id", profile.school_id)
      .single();

    setSchoolCode(school?.code ?? null);
    return { schoolId: profile.school_id, schoolCode: school?.code ?? null };
  };

  const streamsByClass = streams.reduce((acc, stream) => {
    const className = stream.class?.name || "No Class";
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(stream);
    return acc;
  }, {} as Record<string, StreamWithClass[]>);

  const handleUpload = async () => {
    if (!file) return alert("Select a CSV file first");
    if (!selectedStream) return alert("Please select a class & stream first");

    setLoading(true);
    setReport([]);

    const schoolInfo = await fetchSchoolCode();
    if (!schoolInfo) {
      alert("Cannot determine school code. Check your profile.");
      setLoading(false);
      return;
    }

    const { schoolId, schoolCode } = schoolInfo;
    const rows: any[] = await new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data),
      });
    });

    const newReport: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const admission = row.admission_number?.toUpperCase() || "";
      const admissionRegex = new RegExp(`^${schoolCode}\\/\\d{1,4}$`);

      if (!admissionRegex.test(admission)) {
        newReport.push(`Row ${i + 2}: Invalid admission number "${admission}"`);
        continue;
      }

      const password = row.password?.trim() || "password123";
      const hashedPassword = await bcrypt.hash(password, 10);

      const studentData = {
        admission_number: admission,
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        date_of_birth: row.date_of_birth || null,
        gender: row.gender || null,
        stream_id: selectedStream.id,
        class_id: selectedStream.class?.id || null,
        guardian_name: row.guardian_name || null,
        guardian_phone: row.guardian_phone || null,
        address: row.address || null,
        school_id: schoolId,
        password_hash: hashedPassword,
      };

      const { error } = await supabase.from("students").insert(studentData);
      if (error) newReport.push(`Row ${i + 2}: Failed - ${error.message}`);
      else newReport.push(`Row ${i + 2}: Success`);
    }

    setReport(newReport);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Select
          value={selectedStream?.id || ""}
          onValueChange={(id) => {
            const stream = streams.find((s) => s.id === id) || null;
            setSelectedStream(stream);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select class & stream" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="none">No Stream</SelectItem>
            {Object.entries(streamsByClass).map(([className, classStreams]) => (
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
            ))}
          </SelectContent>
        </Select>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Batch"}
      </Button>

      {report.length > 0 && (
        <div className="mt-4 space-y-1">
          <h3 className="font-semibold">Upload Report:</h3>
          {report.map((line, idx) => (
            <p
              key={idx}
              className={
                line.includes("Success") ? "text-green-600" : "text-red-600"
              }
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
