"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const teacherSchema = z.object({
  employee_number: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  qualification: z.string().optional(),
  date_hired: z.string().optional(),
});

export function TeacherBatchUpload() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const router = useRouter();

  const parseFile = async (file: File) => {
    const ext = file.name.split(".").pop();

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

    try {
      const rows = await parseFile(file);

      const validRows = [];
      const errors: any[] = [];

      rows.forEach((row, index) => {
        const result = teacherSchema.safeParse(row);
        if (!result.success) {
          errors.push({ row: index + 1, errors: result.error.flatten() });
        } else {
          validRows.push(result.data);
        }
      });

      if (errors.length) {
        console.error(errors);
        toast.error(`${errors.length} rows failed validation`);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/teachers/batch", {
        method: "POST",
        body: JSON.stringify(validRows),
      });

      const data = await res.json();

      setReport(data);

      if (data.errorCount === 0) {
        toast.success(`${data.successCount} teachers uploaded successfully`);
      } else {
        toast.warning(
          `${data.successCount} uploaded, ${data.errorCount} failed`
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
