// src/app/core/services/subject.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Subject, SubjectWithStudents, StudentInSubject } from '../models/subject.model';
import { MockDataService } from './mock-data.service';
import { AttendanceService } from './attendance.service';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private subjects = new BehaviorSubject<Subject[]>([]);
  public subjects$ = this.subjects.asObservable();

  constructor(
    private mockDataService: MockDataService,
    private attendanceService: AttendanceService
  ) {
    this.subjects.next(this.mockDataService.mockSubjects);
  }

  // Get all subjects
  getAllSubjects(): Observable<Subject[]> {
    return of(this.subjects.value).pipe(delay(300));
  }

  // Get subject by ID
  getSubjectById(id: string): Observable<Subject | null> {
    const subject = this.mockDataService.getSubjectById(id);
    return of(subject || null).pipe(delay(300));
  }

  // Get subjects by instructor
  getSubjectsByInstructor(instructorId: string): Observable<Subject[]> {
    const subjects = this.mockDataService.getSubjectsByInstructor(instructorId);
    return of(subjects).pipe(delay(300));
  }

  // Get subjects by student
  getSubjectsByStudent(studentId: string): Observable<Subject[]> {
    const subjects = this.mockDataService.getSubjectsByStudent(studentId);
    return of(subjects).pipe(delay(300));
  }

  // Get subject with students details
  getSubjectWithStudents(subjectId: string): Observable<SubjectWithStudents | null> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const subject = this.mockDataService.getSubjectById(subjectId);
        if (!subject) return null;

        const studentDetails: StudentInSubject[] = subject.enrolledStudents.map(studentId => {
          const user = this.mockDataService.getUserById(studentId);
          return {
            studentId,
            name: user?.name || 'Unknown',
            email: user?.email || '',
            enrolledDate: user?.enrolledDate || new Date(),
            attendanceRate: 85 // Mock value
          };
        });

        return {
          ...subject,
          studentDetails
        };
      })
    );
  }

  // Add student to subject
  addStudentToSubject(subjectId: string, studentId: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentSubjects = this.subjects.value;
        const subjectIndex = currentSubjects.findIndex(s => s.id === subjectId);
        
        if (subjectIndex !== -1 && !currentSubjects[subjectIndex].enrolledStudents.includes(studentId)) {
          currentSubjects[subjectIndex].enrolledStudents.push(studentId);
          this.subjects.next([...currentSubjects]);
          return true;
        }
        return false;
      })
    );
  }

  // Remove student from subject
  removeStudentFromSubject(subjectId: string, studentId: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentSubjects = this.subjects.value;
        const subjectIndex = currentSubjects.findIndex(s => s.id === subjectId);
        
        if (subjectIndex !== -1) {
          const enrolledIndex = currentSubjects[subjectIndex].enrolledStudents.indexOf(studentId);
          if (enrolledIndex !== -1) {
            currentSubjects[subjectIndex].enrolledStudents.splice(enrolledIndex, 1);
            this.subjects.next([...currentSubjects]);
            return true;
          }
        }
        return false;
      })
    );
  }

  // Check if student is enrolled in subject
  isStudentEnrolled(subjectId: string, studentId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const subject = this.mockDataService.getSubjectById(subjectId);
        return subject?.enrolledStudents.includes(studentId) || false;
      })
    );
  }

  // Get subject statistics
  getSubjectStats(subjectId: string): Observable<any> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const subject = this.mockDataService.getSubjectById(subjectId);
        if (!subject) return null;

        return {
          totalEnrolled: subject.enrolledStudents.length,
          schedule: subject.schedule,
          room: subject.room,
          capacity: subject.capacity,
          availableSeats: subject.capacity - subject.enrolledStudents.length
        };
      })
    );
  }
}
