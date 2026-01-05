"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Save, Check } from "lucide-react"

type Student = {
  id: string
  first_name: string
  last_name: string
  email: string
}

type Assessment = {
  id: string
  name: string
  type: string
  max_score: number
  subjects: { name: string } | null
  teachers: { first_name: string; last_name: string } | null
}

type Result = {
  id: string
  student_id: string
  assessment_id: string
  score: number
  remarks: string | null
}

export function ClassAllResultsTable({
  students,
  assessments,
  results,
  classId,
  teacherId,
}: {
  students: Student[]
  assessments: Assessment[]
  results: Result[]
  classId: string
  teacherId: string
}) {
  const [editingScores, setEditingScores] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const getResult = (studentId: string, assessmentId: string) => {
    return results.find((r) => r.student_id === studentId && r.assessment_id === assessmentId)
  }

  const handleScoreChange = (studentId: string, assessmentId: string, value: string) => {
    const key = `${studentId}-${assessmentId}`
    setEditingScores((prev) => ({ ...prev, [key]: value }))
    setSaved((prev) => ({ ...prev, [key]: false }))
  }

  const handleSave = async (studentId: string, assessmentId: string, maxScore: number) => {
    const key = `${studentId}-${assessmentId}`
    const score = Number.parseFloat(editingScores[key])

    if (isNaN(score) || score < 0 || score > maxScore) {
      alert(`Score must be between 0 and ${maxScore}`)
      return
    }

    setSaving((prev) => ({ ...prev, [key]: true }))
    const supabase = createClient()

    try {
      const existingResult = getResult(studentId, assessmentId)

      if (existingResult) {
        const { error } = await supabase
          .from("student_results")
          .update({
            score,
            graded_at: new Date().toISOString(),
            graded_by: teacherId,
          })
          .eq("id", existingResult.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("student_results").insert({
          student_id: studentId,
          assessment_id: assessmentId,
          score,
          graded_by: teacherId,
        })

        if (error) throw error
      }

      setSaved((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (students.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No students enrolled in this class.</div>
  }

  if (assessments.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No assessments created for this class yet.</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10">Student Name</TableHead>
            {assessments.map((assessment) => (
              <TableHead key={assessment.id} className="text-center min-w-[150px]">
                <div className="font-semibold">{assessment.name}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {assessment.type}
                  </Badge>
                  <div>Max: {assessment.max_score}</div>
                  {assessment.subjects?.name && <div>{assessment.subjects.name}</div>}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                {student.first_name} {student.last_name}
              </TableCell>
              {assessments.map((assessment) => {
                const result = getResult(student.id, assessment.id)
                const key = `${student.id}-${assessment.id}`
                const currentScore = editingScores[key] ?? result?.score?.toString() ?? ""

                return (
                  <TableCell key={assessment.id} className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={assessment.max_score}
                        value={currentScore}
                        onChange={(e) => handleScoreChange(student.id, assessment.id, e.target.value)}
                        className="w-20 text-center"
                        placeholder="-"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(student.id, assessment.id, assessment.max_score)}
                        disabled={saving[key] || !editingScores[key]}
                      >
                        {saved[key] ? <Check className="h-4 w-4 text-green-600" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
