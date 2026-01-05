"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // make sure you import your supabase client

const teacherSchema = z.object({
  employee_number: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  qualification: z.string().optional(),
  date_hired: z.string().optional(),
  password: z.string().min(6),
});

export function TeacherBatchUpload() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const router = useRouter();

  const parseFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      return new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: reject,
        });
      });
    }

    if (ext === "xlsx") {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet);
    }

    throw new Error("Unsupported file type");
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    const successRows: any[] = [];
    const errorRows: any[] = [];

    try {
      const rows = await parseFile(file);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const result = teacherSchema.safeParse(row);

        if (!result.success) {
          errorRows.push({
            row: i + 1,
            employee_number: row.employee_number || "",
            message: Object.values(result.error.flatten().fieldErrors)
              .flat()
              .join(", "),
          });
        } else {
          const teacher = result.data;
          const password = teacher.password?.trim() || "password123";
          try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: teacher.email || `${teacher.employee_number}@herufi.app`,
              password, // replace with a proper password or generate one
              options: {
                emailRedirectTo:
                  process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
                  `${window.location.origin}/teacher-dashboard`,
                data: {
                  role: "teacher",
                  first_name: teacher.first_name,
                  last_name: teacher.last_name,
                  phone: teacher.phone || "",
                  employee_number: teacher.employee_number,
                  email: teacher.email || "",
                  gender: teacher.gender || "",
                  qualification: teacher.qualification || "",
                  date_hired: teacher.date_hired || "",
                },
              },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Failed to create user account");

            successRows.push(teacher);
          } catch (err: any) {
            errorRows.push({
              row: i + 1,
              employee_number: teacher.employee_number,
              message: err.message || "Failed to create account",
            });
          }
        }
      }

      setReport({
        successCount: successRows.length,
        errorCount: errorRows.length,
        errors: errorRows,
      });

      if (errorRows.length === 0) {
        toast.success(`${successRows.length} teachers uploaded successfully`);
      } else {
        toast.warning(
          `${successRows.length} uploaded, ${errorRows.length} failed`
        );
      }

      router.push("/dashboard/teachers");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept=".csv,.xlsx"
        disabled={loading}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />
      <p className="text-sm text-muted-foreground">Upload CSV or Excel file</p>
      {report?.errors?.length > 0 && (
        <div className="mt-6 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Row</th>
                <th className="p-2 text-left">Employee #</th>
                <th className="p-2 text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              {report.errors.map((err: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{err.row}</td>
                  <td className="p-2">{err.employee_number}</td>
                  <td className="p-2 text-red-600">{err.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
