export interface User {
  user_id: string;
  email: string;
  password?: string;
  role: 'admin' | 'instructor' | 'student' | 'parent';
}

export interface Instructor {
  instructor_id: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  user_id: string;
}

export interface Student {
  student_id: string;
  full_name: string;
  email: string;
  grade_level: string;
  section: string;
  qr_code_data: string;
  instructor_id: string;
  user_id: string;
}

export interface Parent {
  parent_id: string;
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  user_id: string;
}

export interface Subject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  instructor_id: string;
  instructor_name: string;
  grade_level: string;
  section: string;
  schedule: string;
}

export interface SubjectEnrollment {
  enrollment_id: string;
  subject_id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  enrolled_date: Date;
}

export interface Attendance {
  attendance_id: string;
  student_id: string;
  student_name: string;
  instructor_id: string;
  subject_id: string;
  subject_name: string;
  date: Date;
  time: string;
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  method: 'QR' | 'Manual';
}
