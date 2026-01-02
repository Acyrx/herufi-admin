"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, User, Book } from "lucide-react"; // lucide icons
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface TimetableSlot {
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  location?: string;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
}

export default function Timetable() {
  const { classId, streamId } = useParams();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({
    subject: "",
    teacher: "",
    startTime: "",
    endTime: "",
    location: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/timetable/${classId}/${streamId}`);
        const data = await res.json();
        setTimetable(data);
        const teacherRes = await fetch(
          `/api/suggestions/teachers/schoolId/${classId}`
        );
        const teacherData = await teacherRes.json();
        setTeachers(teacherData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [classId, streamId]);

  const handleAddSlot = async () => {
    if (!newSlot.subject || !newSlot.teacher) return;

    const res = await fetch(`/api/timetable/${classId}/${streamId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSlot),
    });

    if (res.ok) {
      setTimetable([...timetable, newSlot]);
      setNewSlot({
        subject: "",
        teacher: "",
        startTime: "",
        endTime: "",
        location: "",
      });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Class Timetable</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Start</th>
              <th>End</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map((slot, idx) => (
              <tr key={idx} className="border">
                <td className="p-2 flex items-center gap-2">
                  <Book size={16} /> {slot.subject}
                </td>
                <td className="p-2 flex items-center gap-2">
                  <User size={16} /> {slot.teacher}
                </td>
                <td className="p-2">{slot.startTime}</td>
                <td className="p-2">{slot.endTime}</td>
                <td className="p-2">{slot.location || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Slot Form */}
      <div className="mt-6 p-4 border rounded">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Plus size={20} /> Add Slot
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Subject"
            value={newSlot.subject}
            onChange={(e) =>
              setNewSlot({ ...newSlot, subject: e.target.value })
            }
            className="border p-2 rounded"
          />
          <select
            value={newSlot.teacher}
            onChange={(e) =>
              setNewSlot({ ...newSlot, teacher: e.target.value })
            }
            className="border p-2 rounded"
          >
            <option value="">Select Teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={newSlot.startTime}
            onChange={(e) =>
              setNewSlot({ ...newSlot, startTime: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="time"
            value={newSlot.endTime}
            onChange={(e) =>
              setNewSlot({ ...newSlot, endTime: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Location"
            value={newSlot.location}
            onChange={(e) =>
              setNewSlot({ ...newSlot, location: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>
        <Button onClick={handleAddSlot} className="mt-2">
          Add Slot
        </Button>
      </div>
    </div>
  );
}
