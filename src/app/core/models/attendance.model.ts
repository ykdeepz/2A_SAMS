export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  date: Date;
  status: AttendanceStatus;
  markedAt: Date;
  markedBy: string; // instructor ID
  notes?: string;
}

export interface AttendanceStats {
  totalClasses: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export interface AttendanceRequest {
  studentId: string;
  subjectId: string;
  status: AttendanceStatus;
  notes?: string;
}
