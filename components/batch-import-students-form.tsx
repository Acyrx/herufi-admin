"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { parseCSV, validateStudentRow } from "@/lib/csv-parser"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function BatchImportStudentsForm({ schoolId }: { schoolId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setResult(null)
    } else {
      alert("Please select a valid CSV file")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const text = await file.text()
      const { rows, errors: parseErrors } = parseCSV(text)

      const validationErrors: string[] = [...parseErrors]
      const validRows: typeof rows = []

      // Validate each row
      rows.forEach((row, index) => {
        const error = validateStudentRow(row, index + 2) // +2 because row 1 is headers, arrays are 0-indexed
        if (error) {
          validationErrors.push(error)
        } else {
          validRows.push(row)
        }
      })

      if (validRows.length === 0) {
        setResult({ success: 0, failed: rows.length, errors: validationErrors })
        setIsProcessing(false)
        return
      }

      // Create batch import record
      const { data: batchImport, error: batchError } = await supabase
        .from("batch_imports")
        .insert({
          school_id: schoolId,
          imported_by: (await supabase.auth.getUser()).data.user?.id,
          import_type: "students",
          file_name: file.name,
          status: "processing",
          total_records: validRows.length,
        })
        .select()
        .single()

      if (batchError) throw batchError

      let successCount = 0
      let failedCount = 0
      const importErrors: string[] = []

      // Import each student
      for (const row of validRows) {
        try {
          // Create a temporary password (school should ask students to reset)
          const tempPassword = `Student${Math.random().toString(36).slice(-8)}`

          const { error: authError } = await supabase.auth.signUp({
            email: row.email,
            password: tempPassword,
            options: {
              emailRedirectTo:
                process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/student-dashboard`,
              data: {
                role: "student",
                first_name: row.first_name,
                last_name: row.last_name,
                school_id: schoolId,
                grade: row.grade || "",
                phone: row.phone || "",
                date_of_birth: row.date_of_birth || "",
                parent_name: row.parent_name || "",
                parent_phone: row.parent_phone || "",
                batch_import_id: batchImport.id,
              },
            },
          })

          if (authError) {
            importErrors.push(`${row.email}: ${authError.message}`)
            failedCount++
          } else {
            successCount++
          }
        } catch (err) {
          importErrors.push(`${row.email}: ${err instanceof Error ? err.message : "Unknown error"}`)
          failedCount++
        }
      }

      // Update batch import status
      await supabase
        .from("batch_imports")
        .update({
          status: failedCount > 0 ? "completed" : "completed",
          successful_records: successCount,
          failed_records: failedCount,
          error_log: importErrors.length > 0 ? importErrors : null,
        })
        .eq("id", batchImport.id)

      setResult({
        success: successCount,
        failed: failedCount,
        errors: [...validationErrors, ...importErrors],
      })

      if (successCount > 0) {
        setTimeout(() => {
          router.push("/school-dashboard/students")
        }, 3000)
      }
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csvFile">Select CSV File</Label>
          <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing} />
        </div>

        <Button type="submit" disabled={!file || isProcessing} className="w-full">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Students
            </>
          )}
        </Button>
      </form>

      {result && (
        <div className="space-y-3">
          {result.success > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Successfully imported {result.success} student{result.success !== 1 ? "s" : ""}. Students will receive
                confirmation emails.
              </AlertDescription>
            </Alert>
          )}

          {result.failed > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <p className="font-semibold mb-2">
                  Failed to import {result.failed} record{result.failed !== 1 ? "s" : ""}:
                </p>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <li key={index} className="text-red-700">
                      {error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-red-600">...and {result.errors.length - 10} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
