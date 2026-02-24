// src/app/core/services/student.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Student } from '../models/student.model';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private mockDataService: MockDataService) {}

  // Get all students
  getAllStudents(): Observable<Student[]> {
    const users = this.mockDataService.getUsersByRole('student');
    const students: Student[] = users.map(u => ({
      id: u.id,
      studentId: u.studentId || '',
      name: u.name,
      email: u.email,
      enrolledDate: u.enrolledDate || new Date(),
      enrolledSubjects: this.mockDataService.mockSubjects
        .filter(s => s.enrolledStudents.includes(u.id))
        .map(s => s.id)
    }));
    return of(students).pipe(delay(300));
  }

  // Get student by ID
  getStudentById(id: string): Observable<Student | null> {
    const user = this.mockDataService.getUserById(id);
    if (!user || user.role !== 'student') {
      return of(null);
    }

    const student: Student = {
      id: user.id,
      studentId: user.studentId || '',
      name: user.name,
      email: user.email,
      enrolledDate: user.enrolledDate || new Date(),
      enrolledSubjects: this.mockDataService.mockSubjects
        .filter(s => s.enrolledStudents.includes(user.id))
        .map(s => s.id)
    };

    return of(student).pipe(delay(300));
  }

  // Get student by student ID
  getStudentByStudentId(studentId: string): Observable<Student | null> {
    const users = this.mockDataService.getUsersByRole('student');
    const user = users.find(u => u.studentId === studentId);
    
    if (!user) {
      return of(null);
    }

    const student: Student = {
      id: user.id,
      studentId: user.studentId || '',
      name: user.name,
      email: user.email,
      enrolledDate: user.enrolledDate || new Date(),
      enrolledSubjects: this.mockDataService.mockSubjects
        .filter(s => s.enrolledStudents.includes(user.id))
        .map(s => s.id)
    };

    return of(student).pipe(delay(300));
  }

  // Search students
  searchStudents(query: string): Observable<Student[]> {
    const allStudents = this.mockDataService.getUsersByRole('student');
    const filtered = allStudents.filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.studentId?.toLowerCase().includes(query.toLowerCase())
    );

    const students: Student[] = filtered.map(u => ({
      id: u.id,
      studentId: u.studentId || '',
      name: u.name,
      email: u.email,
      enrolledDate: u.enrolledDate || new Date(),
      enrolledSubjects: this.mockDataService.mockSubjects
        .filter(s => s.enrolledStudents.includes(u.id))
        .map(s => s.id)
    }));

    return of(students).pipe(delay(300));
  }
}
