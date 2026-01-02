import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

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

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await req.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!profile?.school_id) {
    return NextResponse.json({ error: "School not found" }, { status: 400 });
  }

  const validRows: any[] = [];
  const errors: any[] = [];

  rows.forEach((row: any, index: number) => {
    const parsed = teacherSchema.safeParse(row);

    if (!parsed.success) {
      errors.push({
        row: index + 2, // +2 = header + 1-index
        employee_number: row.employee_number ?? "N/A",
        message: parsed.error?.errors[0].message,
      });
    } else {
      validRows.push({
        ...parsed.data,
        school_id: profile.school_id,
      });
    }
  });

  if (validRows.length) {
    const { error } = await supabase.from("teachers").upsert(validRows, {
      onConflict: "school_id,employee_number",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    successCount: validRows.length,
    errorCount: errors.length,
    errors,
  });
}
