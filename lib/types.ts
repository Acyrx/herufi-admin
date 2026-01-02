export interface School {
  id: string;
  school_name: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  school_id: string;
  full_name: string | null;
  email: string;
  role: "super_admin" | "admin" | "teacher";
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  class_teacher_id: string | null;
  name: string;
  grade_level: number | null;
  created_at: string;
  updated_at: string;
}

export interface Stream {
  id: string;
  class_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  stream_id: string | null;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  profile_id: string | null;
  employee_number: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  gender: "male" | "female" | "other" | null;
  qualification: string | null;
  date_hired: string | null;
  created_at: string;
  updated_at: string;
}

export interface Term {
  id: string;
  school_id: string;
  name: string;
  code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Examination {
  id: string;
  school_id: string;
  term_id: string;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: string;
  student_id: string;
  subject_id: string;
  examination_id: string;
  teacher_id: string;
  score: number;
  grade: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  school_id: string;
  name: string;
  type: "quiz" | "cat" | "assignment" | "practical";
  subject_id: string;
  teacher_id: string;
  class_id: string;
  stream_id: string | null;
  max_marks: number;
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  id: string;
  student_id: string;
  test_id: string;
  marks: number;
  grade: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherSubject {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string | null;
  created_at: string;
}
