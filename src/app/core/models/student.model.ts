// src/app/core/models/student.model.ts

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  enrolledDate: Date;
  enrolledSubjects: string[];
  gpa?: number;
  phone?: string;
  address?: string;
}
