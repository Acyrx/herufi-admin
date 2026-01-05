"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    Mail,
    Calendar,
    Phone,
    MapPin,
    GraduationCap,
    Shield,
    UserCircle,
    Edit,
    BookOpen,
    Award,
    BarChart3,
    Clock,
    School,
    Heart,
    Home,
    UserCog,
    ChevronRight,
    Smartphone,
    Cake,
    Users,
} from "lucide-react";

interface Student {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    gender: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    address: string | null;
    class_id?: string;
    profile_image?: string;
}

interface Profile {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    avatar_url?: string;
}

interface Stats {
    attendance: number;
    averageScore: number;
    testsTaken: number;
    upcomingExams: number;
}

export default function StudentDashboard() {
    const [student, setStudent] = useState<Student | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    const supabase = createClient();

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            // Get logged-in user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            // Fetch student's profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch student's data
            const { data: studentData, error: studentError } = await supabase
                .from("students")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (studentError) throw studentError;
            setStudent(studentData);

            // Fetch statistics (mock data for now - you can replace with real data)
            // In a real app, you'd fetch these from your database
            setStats({
                attendance: 94.5,
                averageScore: 85.2,
                testsTaken: 8,
                upcomingExams: 3,
            });

        } catch (err: any) {
            toast.error(err.message || "Failed to fetch student data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getAge = (dateOfBirth: string | null) => {
        if (!dateOfBirth) return "N/A";
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleEditProfile = () => {
        toast.info("Edit profile feature coming soon!");
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!student || !profile) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <UserCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Student Data Found</h3>
                        <p className="text-gray-500 mb-6">
                            We couldn't find your student profile. Please contact administration.
                        </p>
                        <Button onClick={fetchStudentData} variant="outline">
                            <UserCog className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const fullName = profile.full_name || `${student.first_name} ${student.last_name}`;
    const initials = getInitials(student.first_name, student.last_name);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Student Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {student.first_name}! Here's your academic overview.
                    </p>
                </div>
            </div>

            {/* Student Profile Card */}
            <Card className="overflow-hidden border-primary/20">
                <CardContent className="p-0">
                    <div className="md:flex">
                        {/* Profile Sidebar */}
                        <div className="md:w-1/3 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                                    <AvatarImage
                                        src={profile.avatar_url || student.profile_image}
                                        alt={fullName}
                                    />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold">{fullName}</h2>
                                    <Badge variant="secondary" className="gap-1">
                                        <GraduationCap className="h-3 w-3" />
                                        Student
                                    </Badge>
                                </div>

                                <div className="w-full space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Admission No:</span>
                                        <span className="font-mono font-semibold">{student.admission_number}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Class:</span>
                                        <Badge variant="outline">
                                            {student.class_id || "Not assigned"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="md:w-2/3 p-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="profile" className="gap-2">
                                        <UserCircle className="h-4 w-4" />
                                        Profile
                                    </TabsTrigger>
                                    {/* <TabsTrigger value="academic" className="gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Academic
                                    </TabsTrigger> */}
                                    <TabsTrigger value="contact" className="gap-2">
                                        <Phone className="h-4 w-4" />
                                        Contact
                                    </TabsTrigger>
                                </TabsList>

                                {/* Profile Tab */}
                                <TabsContent value="profile" className="space-y-4 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Admission Number:</span>
                                            </div>
                                            <p className="text-sm pl-6">{student.admission_number}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Date of Birth:</span>
                                            </div>
                                            <p className="text-sm pl-6">
                                                {student.date_of_birth
                                                    ? `${formatDate(student.date_of_birth)} (${getAge(student.date_of_birth)} years)`
                                                    : "Not available"
                                                }
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Gender:</span>
                                            </div>
                                            <p className="text-sm pl-6">{student.gender || "Not specified"}</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Academic Tab */}
                                {/* <TabsContent value="academic" className="space-y-4 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Award className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Current GPA:</span>
                                            </div>
                                            <p className="text-sm pl-6">3.8/4.0</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Attendance Rate:</span>
                                            </div>
                                            <p className="text-sm pl-6">{stats?.attendance || 0}%</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Enrolled Subjects:</span>
                                            </div>
                                            <p className="text-sm pl-6">8 Subjects</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Academic Year:</span>
                                            </div>
                                            <p className="text-sm pl-6">2024-2025</p>
                                        </div>
                                    </div>
                                </TabsContent> */}

                                {/* Contact Tab */}
                                <TabsContent value="contact" className="space-y-4 pt-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Guardian:</span>
                                            </div>
                                            <p className="text-sm pl-6">{student.guardian_name || "Not available"}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Guardian Phone:</span>
                                            </div>
                                            <p className="text-sm pl-6">
                                                {student.guardian_phone
                                                    ? <a href={`tel:${student.guardian_phone}`} className="text-primary hover:underline">
                                                        {student.guardian_phone}
                                                    </a>
                                                    : "Not available"
                                                }
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Home className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Address:</span>
                                            </div>
                                            <p className="text-sm pl-6 whitespace-pre-line">
                                                {student.address || "Not available"}
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                                <p className="text-2xl font-bold">{stats?.attendance || 0}%</p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>Current term</span>
                                <span className="font-medium">Excellent</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                                <p className="text-2xl font-bold">{stats?.averageScore || 0}%</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>This semester</span>
                                <span className="font-medium">Good</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tests Taken</p>
                                <p className="text-2xl font-bold">{stats?.testsTaken || 0}</p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>This month</span>
                                <span className="font-medium">Active</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
                                <p className="text-2xl font-bold">{stats?.upcomingExams || 0}</p>
                            </div>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Award className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>Next 30 days</span>
                                <span className="font-medium">Prepare</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div> */}

            {/* Quick Actions */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Access important features quickly</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-auto py-4 justify-start" onClick={handleEditProfile}>
                            <Edit className="h-5 w-5 mr-3" />
                            <div className="text-left">
                                <div className="font-medium">Update Profile</div>
                                <div className="text-xs text-muted-foreground">Edit personal information</div>
                            </div>
                        </Button>

                        <Button variant="outline" className="h-auto py-4 justify-start">
                            <BookOpen className="h-5 w-5 mr-3" />
                            <div className="text-left">
                                <div className="font-medium">View Results</div>
                                <div className="text-xs text-muted-foreground">Check exam scores</div>
                            </div>
                        </Button>

                        <Button variant="outline" className="h-auto py-4 justify-start">
                            <Calendar className="h-5 w-5 mr-3" />
                            <div className="text-left">
                                <div className="font-medium">Timetable</div>
                                <div className="text-xs text-muted-foreground">Class schedule</div>
                            </div>
                        </Button>

                        <Button variant="outline" className="h-auto py-4 justify-start">
                            <School className="h-5 w-5 mr-3" />
                            <div className="text-left">
                                <div className="font-medium">Resources</div>
                                <div className="text-xs text-muted-foreground">Study materials</div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card> */}

            {/* Recent Activity */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest academic updates</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Award className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-medium">Math Test Result</div>
                                    <div className="text-sm text-muted-foreground">Scored 92% - Excellent work!</div>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">2 days ago</div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-medium">New Assignment</div>
                                    <div className="text-sm text-muted-foreground">Science project assigned</div>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">4 days ago</div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <div className="font-medium">Attendance Alert</div>
                                    <div className="text-sm text-muted-foreground">Perfect attendance this month</div>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">1 week ago</div>
                        </div>
                    </div>
                </CardContent>
            </Card> */}
        </div>
    );
}