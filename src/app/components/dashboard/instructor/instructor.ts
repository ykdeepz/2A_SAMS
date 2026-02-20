import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { User, StudentUser, Subject, InstructorUser } from '../../../models/models';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-instructor',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './instructor.html',
  styleUrls: ['./instructor.css'],
})
export class Instructor implements OnInit {
  currentUser: InstructorUser | null = null;
  activeSection: string = 'dashboard';
  subjects: Subject[] = [];
  selectedSubject: Subject | null = null;
  students: StudentUser[] = [];
  newStudentId: string = '';
  qrResult: string = '';
  showScanner: boolean = false;
  showCreateSubject: boolean = false;
  showAttendance: boolean = false;
  foundStudent: StudentUser | null = null;
  studentSearchMessage: string = '';
  studentSearchMessageColor: string = '';
  newSubject: { name: string; code: string; schedule: { days: string; time: string; room: string } } = { name: '', code: '', schedule: { days: '', time: '', room: '' } };
  attendanceStatus: { [studentId: string]: string } = {};

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit(): void {
    this.currentUser = this.dataService.getCurrentUser() as InstructorUser;
    if (!this.currentUser || this.currentUser.role !== 'instructor') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadSubjects();
  }

  loadSubjects(): void {
    if (this.currentUser) {
      this.subjects = this.dataService.getSubjectsByInstructor(this.currentUser.id);
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    if (section === 'subjects') {
      this.selectedSubject = null;
      this.students = [];
    }
  }

  selectSubject(subject: Subject): void {
    this.selectedSubject = subject;
    this.students = this.dataService.getStudentsBySubject(subject.id);
    this.showAttendance = false;
    this.attendanceStatus = {};
  }

  createSubject(): void {
    if (this.currentUser && this.newSubject.name && this.newSubject.code) {
      const subject = this.dataService.createSubject({
        name: this.newSubject.name,
        code: this.newSubject.code,
        instructorId: this.currentUser.id,
        enrolledStudents: [],
        schedule: {
          days: this.newSubject.schedule.days.split(',').map(d => d.trim()),
          time: this.newSubject.schedule.time,
          room: this.newSubject.schedule.room
        }
      });
      this.subjects.push(subject);
      this.newSubject = { name: '', code: '', schedule: { days: '', time: '', room: '' } };
      this.showCreateSubject = false;
    }
  }

  recordAttendance(): void {
    if (!this.selectedSubject) return;
    const today = new Date().toISOString().split('T')[0];
    this.students.forEach(student => {
      const status = this.attendanceStatus[student.id] || 'absent';
      this.dataService.recordAttendance({
        subjectId: this.selectedSubject!.id,
        studentId: student.id,
        date: today,
        status: status as 'present' | 'absent' | 'late'
      });
    });
    alert('Attendance recorded');
    this.showAttendance = false;
    // Clear attendance status for next time
    this.attendanceStatus = {};
  }

  addStudent(): void {
    if (!this.selectedSubject || !this.newStudentId.trim()) return;
    const student = this.dataService.getStudentById(this.newStudentId.trim());
    if (student) {
      const alreadyEnrolled = this.students.some(s => s.id === student.id);
      if (alreadyEnrolled) {
        this.setStudentSearchError('Student is already enrolled in this class');
        return;
      }
      this.dataService.addStudentToSubject(this.selectedSubject.id, student.studentId);
      this.students = this.dataService.getStudentsBySubject(this.selectedSubject.id);
      this.setStudentSearchSuccess(`${student.name} added successfully`);
      this.newStudentId = '';
      this.foundStudent = null;
      // Clear message after 2 seconds
      setTimeout(() => {
        this.studentSearchMessage = '';
      }, 2000);
    } else {
      this.setStudentSearchError('Student ID not found or not registered');
    }
  }

  searchStudent(): void {
    if (!this.newStudentId.trim()) {
      this.foundStudent = null;
      this.studentSearchMessage = '';
      return;
    }
    
    const student = this.dataService.getStudentById(this.newStudentId.trim());
    
    if (student) {
      this.foundStudent = student;
      this.setStudentSearchSuccess(`Found: ${student.name}`);
    } else {
      this.foundStudent = null;
      this.setStudentSearchError('Student ID not found. Please check and try again.');
    }
  }

  private setStudentSearchError(message: string): void {
    this.studentSearchMessage = message;
    this.studentSearchMessageColor = 'red';
  }

  private setStudentSearchSuccess(message: string): void {
    this.studentSearchMessage = message;
    this.studentSearchMessageColor = 'green';
  }

  clearStudentSearch(): void {
    this.newStudentId = '';
    this.foundStudent = null;
    this.studentSearchMessage = '';
  }

  removeStudent(studentId: string): void {
    if (!this.selectedSubject) return;
    this.dataService.removeStudentFromSubject(this.selectedSubject.id, studentId);
    this.students = this.dataService.getStudentsBySubject(this.selectedSubject.id);
  }

  scanQR(): void {
    this.showScanner = true;
  }

  onScanSuccess(result: string): void {
    this.qrResult = result;
    this.showScanner = false;
    // Assume QR contains student ID
    this.newStudentId = result;
    this.searchStudent();
  }

  logout(): void {
    try { localStorage.removeItem('sams_current_user_v1'); } catch (e) {}
    this.router.navigate(['/login']);
  }

  getTotalStudents(): number {
    return this.subjects.reduce((total, subject) => total + subject.enrolledStudents.length, 0);
  }

  getTodayAttendanceStats(): { present: number; absent: number; late: number; total: number; presentPercent: number; absentPercent: number; latePercent: number } {
    const today = new Date().toISOString().split('T')[0];
    const total = this.getTotalStudents();
    
    if (total === 0) {
      return { present: 0, absent: 0, late: 0, total: 0, presentPercent: 0, absentPercent: 0, latePercent: 0 };
    }

    const todayAttendances = this.dataService.getAttendanceForDate(today);
    
    // Get attendance records for the instructor's subjects only
    const subjectIds = new Set(this.subjects.map(s => s.id));
    const relevantAttendances = todayAttendances.filter(a => subjectIds.has(a.subjectId));

    const present = relevantAttendances.filter(a => a.status === 'present').length;
    const absent = relevantAttendances.filter(a => a.status === 'absent').length;
    const late = relevantAttendances.filter(a => a.status === 'late').length;
    const marked = present + absent + late;

    // If no one is marked, assume 0 attendance
    if (marked === 0) {
      return { present: 0, absent: total, late: 0, total, presentPercent: 0, absentPercent: 100, latePercent: 0 };
    }

    const presentPercent = Math.round((present / total) * 100);
    const absentPercent = Math.round((absent / total) * 100);
    const latePercent = Math.round((late / total) * 100);

    return { present, absent, late, total, presentPercent, absentPercent, latePercent };
  }

  checkAttendance(subject: Subject): void {
    this.setActiveSection('subjects');
    this.selectSubject(subject);
    this.showAttendance = true;
  }

  generateReport(subject: Subject): void {
    alert(`Generating report for ${subject.name}`);
    // TODO: Implement report generation
  }
}
