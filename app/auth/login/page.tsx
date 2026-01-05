"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Shield,
  School,
  GraduationCap,
  Loader2,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Users
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const STUDENT_EMAIL_DOMAIN = "@herufi.app"


  const isValidStudentUsername = (value: string) => {
    // exactly 3 letters + 4 digits
    return /^[a-zA-Z]{3}\d{4}$/.test(value)
  }

  // Role configurations
  const roleConfig = {
    super_admin: { icon: Shield, label: "Super Admin", color: "bg-purple-100 text-purple-800" },
    admin: { icon: Shield, label: "Administrator", color: "bg-blue-100 text-blue-800" },
    school: { icon: School, label: "School", color: "bg-green-100 text-green-800" },
    teacher: { icon: User, label: "Teacher", color: "bg-orange-100 text-orange-800" },
    student: { icon: GraduationCap, label: "Student", color: "bg-indigo-100 text-indigo-800" },
  }

  // Extract role from URL
  useEffect(() => {
    const roleParam = searchParams.get("role")
    if (roleParam) {
      setRole(roleParam)
    } else {
      setError("Please select a role to continue")
    }
  }, [searchParams])

  const getRoleIcon = () => {
    if (!role || !(role in roleConfig)) return School
    return roleConfig[role as keyof typeof roleConfig].icon
  }

  const getRoleLabel = () => {
    if (!role || !(role in roleConfig)) return "Select Role"
    return roleConfig[role as keyof typeof roleConfig].label
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError("Please select a role to continue")
      return
    }

    let finalEmail = email

    // STUDENT EMAIL VALIDATION
    if (role === "student") {
      if (!isValidStudentUsername(email)) {
        setError("Student ID must be 3 letters followed by 4 digits (e.g. ahs2000)")
        return
      }

      finalEmail = `${email.toLowerCase()}${STUDENT_EMAIL_DOMAIN}`
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password,
      })

      if (error) throw error

      // Redirect based on the role in the URL
      switch (role) {
        case "super_admin":
        case "admin":
        case "school":
          router.push("/dashboard")
          break
        case "teacher":
          router.push("/teacher-dashboard")
          break
        case "student":
          router.push("/student-dashboard")
          break
        default:
          throw new Error("Invalid role")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side - Brand/Info */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Herufi
                </h1>
                <p className="text-muted-foreground">Next Generation School Management</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Streamline your educational institution with our comprehensive management platform designed for administrators, teachers, and students.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What this platform helps you manage</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/40">
                <div className="p-2 rounded-md bg-blue-100">
                  <School className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">School Administration</p>
                  <p className="text-sm text-muted-foreground">
                    Manage classes, streams, subjects, and academic years.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/40">
                <div className="p-2 rounded-md bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Students & Teachers</p>
                  <p className="text-sm text-muted-foreground">
                    Assign subjects, track enrollment, and manage staff.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/40">
                <div className="p-2 rounded-md bg-purple-100">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Academic Records</p>
                  <p className="text-sm text-muted-foreground">
                    Results, attendance, grading, and reports.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/40">
                <div className="p-2 rounded-md bg-orange-100">
                  <ShieldCheck className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Secure Access</p>
                  <p className="text-sm text-muted-foreground">
                    Role-based access for admins, teachers, and students.
                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Real-time Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center p-4 md:p-8">
          <Card className="w-full max-w-md border-none shadow-xl">
            <CardHeader className="space-y-4 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  {/* Main Icon Container */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl 
                  bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600
                  shadow-lg ring-4 ring-blue-100">
                    <School className="h-9 w-9 text-white" />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute -right-3 -top-3">
                    <Badge
                      className="flex items-center gap-1 
                 bg-white text-blue-600 border border-blue-200
                 shadow-sm px-2 py-1 text-xs font-medium"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure Login
                    </Badge>
                  </div>
                </div>


                <div>
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription className="mt-2">
                    {role ? `Sign in to your ${getRoleLabel()} account` : "Select a role to continue"}
                  </CardDescription>
                </div>
              </div>

              {role && (
                <div className="flex justify-center">
                  <Badge variant="outline" className="gap-2 px-4 py-2">
                    {/* {getRoleIcon() && React.createElement(getRoleIcon(), { className: "h-4 w-4" })} */}
                    {getRoleLabel()}
                  </Badge>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {!role ? (
                <Alert className="mb-6">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Please access login through the appropriate role portal. Contact support if you need assistance.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {role === "student" ? "Student ID" : "Email Address"}
                      </Label>

                      <div className="relative">
                        <Input
                          id="email"
                          type="text"
                          placeholder={role === "student" ? "ahs2000" : "john.doe@example.com"}
                          required
                          value={
                            role === "student"
                              ? email.replace(STUDENT_EMAIL_DOMAIN, "")
                              : email
                          }
                          onChange={(e) => {
                            if (role === "student") {
                              const value = e.target.value.toLowerCase()
                              setEmail(value)
                            } else {
                              setEmail(e.target.value)
                            }
                          }}
                          className="h-11 pl-10 pr-36"
                        />

                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {role === "student" && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {STUDENT_EMAIL_DOMAIN}
                          </div>
                        )}
                      </div>

                      {role === "student" && (
                        <p className="text-xs text-muted-foreground">
                          Format: <span className="font-mono">ahs2000@herufi.app</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 pl-10 pr-10"
                          placeholder="••••••••"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="animate-in fade-in duration-300">
                      <AlertDescription className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href="/forgot-password"
                      className="text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                    <div className="text-muted-foreground">
                      Need help? <Link href="/support" className="text-primary hover:underline">Contact Support</Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isLoading || !role}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Continue to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-11" asChild>
                    <Link href="/auth/school-signup">
                      <School className="mr-2 h-4 w-4" />
                      Register School
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-11" asChild>
                    <Link href="/auth/teacher-signup">
                      <User className="mr-2 h-4 w-4" />
                      Join as Teacher
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t px-6 py-4">
              <div className="w-full text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}