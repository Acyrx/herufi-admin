"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Student = {
  id: string
  first_name: string
  last_name: string
  email: string
  grade: string | null
  phone: string | null
  date_of_birth: string | null
}

export function StudentsTable({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students found. Add your first student to get started.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Date of Birth</TableHead>
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
                {student.grade ? (
                  <Badge variant="secondary">{student.grade}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{student.phone || "-"}</TableCell>
              <TableCell>{student.date_of_birth || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
