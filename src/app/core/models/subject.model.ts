export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  schedule: string;
  room: string;
  semester: string;
  enrolledStudents: string[]; // array of student IDs
  instructorId: string;
  color: string;
}

export interface SubjectStats {
  totalEnrolled: number;
  totalClasses: number;
  averageAttendance: number;
  room: string;
  schedule: string;
}
