"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Teacher = {
  id: string
  first_name: string
  last_name: string
  email: string
  subject: string | null
  phone: string | null
}

export function TeachersTable({ teachers }: { teachers: Teacher[] }) {
  if (teachers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No teachers found. Add your first teacher to get started.
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
            <TableHead>Subject</TableHead>
            <TableHead>Phone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell className="font-medium">
                {teacher.first_name} {teacher.last_name}
              </TableCell>
              <TableCell>{teacher.email}</TableCell>
              <TableCell>
                {teacher.subject ? (
                  <Badge variant="secondary">{teacher.subject}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{teacher.phone || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
