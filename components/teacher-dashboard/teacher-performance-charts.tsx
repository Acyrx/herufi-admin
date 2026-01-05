"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Subject = {
  id: string
  name: string
}

type Result = {
  score: number
  assessments: {
    max_score: number
    subject_id: string | null
  }
}

export function SubjectAnalytics({ subjects, allResults }: { subjects: Subject[]; allResults: Result[] }) {
  const subjectStats = subjects.map((subject) => {
    const subjectResults = allResults.filter((r) => r.assessments.subject_id === subject.id)
    const scores = subjectResults.map((r) => (r.score / r.assessments.max_score) * 100)

    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const highest = scores.length > 0 ? Math.max(...scores) : 0
    const lowest = scores.length > 0 ? Math.min(...scores) : 0
    const passing = scores.filter((s) => s >= 60).length
    const passingRate = scores.length > 0 ? (passing / scores.length) * 100 : 0

    return {
      name: subject.name,
      average,
      highest,
      lowest,
      passingRate,
      totalAssessments: subjectResults.length,
    }
  })

  const getPerformanceColor = (average: number) => {
    if (average >= 80) return "bg-green-100 text-green-800"
    if (average >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject-wise Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {subjectStats.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Assessments</TableHead>
                  <TableHead className="text-center">Average</TableHead>
                  <TableHead className="text-center">Highest</TableHead>
                  <TableHead className="text-center">Lowest</TableHead>
                  <TableHead className="text-center">Passing Rate</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectStats.map((stat) => (
                  <TableRow key={stat.name}>
                    <TableCell className="font-medium">{stat.name}</TableCell>
                    <TableCell className="text-center">{stat.totalAssessments}</TableCell>
                    <TableCell className="text-center">{stat.average.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{stat.highest.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{stat.lowest.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{stat.passingRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getPerformanceColor(stat.average)} variant="secondary">
                        {stat.average >= 80 ? "Excellent" : stat.average >= 60 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No subjects created yet. Add subjects to see performance analysis.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
