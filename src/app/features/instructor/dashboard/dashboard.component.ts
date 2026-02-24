// src/app/features/instructor/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { SubjectService } from '../../../core/services/subject.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { User } from '../../../core/models/user.model';
import { Subject as SubjectModel } from '../../../core/models/subject.model';
import { AttendanceRecord } from '../../../core/models/attendance.model';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class InstructorDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  subjects: SubjectModel[] = [];
  recentAttendance: AttendanceRecord[] = [];
  isLoading = true;

  stats = {
    totalSubjects: 0,
    totalStudents: 0,
    averageClassSize: 0,
    activeSemester: 'Spring 2026'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private subjectService: SubjectService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    this.subjectService.getSubjectsByInstructor(this.currentUser!.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(subjects => {
        this.subjects = subjects;
        this.calculateStats();
      });

    this.attendanceService.getRecentAttendance(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe(records => {
        this.recentAttendance = records;
        this.isLoading = false;
      });
  }

  calculateStats(): void {
    this.stats.totalSubjects = this.subjects.length;
    this.stats.totalStudents = new Set(
      this.subjects.flatMap(s => s.enrolledStudents)
    ).size;
    this.stats.averageClassSize = this.subjects.length > 0
      ? Math.round(this.stats.totalStudents / this.subjects.length)
      : 0;
  }

  navigateToSubject(subjectId: string): void {
    this.router.navigate(['/instructor/subject', subjectId]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'present':
        return 'badge-present';
      case 'late':
        return 'badge-late';
      case 'absent':
        return 'badge-absent';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'present':
        return 'Present';
      case 'late':
        return 'Late';
      case 'absent':
        return 'Absent';
      default:
        return status;
    }
  }
}
