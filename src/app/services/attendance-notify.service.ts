import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { AppNotification } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AttendanceNotifyService {
  private dataService = inject(DataService);

  /**
   * Send in-app notifications to the instructor and parent(s)
   * when a student's attendance is recorded.
   */
  async notify(studentId: string, subjectId: string, status: string) {
    try {
      const student = this.dataService.students().find(s => s.student_id === studentId);
      const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
      if (!student || !subject) return;

      const instructor = this.dataService.instructors().find(i => i.instructor_id === subject.instructor_id);
      const parents = this.dataService.parents().filter(p => p.student_id === studentId);
      const now = new Date().toISOString();

      const writes: Promise<any>[] = [];

      // Notify instructor
      if (instructor?.user_id) {
        const n: AppNotification = {
          notification_id: 'N' + Date.now() + Math.random().toString(36).slice(2),
          user_id: instructor.user_id,
          message: `${student.full_name} marked ${status} in ${subject.subject_name}`,
          type: 'attendance',
          read: false,
          created_at: now
        };
        writes.push(this.dataService.addNotification(n));
      }

      // Notify each parent
      for (const parent of parents) {
        if (parent.user_id) {
          const n: AppNotification = {
            notification_id: 'N' + Date.now() + Math.random().toString(36).slice(2),
            user_id: parent.user_id,
            message: `${student.full_name} marked ${status} in ${subject.subject_name}`,
            type: 'attendance',
            read: false,
            created_at: now
          };
          writes.push(this.dataService.addNotification(n));
        }
      }

      await Promise.all(writes);
    } catch (err) {
      console.error('Notification write failed:', err);
    }
  }
}
