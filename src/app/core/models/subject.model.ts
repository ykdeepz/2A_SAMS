// src/app/core/models/subject.model.ts

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  schedule: string;
  room: string;
  semester: string;
  instructorId: string;
  instructorName: string;
  enrolledStudents: string[];
  color: string;
  capacity: number;
}

export interface SubjectWithStudents extends Subject {
  studentDetails: StudentInSubject[];
}

export interface StudentInSubject {
  studentId: string;
  name: string;
  email: string;
  enrolledDate: Date;
  attendanceRate: number;
}
