"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Subject = {
  id: string
  name: string
}

type Term = {
  id: string
  name: string
}

export function CreateAssessmentForm({
  classId,
  teacherId,
  schoolId,
  subjects,
  terms,
}: {
  classId: string
  teacherId: string
  schoolId: string
  subjects: Subject[]
  terms: Term[]
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "exam",
    subjectId: "",
    termId: "",
    maxScore: "100",
    weight: "1.0",
    dueDate: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("assessments").insert({
        school_id: schoolId,
        class_id: classId,
        teacher_id: teacherId,
        subject_id: formData.subjectId || null,
        term_id: formData.termId || null,
        name: formData.name,
        type: formData.type,
        max_score: Number.parseFloat(formData.maxScore),
        weight: Number.parseFloat(formData.weight),
        due_date: formData.dueDate || null,
        description: formData.description,
      })

      if (error) throw error

      alert("Assessment created successfully!")
      router.push(`/teacher-dashboard/results/${classId}`)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Assessment Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Midterm Exam, Unit 3 Quiz"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="test">Test</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select value={formData.subjectId} onValueChange={(value) => handleChange("subjectId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maxScore">Maximum Score *</Label>
          <Input
            id="maxScore"
            type="number"
            step="0.01"
            value={formData.maxScore}
            onChange={(e) => handleChange("maxScore", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={(e) => handleChange("weight", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="term">Academic Term</Label>
          <Select value={formData.termId} onValueChange={(value) => handleChange("termId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleChange("dueDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Add any notes or instructions about this assessment"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Assessment"}
      </Button>
    </form>
  )
}
