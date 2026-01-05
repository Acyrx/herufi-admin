"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type SubjectStat = {
  subject: string
  average: number
  count: number
  highest: number
  lowest: number
}

type Result = {
  score: number
  graded_at: string
  remarks: string | null
  assessments: {
    name: string
    type: string
    max_score: number
    classes: { name: string } | null
    subjects: { name: string } | null
  }
}

export function StudentPerformanceCharts({
  subjectStats,
  results,
}: {
  subjectStats: SubjectStat[]
  results: Result[]
}) {
  // Get recent results for trend line
  const recentResults = results
    .slice(0, 10)
    .reverse()
    .map((result, index) => ({
      assessment: result.assessments.name.substring(0, 15),
      score: (result.score / result.assessments.max_score) * 100,
      index: index + 1,
    }))

  const getPerformanceColor = (average: number) => {
    if (average >= 80) return "bg-green-100 text-green-800"
    if (average >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getGradeLabel = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="average" fill="hsl(var(--chart-1))" name="Average Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No results available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentResults}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" label={{ value: "Assessment Number", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-2))" name="Score (%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Complete more assessments to see trends
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectStats.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Average</TableHead>
                      <TableHead className="text-center">Highest</TableHead>
                      <TableHead className="text-center">Lowest</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectStats.map((stat) => (
                      <TableRow key={stat.subject}>
                        <TableCell className="font-medium">{stat.subject}</TableCell>
                        <TableCell className="text-center">{stat.average.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">{stat.highest.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">{stat.lowest.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getPerformanceColor(stat.average)} variant="secondary">
                            {getGradeLabel(stat.average)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No subject data available yet. Complete assessments to see your performance.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assessment Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {results.slice(0, 10).map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{result.assessments.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.assessments.classes?.name} - {result.assessments.subjects?.name || "General"}
                        </p>
                      </div>
                      <Badge className={getPerformanceColor((result.score / result.assessments.max_score) * 100)}>
                        {((result.score / result.assessments.max_score) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <p>
                        Score: {result.score} / {result.assessments.max_score}
                      </p>
                      {result.remarks && <p className="text-muted-foreground mt-1">Remarks: {result.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No results available yet. Your teachers will grade your assessments soon.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
