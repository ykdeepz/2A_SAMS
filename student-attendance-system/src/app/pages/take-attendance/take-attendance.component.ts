import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Attendance } from '../../models/user.model';

@Component({
  selector: 'app-take-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './take-attendance.component.html',
  styleUrls: ['./take-attendance.component.css']
})
export class TakeAttendanceComponent {
  dataService = inject(DataService);
  
  selectedSubjectId = '';
  scannerActive = signal(false);
  manualStudentId = '';
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  subjects = this.dataService.subjects;

  enrolledStudents = computed(() => {
    if (!this.selectedSubjectId) return [];
    const enrollments = this.dataService.enrollments()
      .filter(e => e.subject_id === this.selectedSubjectId);
    return this.dataService.students()
      .filter(s => enrollments.some(e => e.student_id === s.student_id));
  });

  onSubjectChange() {
    this.scannerActive.set(false);
  }

  startScanner() {
    this.scannerActive.set(true);
  }

  stopScanner() {
    this.scannerActive.set(false);
  }

  markAttendanceManual() {
    if (!this.manualStudentId) return;
    const student = this.dataService.students().find(s => s.student_id === this.manualStudentId);
    if (student) {
      this.recordAttendance(student.student_id, student.full_name, 'Present', 'Manual');
      this.manualStudentId = '';
    } else {
      this.showMessage('Student not found', 'error');
    }
  }

  markAttendance(studentId: string, event: any) {
    const status = event.target.value;
    if (!status) return;
    const student = this.dataService.students().find(s => s.student_id === studentId);
    if (student) {
      this.recordAttendance(studentId, student.full_name, status as any, 'Manual');
    }
    event.target.value = '';
  }

  recordAttendance(studentId: string, studentName: string, status: 'Present' | 'Late' | 'Absent' | 'Excused', method: 'QR' | 'Manual') {
    const subject = this.subjects().find(s => s.subject_id === this.selectedSubjectId);
    if (!subject) return;

    const record: Attendance = {
      attendance_id: 'ATT' + Date.now(),
      student_id: studentId,
      student_name: studentName,
      instructor_id: subject.instructor_id,
      subject_id: subject.subject_id,
      subject_name: subject.subject_name,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      status,
      method
    };

    const success = this.dataService.addAttendance(record);
    if (success) {
      this.showMessage(`Marked ${studentName} as ${status}`, 'success');
    } else {
      this.showMessage('Already marked today', 'error');
    }
  }

  isMarkedToday(studentId: string): boolean {
    const today = new Date().toDateString();
    return this.dataService.attendance().some(a => 
      a.student_id === studentId && 
      a.subject_id === this.selectedSubjectId &&
      new Date(a.date).toDateString() === today
    );
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message.set(msg);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }
}
