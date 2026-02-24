// src/app/core/models/attendance.model.ts

import { AttendanceStatus } from './user.model';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  date: Date;
  status: AttendanceStatus;
  markedAt: Date;
  markedBy: string;
  notes?: string;
}

export interface AttendanceStats {
  totalClasses: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendancePercentage: number;
}
