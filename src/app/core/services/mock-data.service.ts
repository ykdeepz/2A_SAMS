// src/app/core/services/mock-data.service.ts

import { Injectable } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { Student } from '../models/student.model';
import { Subject } from '../models/subject.model';
import { AttendanceRecord } from '../models/attendance.model';
import { Grade } from '../models/grade.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // Mock Users
  mockUsers: User[] = [
    // Instructors
    {
      id: 'inst-001',
      email: 'sarah.wilson@university.edu',
      password: 'instructor123',
      name: 'Dr. Sarah Wilson',
      role: 'instructor',
      department: 'Computer Science',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    },
    {
      id: 'inst-002',
      email: 'john.doe@university.edu',
      password: 'instructor123',
      name: 'Prof. John Doe',
      role: 'instructor',
      department: 'Mathematics',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    },
    // Students
    {
      id: 'std-001',
      email: 'alice.johnson@university.edu',
      password: 'student123',
      name: 'Alice Johnson',
      role: 'student',
      studentId: '2024-001',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
    },
    {
      id: 'std-002',
      email: 'bob.smith@university.edu',
      password: 'student123',
      name: 'Bob Smith',
      role: 'student',
      studentId: '2024-002',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
    },
    {
      id: 'std-003',
      email: 'carol.white@university.edu',
      password: 'student123',
      name: 'Carol White',
      role: 'student',
      studentId: '2024-003',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol'
    },
    {
      id: 'std-004',
      email: 'david.miller@university.edu',
      password: 'student123',
      name: 'David Miller',
      role: 'student',
      studentId: '2024-004',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
    },
    {
      id: 'std-005',
      email: 'emma.davis@university.edu',
      password: 'student123',
      name: 'Emma Davis',
      role: 'student',
      studentId: '2024-005',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
    },
    {
      id: 'std-006',
      email: 'frank.brown@university.edu',
      password: 'student123',
      name: 'Frank Brown',
      role: 'student',
      studentId: '2024-006',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank'
    },
    {
      id: 'std-007',
      email: 'grace.wilson@university.edu',
      password: 'student123',
      name: 'Grace Wilson',
      role: 'student',
      studentId: '2024-007',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace'
    },
    {
      id: 'std-008',
      email: 'henry.taylor@university.edu',
      password: 'student123',
      name: 'Henry Taylor',
      role: 'student',
      studentId: '2024-008',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry'
    },
    {
      id: 'std-009',
      email: 'isabella.moore@university.edu',
      password: 'student123',
      name: 'Isabella Moore',
      role: 'student',
      studentId: '2024-009',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella'
    },
    {
      id: 'std-010',
      email: 'jack.anderson@university.edu',
      password: 'student123',
      name: 'Jack Anderson',
      role: 'student',
      studentId: '2024-010',
      enrolledDate: new Date('2024-08-15'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack'
    },
    // Parents
    {
      id: 'par-001',
      email: 'parent1@email.com',
      password: 'parent123',
      name: 'Mary Johnson',
      role: 'parent',
      childId: 'std-001',
      childName: 'Alice Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary'
    },
    {
      id: 'par-002',
      email: 'parent2@email.com',
      password: 'parent123',
      name: 'Robert Smith',
      role: 'parent',
      childId: 'std-002',
      childName: 'Bob Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'
    },
    // Admin
    {
      id: 'admin-001',
      email: 'admin@university.edu',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    }
  ];

  // Mock Subjects
  mockSubjects: Subject[] = [
    {
      id: 'subj-001',
      code: 'CS101',
      name: 'Introduction to Programming',
      description: 'Fundamentals of programming using Python',
      schedule: 'MWF 9:00 AM - 10:00 AM',
      room: 'Room 201',
      semester: 'Spring 2026',
      instructorId: 'inst-001',
      instructorName: 'Dr. Sarah Wilson',
      enrolledStudents: ['std-001', 'std-002', 'std-003', 'std-005'],
      color: '#3B82F6',
      capacity: 30
    },
    {
      id: 'subj-002',
      code: 'CS201',
      name: 'Data Structures & Algorithms',
      description: 'Advanced data structures and algorithm design',
      schedule: 'TTh 2:00 PM - 3:30 PM',
      room: 'Room 305',
      semester: 'Spring 2026',
      instructorId: 'inst-001',
      instructorName: 'Dr. Sarah Wilson',
      enrolledStudents: ['std-002', 'std-004', 'std-006', 'std-007'],
      color: '#8B5CF6',
      capacity: 25
    },
    {
      id: 'subj-003',
      code: 'MATH101',
      name: 'Calculus I',
      description: 'Differential and integral calculus',
      schedule: 'MWF 10:30 AM - 11:30 AM',
      room: 'Room 102',
      semester: 'Spring 2026',
      instructorId: 'inst-002',
      instructorName: 'Prof. John Doe',
      enrolledStudents: ['std-001', 'std-003', 'std-005', 'std-008'],
      color: '#EC4899',
      capacity: 35
    },
    {
      id: 'subj-004',
      code: 'MATH201',
      name: 'Linear Algebra',
      description: 'Matrices, vectors, and linear transformations',
      schedule: 'TTh 1:00 PM - 2:30 PM',
      room: 'Room 104',
      semester: 'Spring 2026',
      instructorId: 'inst-002',
      instructorName: 'Prof. John Doe',
      enrolledStudents: ['std-002', 'std-004', 'std-009', 'std-010'],
      color: '#F59E0B',
      capacity: 28
    }
  ];

  // Mock Attendance Records
  mockAttendanceRecords: AttendanceRecord[] = [
    {
      id: 'att-001',
      studentId: 'std-001',
      subjectId: 'subj-001',
      date: new Date('2026-02-24'),
      status: 'present',
      markedAt: new Date('2026-02-24T09:05:00'),
      markedBy: 'inst-001'
    },
    {
      id: 'att-002',
      studentId: 'std-002',
      subjectId: 'subj-001',
      date: new Date('2026-02-24'),
      status: 'late',
      markedAt: new Date('2026-02-24T09:15:00'),
      markedBy: 'inst-001',
      notes: 'Arrived 15 mins late'
    },
    {
      id: 'att-003',
      studentId: 'std-003',
      subjectId: 'subj-001',
      date: new Date('2026-02-24'),
      status: 'present',
      markedAt: new Date('2026-02-24T09:05:00'),
      markedBy: 'inst-001'
    },
    {
      id: 'att-004',
      studentId: 'std-001',
      subjectId: 'subj-001',
      date: new Date('2026-02-23'),
      status: 'present',
      markedAt: new Date('2026-02-23T09:05:00'),
      markedBy: 'inst-001'
    },
    {
      id: 'att-005',
      studentId: 'std-002',
      subjectId: 'subj-001',
      date: new Date('2026-02-23'),
      status: 'absent',
      markedAt: new Date('2026-02-23T10:00:00'),
      markedBy: 'inst-001'
    }
  ];

  // Mock Grades
  mockGrades: Grade[] = [
    {
      id: 'grade-001',
      studentId: 'std-001',
      subjectId: 'subj-001',
      assignmentName: 'Assignment 1: Python Basics',
      score: 92,
      totalScore: 100,
      percentage: 92,
      dueDate: new Date('2026-02-20'),
      submittedDate: new Date('2026-02-19')
    },
    {
      id: 'grade-002',
      studentId: 'std-001',
      subjectId: 'subj-001',
      assignmentName: 'Midterm Exam',
      score: 87,
      totalScore: 100,
      percentage: 87,
      dueDate: new Date('2026-02-15'),
      submittedDate: new Date('2026-02-15')
    },
    {
      id: 'grade-003',
      studentId: 'std-001',
      subjectId: 'subj-003',
      assignmentName: 'Calculus Problem Set 1',
      score: 88,
      totalScore: 100,
      percentage: 88,
      dueDate: new Date('2026-02-22'),
      submittedDate: new Date('2026-02-21')
    },
    {
      id: 'grade-004',
      studentId: 'std-002',
      subjectId: 'subj-001',
      assignmentName: 'Assignment 1: Python Basics',
      score: 85,
      totalScore: 100,
      percentage: 85,
      dueDate: new Date('2026-02-20'),
      submittedDate: new Date('2026-02-20')
    }
  ];

  constructor() {}

  // User methods
  getAllUsers(): User[] {
    return this.mockUsers;
  }

  getUserByEmail(email: string): User | undefined {
    return this.mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.mockUsers.find(u => u.id === id);
  }

  getUsersByRole(role: UserRole): User[] {
    return this.mockUsers.filter(u => u.role === role);
  }

  // Subject methods
  getAllSubjects(): Subject[] {
    return this.mockSubjects;
  }

  getSubjectById(id: string): Subject | undefined {
    return this.mockSubjects.find(s => s.id === id);
  }

  getSubjectsByInstructor(instructorId: string): Subject[] {
    return this.mockSubjects.filter(s => s.instructorId === instructorId);
  }

  getSubjectsByStudent(studentId: string): Subject[] {
    return this.mockSubjects.filter(s => s.enrolledStudents.includes(studentId));
  }

  // Attendance methods
  getAttendanceByStudent(studentId: string): AttendanceRecord[] {
    return this.mockAttendanceRecords.filter(a => a.studentId === studentId);
  }

  getAttendanceBySubject(subjectId: string, date?: Date): AttendanceRecord[] {
    return this.mockAttendanceRecords.filter(a => {
      if (date) {
        const recordDate = new Date(a.date).toDateString();
        const filterDate = new Date(date).toDateString();
        return a.subjectId === subjectId && recordDate === filterDate;
      }
      return a.subjectId === subjectId;
    });
  }

  // Grade methods
  getGradesByStudent(studentId: string): Grade[] {
    return this.mockGrades.filter(g => g.studentId === studentId);
  }

  getGradesBySubject(subjectId: string): Grade[] {
    return this.mockGrades.filter(g => g.subjectId === subjectId);
  }

  getStudentGradesInSubject(studentId: string, subjectId: string): Grade[] {
    return this.mockGrades.filter(g => g.studentId === studentId && g.subjectId === subjectId);
  }
}
