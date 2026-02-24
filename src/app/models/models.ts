export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'instructor' | 'student' | 'parent';
  name: string;
  profile?: {
    phone?: string;
    address?: string;
  };
}

export interface StudentUser extends User {
  role: 'student';
  studentId: string;
  enrolledSubjects: string[]; // subject ids
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export interface InstructorUser extends User {
  role: 'instructor';
  subjects: string[]; // subject ids they teach
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  instructorId: string;
  enrolledStudents: string[]; // student ids
  schedule: {
    days: string[];
    time: string;
    room?: string;
  };
}

export interface Attendance {
  id: string;
  subjectId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  time?: string;
}