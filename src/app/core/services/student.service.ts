import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Student } from '../models';
import { MOCK_STUDENTS } from './mock-data';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private studentsSubject = new BehaviorSubject<Student[]>(MOCK_STUDENTS);
  students$ = this.studentsSubject.asObservable();

  constructor() {}

  getAllStudents(): Observable<Student[]> {
    return of(MOCK_STUDENTS);
  }

  getStudentById(id: string): Observable<Student | undefined> {
    const student = MOCK_STUDENTS.find(s => s.id === id);
    return of(student);
  }

  getStudentByStudentId(studentId: string): Observable<Student | undefined> {
    const student = MOCK_STUDENTS.find(s => s.studentId === studentId);
    return of(student);
  }

  addStudent(student: Student): Observable<Student> {
    const newStudents = [...MOCK_STUDENTS, student];
    this.studentsSubject.next(newStudents);
    return of(student);
  }

  updateStudent(student: Student): Observable<Student> {
    const index = MOCK_STUDENTS.findIndex(s => s.id === student.id);
    if (index > -1) {
      MOCK_STUDENTS[index] = student;
      this.studentsSubject.next([...MOCK_STUDENTS]);
    }
    return of(student);
  }

  deleteStudent(id: string): Observable<boolean> {
    const index = MOCK_STUDENTS.findIndex(s => s.id === id);
    if (index > -1) {
      MOCK_STUDENTS.splice(index, 1);
      this.studentsSubject.next([...MOCK_STUDENTS]);
      return of(true);
    }
    return of(false);
  }
}
