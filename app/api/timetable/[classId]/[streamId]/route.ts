import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string; streamId: string } }
) {
  const supabase = await createClient();
  const { classId, streamId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("timetables")
      .select("*")
      .eq("class_id", classId)
      .eq("stream_id", streamId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return existing time slots or empty array
    return NextResponse.json(data?.time_slots || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { classId: string; streamId: string } }
) {
  const supabase = await createClient();
  const { classId, streamId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { day, subject, teacher_id, startTime, endTime, location } = body;

    // Fetch existing timetable
    const { data: existing, error: fetchError } = await supabase
      .from("timetables")
      .select("*")
      .eq("class_id", classId)
      .eq("stream_id", streamId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let timeSlots = existing?.time_slots || [];
    timeSlots.push({ startTime, endTime, subject, teacher_id, location });

    if (existing) {
      const { error: updateError } = await supabase
        .from("timetables")
        .update({ time_slots: timeSlots, updated_at: new Date() })
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Slot added", timeSlots });
    } else {
      const { error: insertError } = await supabase.from("timetables").insert({
        class_id: classId,
        stream_id: streamId,
        day,
        time_slots: timeSlots,
      });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: "Timetable created", timeSlots },
        { status: 201 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
