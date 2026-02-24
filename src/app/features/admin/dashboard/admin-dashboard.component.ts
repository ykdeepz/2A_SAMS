import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SubjectService } from '../../../core/services/subject.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { StudentService } from '../../../core/services/student.service';
import { User, Subject, AttendanceRecord, Student } from '../../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: 'dashboard' | 'users' | 'subjects' | 'attendance' | 'reports' = 'dashboard';
  
  // Dashboard stats
  totalInstructors: number = 0;
  totalStudents: number = 0;
  totalParents: number = 0;
  totalSubjects: number = 0;
  
  // Lists
  allInstructors: User[] = [];
  allStudents: Student[] = [];
  allSubjects: Subject[] = [];
  allAttendance: AttendanceRecord[] = [];
  
  // Search and filter
  searchTerm: string = '';
  filterRole: 'all' | 'instructor' | 'student' | 'parent' = 'all';
  
  // Message
  message: string = '';
  messageColor: string = 'red';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private subjectService: SubjectService,
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  private loadCurrentUser(): void {
    try {
      const userStr = localStorage.getItem('sams_current_user_v1');
      if (userStr) {
        const userData = JSON.parse(userStr);
        // Create a basic user object from localStorage
        this.currentUser = {
          id: userData.id,
          email: userData.id,
          role: userData.role,
          name: userData.id,
          password: ''
        };
      }
    } catch (e) {
      // ignore
    }
  }

  private loadDashboardData(): void {
    this.loadInstructors();
    this.loadStudents();
    this.loadSubjects();
    this.loadAttendance();
  }

  private loadInstructors(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.allInstructors = users.filter(u => u.role === 'instructor');
        this.totalInstructors = this.allInstructors.length;
      }
    });
  }

  private loadStudents(): void {
    this.studentService.getAllStudents().subscribe({
      next: (students: Student[]) => {
        this.allStudents = students;
        this.totalStudents = this.allStudents.length;
      }
    });
  }

  private loadSubjects(): void {
    this.subjectService.getAllSubjects().subscribe({
      next: (subjects: Subject[]) => {
        this.allSubjects = subjects;
        this.totalSubjects = this.allSubjects.length;
      }
    });
  }

  private loadAttendance(): void {
    this.attendanceService.getRecentAttendance(1000).subscribe({
      next: (records: AttendanceRecord[]) => {
        this.allAttendance = records;
      }
    });
  }

  switchTab(tab: 'dashboard' | 'users' | 'subjects' | 'attendance' | 'reports'): void {
    this.activeTab = tab;
  }

  getFilteredInstructors(): User[] {
    return this.allInstructors.filter(instructor =>
      instructor.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      instructor.email?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getFilteredStudents(): Student[] {
    return this.allStudents.filter(student =>
      student.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getFilteredSubjects(): Subject[] {
    return this.allSubjects.filter(subject =>
      subject.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      subject.code?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  deleteInstructor(id: string): void {
    if (confirm('Are you sure you want to delete this instructor?')) {
      const index = this.allInstructors.findIndex(i => i.id === id);
      if (index > -1) {
        this.allInstructors.splice(index, 1);
        this.totalInstructors = this.allInstructors.length;
        this.setSuccess('Instructor deleted successfully.');
      }
    }
  }

  deleteStudent(id: string): void {
    if (confirm('Are you sure you want to delete this student?')) {
      this.studentService.deleteStudent(id).subscribe({
        next: (success) => {
          if (success) {
            this.loadStudents();
            this.setSuccess('Student deleted successfully.');
          }
        }
      });
    }
  }

  deleteSubject(id: string): void {
    if (confirm('Are you sure you want to delete this subject?')) {
      this.subjectService.deleteSubject(id).subscribe({
        next: (success) => {
          if (success) {
            this.loadSubjects();
            this.setSuccess('Subject deleted successfully.');
          }
        }
      });
    }
  }

  logout(): void {
    try {
      localStorage.removeItem('sams_current_user_v1');
      localStorage.removeItem('sams_registered_credentials_v1');
    } catch (e) {
      // ignore
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setSuccess(message: string): void {
    this.message = message;
    this.messageColor = 'green';
    setTimeout(() => (this.message = ''), 3000);
  }

  private setError(message: string): void {
    this.message = message;
    this.messageColor = 'red';
    setTimeout(() => (this.message = ''), 3000);
  }
}
