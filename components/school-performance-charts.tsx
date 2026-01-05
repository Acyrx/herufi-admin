"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Save, Check } from "lucide-react"

type Student = {
  id: string
  first_name: string
  last_name: string
  email: string
  result_id: string | null
  score: number | null
  remarks: string | null
}

export function ResultsEntryTable({
  students,
  assessmentId,
  teacherId,
  maxScore,
}: {
  students: Student[]
  assessmentId: string
  teacherId: string
  maxScore: number
}) {
  const [results, setResults] = useState<Record<string, { score: string; remarks: string }>>(
    students.reduce(
      (acc, student) => {
        acc[student.id] = {
          score: student.score?.toString() || "",
          remarks: student.remarks || "",
        }
        return acc
      },
      {} as Record<string, { score: string; remarks: string }>,
    ),
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const handleChange = (studentId: string, field: "score" | "remarks", value: string) => {
    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }))
    setSaved((prev) => ({ ...prev, [studentId]: false }))
  }

  const handleSave = async (studentId: string, resultId: string | null) => {
    setSaving((prev) => ({ ...prev, [studentId]: true }))
    const supabase = createClient()

    try {
      const score = Number.parseFloat(results[studentId].score)

      if (isNaN(score) || score < 0 || score > maxScore) {
        alert(`Score must be between 0 and ${maxScore}`)
        return
      }

      if (resultId) {
        // Update existing result
        const { error } = await supabase
          .from("student_results")
          .update({
            score,
            remarks: results[studentId].remarks,
            graded_at: new Date().toISOString(),
            graded_by: teacherId,
          })
          .eq("id", resultId)

        if (error) throw error
      } else {
        // Create new result
        const { error } = await supabase.from("student_results").insert({
          student_id: studentId,
          assessment_id: assessmentId,
          score,
          remarks: results[studentId].remarks,
          graded_by: teacherId,
        })

        if (error) throw error
      }

      setSaved((prev) => ({ ...prev, [studentId]: true }))
      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [studentId]: false }))
      }, 2000)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSaving((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  if (students.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No students enrolled in this class.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Score (out of {maxScore})</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                {student.first_name} {student.last_name}
              </TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxScore}
                  value={results[student.id]?.score || ""}
                  onChange={(e) => handleChange(student.id, "score", e.target.value)}
                  className="w-24"
                  placeholder="0"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={results[student.id]?.remarks || ""}
                  onChange={(e) => handleChange(student.id, "remarks", e.target.value)}
                  placeholder="Optional remarks"
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => handleSave(student.id, student.result_id)}
                  disabled={saving[student.id] || !results[student.id]?.score}
                >
                  {saved[student.id] ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      {saving[student.id] ? "Saving..." : "Save"}
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
