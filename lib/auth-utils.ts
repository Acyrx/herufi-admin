import { createClient } from "@/lib/supabase/server"

export type UserRole = "school" | "teacher" | "student"

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Check user metadata for role
  const role = user.user_metadata?.role as UserRole
  return role || null
}

export async function getSchoolProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: school } = await supabase.from("schools").select("*").eq("user_id", user.id).single()

  return school
}

export async function getTeacherProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: teacher } = await supabase.from("teachers").select("*, schools(*)").eq("user_id", user.id).single()

  return teacher
}

export async function getStudentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: student } = await supabase.from("students").select("*, schools(*)").eq("user_id", user.id).single()

  return student
}
