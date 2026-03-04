import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Attendance } from '../../models/user.model';
import { LucideAngularModule, Users, QrCode, Camera, CheckCircle2, XCircle, AlertCircle, RotateCcw, BookOpen } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-take-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './take-attendance.component.html',
  styleUrls: ['./take-attendance.component.css']
})
export class TakeAttendanceComponent implements OnInit {
  dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  
  // Lucide icons
  readonly Users = Users;
  readonly QrCode = QrCode;
  readonly Camera = Camera;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertCircle = AlertCircle;
  readonly RotateCcw = RotateCcw;
  readonly BookOpen = BookOpen;
  
  selectedSubjectId = '';
  scannerActive = signal(false);
  manualStudentId = '';
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  subjects = this.dataService.subjects;

  ngOnInit() {
    // Check if subject ID was passed via query params
    this.route.queryParams.subscribe(params => {
      if (params['subjectId']) {
        this.selectedSubjectId = params['subjectId'];
      }
    });
  }

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

  async recordAttendance(studentId: string, studentName: string, status: 'Present' | 'Late' | 'Absent' | 'Excused', method: 'QR' | 'Manual') {
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

    const success = await this.dataService.addAttendance(record);
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

  async clearAllMarks() {
    if (!this.selectedSubjectId) return;
    
    const result = await Swal.fire({
      title: 'Clear All Marks?',
      text: 'Are you sure you want to clear all attendance marks for today? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const today = new Date().toDateString();
      const currentAttendance = this.dataService.attendance();
      const filteredAttendance = currentAttendance.filter(a => 
        !(a.subject_id === this.selectedSubjectId && new Date(a.date).toDateString() === today)
      );
      
      this.dataService.attendance.set(filteredAttendance);
      
      Swal.fire({
        icon: 'success',
        title: 'Cleared!',
        text: 'All marks have been cleared for today',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  getSelectedSubject() {
    return this.subjects().find(s => s.subject_id === this.selectedSubjectId);
  }
}
