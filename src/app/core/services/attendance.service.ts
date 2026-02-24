// src/app/core/services/attendance.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AttendanceRecord, AttendanceStats } from '../models/attendance.model';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private attendanceRecords = new BehaviorSubject<AttendanceRecord[]>([]);
  public attendanceRecords$ = this.attendanceRecords.asObservable();

  constructor(private mockDataService: MockDataService) {
    // Initialize with mock data
    this.attendanceRecords.next(this.mockDataService.mockAttendanceRecords);
  }

  // Get all attendance records
  getAllAttendance(): Observable<AttendanceRecord[]> {
    return of(this.attendanceRecords.value).pipe(delay(300));
  }

  // Get attendance by student ID
  getAttendanceByStudent(studentId: string): Observable<AttendanceRecord[]> {
    const records = this.mockDataService.getAttendanceByStudent(studentId);
    return of(records).pipe(delay(300));
  }

  // Get attendance by subject ID
  getAttendanceBySubject(subjectId: string, date?: Date): Observable<AttendanceRecord[]> {
    const records = this.mockDataService.getAttendanceBySubject(subjectId, date);
    return of(records).pipe(delay(300));
  }

  // Mark attendance
  markAttendance(studentId: string, subjectId: string, status: 'present' | 'late' | 'absent', notes?: string, markedBy?: string): Observable<AttendanceRecord> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          studentId,
          subjectId,
          date: new Date(),
          status,
          markedAt: new Date(),
          markedBy: markedBy || 'system',
          notes
        };

        const currentRecords = this.attendanceRecords.value;
        currentRecords.push(newRecord);
        this.attendanceRecords.next([...currentRecords]);

        return newRecord;
      })
    );
  }

  // Check if already marked today
  checkIfAlreadyMarked(studentId: string, subjectId: string): Observable<AttendanceRecord | null> {
    const today = new Date().toDateString();
    const record = this.attendanceRecords.value.find(a => 
      a.studentId === studentId &&
      a.subjectId === subjectId &&
      new Date(a.date).toDateString() === today
    );
    return of(record || null).pipe(delay(300));
  }

  // Update attendance
  updateAttendance(attendanceId: string, status: 'present' | 'late' | 'absent', notes?: string): Observable<AttendanceRecord | null> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentRecords = this.attendanceRecords.value;
        const index = currentRecords.findIndex(a => a.id === attendanceId);
        
        if (index !== -1) {
          currentRecords[index] = {
            ...currentRecords[index],
            status,
            notes: notes || currentRecords[index].notes
          };
          this.attendanceRecords.next([...currentRecords]);
          return currentRecords[index];
        }
        return null;
      })
    );
  }

  // Delete attendance
  deleteAttendance(attendanceId: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentRecords = this.attendanceRecords.value;
        const index = currentRecords.findIndex(a => a.id === attendanceId);
        
        if (index !== -1) {
          currentRecords.splice(index, 1);
          this.attendanceRecords.next([...currentRecords]);
          return true;
        }
        return false;
      })
    );
  }

  // Get attendance statistics for a student in a subject
  getAttendanceStats(studentId: string, subjectId: string): Observable<AttendanceStats> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const records = this.attendanceRecords.value.filter(a => 
          a.studentId === studentId && a.subjectId === subjectId
        );

        const presentCount = records.filter(a => a.status === 'present').length;
        const lateCount = records.filter(a => a.status === 'late').length;
        const absentCount = records.filter(a => a.status === 'absent').length;
        const totalClasses = presentCount + lateCount + absentCount;

        return {
          totalClasses,
          presentCount,
          lateCount,
          absentCount,
          attendancePercentage: totalClasses > 0 ? Math.round(((presentCount) / totalClasses) * 100) : 0
        };
      })
    );
  }

  // Get latest attendance records (for dashboard)
  getRecentAttendance(limit: number = 10): Observable<AttendanceRecord[]> {
    return of(null).pipe(
      delay(300),
      map(() => {
        return this.attendanceRecords.value
          .sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime())
          .slice(0, limit);
      })
    );
  }
}

import { map } from 'rxjs/operators';
