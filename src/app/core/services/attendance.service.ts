import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AttendanceRecord, AttendanceStats, AttendanceRequest, AttendanceStatus } from '../models';
import { MOCK_ATTENDANCE_RECORDS } from './mock-data';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private attendanceRecordsSubject = new BehaviorSubject<AttendanceRecord[]>(
    MOCK_ATTENDANCE_RECORDS
  );
  attendanceRecords$ = this.attendanceRecordsSubject.asObservable();

  constructor() {}

  markAttendance(request: AttendanceRequest): Observable<AttendanceRecord> {
    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      studentId: request.studentId,
      subjectId: request.subjectId,
      date: new Date(),
      status: request.status,
      markedAt: new Date(),
      markedBy: 'inst-001', // TODO: Get from auth service
      notes: request.notes,
    };

    MOCK_ATTENDANCE_RECORDS.push(record);
    this.attendanceRecordsSubject.next([...MOCK_ATTENDANCE_RECORDS]);
    return of(record);
  }

  getAttendanceBySubject(subjectId: string, date?: Date): Observable<AttendanceRecord[]> {
    let records = MOCK_ATTENDANCE_RECORDS.filter(r => r.subjectId === subjectId);

    if (date) {
      const targetDate = new Date(date).toDateString();
      records = records.filter(r => new Date(r.date).toDateString() === targetDate);
    }

    return of(records);
  }

  getAttendanceByStudent(studentId: string): Observable<AttendanceRecord[]> {
    const records = MOCK_ATTENDANCE_RECORDS.filter(r => r.studentId === studentId);
    return of(records);
  }

  getStudentAttendanceInSubject(
    studentId: string,
    subjectId: string
  ): Observable<AttendanceRecord[]> {
    const records = MOCK_ATTENDANCE_RECORDS.filter(
      r => r.studentId === studentId && r.subjectId === subjectId
    );
    return of(records);
  }

  checkIfAlreadyMarked(studentId: string, subjectId: string, date: Date): Observable<boolean> {
    const targetDate = new Date(date).toDateString();
    const exists = MOCK_ATTENDANCE_RECORDS.some(
      r =>
        r.studentId === studentId &&
        r.subjectId === subjectId &&
        new Date(r.date).toDateString() === targetDate
    );
    return of(exists);
  }

  getExistingAttendance(
    studentId: string,
    subjectId: string,
    date: Date
  ): Observable<AttendanceRecord | undefined> {
    const targetDate = new Date(date).toDateString();
    const record = MOCK_ATTENDANCE_RECORDS.find(
      r =>
        r.studentId === studentId &&
        r.subjectId === subjectId &&
        new Date(r.date).toDateString() === targetDate
    );
    return of(record);
  }

  updateAttendance(recordId: string, status: AttendanceStatus, notes?: string): Observable<AttendanceRecord | null> {
    const record = MOCK_ATTENDANCE_RECORDS.find(r => r.id === recordId);
    if (record) {
      record.status = status;
      record.notes = notes;
      this.attendanceRecordsSubject.next([...MOCK_ATTENDANCE_RECORDS]);
      return of(record);
    }
    return of(null);
  }

  deleteAttendance(recordId: string): Observable<boolean> {
    const index = MOCK_ATTENDANCE_RECORDS.findIndex(r => r.id === recordId);
    if (index > -1) {
      MOCK_ATTENDANCE_RECORDS.splice(index, 1);
      this.attendanceRecordsSubject.next([...MOCK_ATTENDANCE_RECORDS]);
      return of(true);
    }
    return of(false);
  }

  getAttendanceStats(subjectId: string, studentId?: string): Observable<AttendanceStats> {
    let records = MOCK_ATTENDANCE_RECORDS.filter(r => r.subjectId === subjectId);

    if (studentId) {
      records = records.filter(r => r.studentId === studentId);
    }

    const stats: AttendanceStats = {
      totalClasses: records.length || 1, // Prevent division by zero
      presentCount: records.filter(r => r.status === 'present').length,
      lateCount: records.filter(r => r.status === 'late').length,
      absentCount: records.filter(r => r.status === 'absent').length,
      attendancePercentage: records.length
        ? Math.round(
            ((records.filter(r => r.status === 'present').length +
              records.filter(r => r.status === 'late').length) /
              records.length) *
              100
          )
        : 0,
    };

    return of(stats);
  }

  getRecentAttendance(limit: number = 10): Observable<AttendanceRecord[]> {
    const sorted = [...MOCK_ATTENDANCE_RECORDS].sort(
      (a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime()
    );
    return of(sorted.slice(0, limit));
  }
}
