export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledDate: string;
  phone?: string;
  address?: string;
}

export interface StudentEnrollment {
  studentId: string;
  subjectId: string;
  enrolledDate: string;
}
