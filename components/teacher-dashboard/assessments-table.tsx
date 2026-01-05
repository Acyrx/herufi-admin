"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Upload } from "lucide-react"
import Link from "next/link"

type Assessment = {
  id: string
  name: string
  type: string
  max_score: number
  due_date: string | null
  subjects: { name: string } | null
  created_at: string
}

export function AssessmentsTable({ assessments, classId }: { assessments: Assessment[]; classId: string }) {
  if (assessments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No assessments found. Create your first assessment to get started.
      </div>
    )
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      exam: "bg-red-100 text-red-800",
      test: "bg-orange-100 text-orange-800",
      quiz: "bg-yellow-100 text-yellow-800",
      assignment: "bg-blue-100 text-blue-800",
      project: "bg-purple-100 text-purple-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assessment Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Max Score</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment) => (
            <TableRow key={assessment.id}>
              <TableCell className="font-medium">{assessment.name}</TableCell>
              <TableCell>
                <Badge className={getTypeColor(assessment.type)} variant="secondary">
                  {assessment.type}
                </Badge>
              </TableCell>
              <TableCell>{assessment.subjects?.name || "-"}</TableCell>
              <TableCell>{assessment.max_score}</TableCell>
              <TableCell>{assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : "-"}</TableCell>
              <TableCell className="text-right space-x-2">
                <Link href={`/teacher-dashboard/results/${classId}/assessment/${assessment.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Results
                  </Button>
                </Link>
                <Link href={`/teacher-dashboard/results/${classId}/assessment/${assessment.id}/batch-import`}>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
