export interface ParsedCSVData {
  headers: string[]
  rows: Record<string, string>[]
  errors: string[]
}

export function parseCSV(text: string): ParsedCSVData {
  const lines = text.split("\n").filter((line) => line.trim())

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ["CSV file is empty"] }
  }

  const headers = lines[0].split(",").map((h) => h.trim())
  const rows: Record<string, string>[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())

    if (values.length !== headers.length) {
      errors.push(`Row ${i}: Column count mismatch (expected ${headers.length}, got ${values.length})`)
      continue
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    rows.push(row)
  }

  return { headers, rows, errors }
}

export function validateStudentRow(row: Record<string, string>, lineNumber: number): string | null {
  const required = ["first_name", "last_name", "email"]

  for (const field of required) {
    if (!row[field] || row[field].trim() === "") {
      return `Row ${lineNumber}: Missing required field '${field}'`
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(row.email)) {
    return `Row ${lineNumber}: Invalid email format '${row.email}'`
  }

  return null
}

export function validateTeacherRow(row: Record<string, string>, lineNumber: number): string | null {
  const required = ["first_name", "last_name", "email"]

  for (const field of required) {
    if (!row[field] || row[field].trim() === "") {
      return `Row ${lineNumber}: Missing required field '${field}'`
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(row.email)) {
    return `Row ${lineNumber}: Invalid email format '${row.email}'`
  }

  return null
}
