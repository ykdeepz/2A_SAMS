import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SubjectService } from '../../../core/services/subject.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { StudentService } from '../../../core/services/student.service';
import { User, Subject, AttendanceRecord, Student, AttendanceRequest } from '../../../core/models';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, FormsModule],
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css'],
})
export class InstructorDashboardComponent implements OnInit {
  currentUser: User | null = null;
  subjects: Subject[] = [];
  recentAttendance: AttendanceRecord[] = [];
  allStudents: Student[] = [];
  selectedSubject: Subject | null = null;
  manualAttendanceMode: boolean = false;
  showSidebar: boolean = false;
  selectedStudentId: string = '';
  selectedSubjectId: string = '';
  attendanceStatus: 'present' | 'absent' | 'late' = 'present';
  showConfirmation: boolean = false;
  confirmationMessage: string = '';
  confirmationTimeout: any;

  constructor(
    private authService: AuthService,
    private subjectService: SubjectService,
    private attendanceService: AttendanceService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSubjects();
    this.loadRecentAttendance();
    this.loadAllStudents();
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  loadSubjects(): void {
    if (this.currentUser) {
      this.subjectService.getInstructorSubjects(this.currentUser.id).subscribe(
        (subjects) => {
          this.subjects = subjects;
          if (subjects.length > 0 && !this.selectedSubjectId) {
            this.selectedSubjectId = subjects[0].id;
          }
        },
        (error) => console.error('Error loading subjects:', error)
      );
    }
  }

  loadRecentAttendance(): void {
    this.attendanceService.getRecentAttendance(10).subscribe(
      (records) => {
        this.recentAttendance = records;
      },
      (error) => console.error('Error loading attendance:', error)
    );
  }

  loadAllStudents(): void {
    this.studentService.getAllStudents().subscribe(
      (students) => {
        this.allStudents = students;
      },
      (error) => console.error('Error loading students:', error)
    );
  }

  markAttendanceManually(): void {
    if (this.selectedStudentId && this.selectedSubjectId) {
      const request: AttendanceRequest = {
        studentId: this.selectedStudentId,
        subjectId: this.selectedSubjectId,
        status: this.attendanceStatus,
      };

      this.attendanceService.markAttendance(request).subscribe(
        () => {
          const studentName = this.getStudentName(this.selectedStudentId);
          const statusText = this.attendanceStatus.charAt(0).toUpperCase() + this.attendanceStatus.slice(1);
          
          // Show confirmation message
          this.confirmationMessage = `✓ ${studentName}'s attendance marked as "${statusText}"`;
          this.showConfirmation = true;
          
          // Auto-hide after 3 seconds
          if (this.confirmationTimeout) {
            clearTimeout(this.confirmationTimeout);
          }
          this.confirmationTimeout = setTimeout(() => {
            this.showConfirmation = false;
          }, 3000);
          
          this.selectedStudentId = '';
          this.attendanceStatus = 'present';
          this.loadRecentAttendance();
        },
        (error) => {
          console.error('Error marking attendance:', error);
          this.confirmationMessage = '✗ Error marking attendance. Please try again.';
          this.showConfirmation = true;
          setTimeout(() => {
            this.showConfirmation = false;
          }, 3000);
        }
      );
    }
  }

  getTodaySchedule(): Subject[] {
    return this.subjects.slice(0, 3);
  }

  getStats() {
    const totalStudents = this.subjects.reduce((sum, s) => sum + s.enrolledStudents.length, 0);
    return {
      totalSubjects: this.subjects.length,
      totalStudents,
      avgClassSize: this.subjects.length ? Math.round(totalStudents / this.subjects.length) : 0,
      activeSemester: 'Spring 2026',
    };
  }

  getStudentName(studentId: string): string {
    const student = this.allStudents.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.code : 'Unknown Subject';
  }

  getSubjectColor(index: number): string {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[index % colors.length];
  }

  toggleManualAttendanceMode(): void {
    this.manualAttendanceMode = !this.manualAttendanceMode;
  }

  getEnrolledStudents(): Student[] {
    if (!this.selectedSubjectId) return [];
    const subject = this.subjects.find(s => s.id === this.selectedSubjectId);
    if (!subject) return [];
    return this.allStudents.filter(s => subject.enrolledStudents.includes(s.id));
  }
}
