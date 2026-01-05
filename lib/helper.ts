const ADMISSION_REGEX = /^[A-Z]{2,6}[0-9]{4}$/

export function normalizeAndValidateAdmissionNumber(value: string): string {
  const normalized = value.replace(/\//g, "").trim().toUpperCase()

  if (!ADMISSION_REGEX.test(normalized)) {
    throw new Error("Invalid admission number format")
  }

  return normalized
}
