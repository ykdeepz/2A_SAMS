import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Subject, SubjectStats } from '../models';
import { MOCK_SUBJECTS } from './mock-data';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private subjectsSubject = new BehaviorSubject<Subject[]>(MOCK_SUBJECTS);
  subjects$ = this.subjectsSubject.asObservable();

  constructor(private authService: AuthService) {}

  getAllSubjects(): Observable<Subject[]> {
    return of(MOCK_SUBJECTS);
  }

  getInstructorSubjects(instructorId: string): Observable<Subject[]> {
    const subjects = MOCK_SUBJECTS.filter(s => s.instructorId === instructorId);
    return of(subjects);
  }

  getSubjectById(id: string): Observable<Subject | undefined> {
    const subject = MOCK_SUBJECTS.find(s => s.id === id);
    return of(subject);
  }

  getSubjectsByStudentId(studentId: string): Observable<Subject[]> {
    const subjects = MOCK_SUBJECTS.filter(s => s.enrolledStudents.includes(studentId));
    return of(subjects);
  }

  addStudent(subjectId: string, studentId: string): Observable<Subject | null> {
    const subject = MOCK_SUBJECTS.find(s => s.id === subjectId);
    if (subject && !subject.enrolledStudents.includes(studentId)) {
      subject.enrolledStudents.push(studentId);
      this.subjectsSubject.next([...MOCK_SUBJECTS]);
      return of(subject);
    }
    return of(null);
  }

  removeStudent(subjectId: string, studentId: string): Observable<Subject | null> {
    const subject = MOCK_SUBJECTS.find(s => s.id === subjectId);
    if (subject) {
      subject.enrolledStudents = subject.enrolledStudents.filter(id => id !== studentId);
      this.subjectsSubject.next([...MOCK_SUBJECTS]);
      return of(subject);
    }
    return of(null);
  }

  getSubjectStats(subjectId: string): Observable<SubjectStats | null> {
    const subject = MOCK_SUBJECTS.find(s => s.id === subjectId);
    if (subject) {
      const stats: SubjectStats = {
        totalEnrolled: subject.enrolledStudents.length,
        totalClasses: 20, // Mock value
        averageAttendance: 85, // Mock value
        room: subject.room,
        schedule: subject.schedule,
      };
      return of(stats);
    }
    return of(null);
  }

  addSubject(subject: Subject): Observable<Subject> {
    MOCK_SUBJECTS.push(subject);
    this.subjectsSubject.next([...MOCK_SUBJECTS]);
    return of(subject);
  }

  updateSubject(subject: Subject): Observable<Subject> {
    const index = MOCK_SUBJECTS.findIndex(s => s.id === subject.id);
    if (index > -1) {
      MOCK_SUBJECTS[index] = subject;
      this.subjectsSubject.next([...MOCK_SUBJECTS]);
    }
    return of(subject);
  }

  deleteSubject(id: string): Observable<boolean> {
    const index = MOCK_SUBJECTS.findIndex(s => s.id === id);
    if (index > -1) {
      MOCK_SUBJECTS.splice(index, 1);
      this.subjectsSubject.next([...MOCK_SUBJECTS]);
      return of(true);
    }
    return of(false);
  }
}
