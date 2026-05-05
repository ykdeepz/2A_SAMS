import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { LucideAngularModule, TrendingUp, UserX, Users, BookOpen } from 'lucide-angular';
import { CalendarComponent } from '../calendar/calendar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CalendarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private roleService = inject(RoleService);

  get auth() { return this.authService; }

  readonly Users = Users;
  readonly BookOpen = BookOpen;
  readonly TrendingUp = TrendingUp;
  readonly UserX = UserX;

  // Toggled off then on in ngOnInit to force the calendar component
  // to be destroyed and re-created every time the dashboard is visited,
  // which fixes the blank-calendar bug after navigating away and back.
  calendarVisible = signal(false);

  ngOnInit() {
    // Defer by one tick so the @if removes the old instance first
    setTimeout(() => this.calendarVisible.set(true), 0);
    this.setupDailyAutoClear();
  }

  ngOnDestroy() {
    this.calendarVisible.set(false);
  }

  getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      'Users': this.Users,
      'BookOpen': this.BookOpen,
      'TrendingUp': this.TrendingUp,
      'UserX': this.UserX,
    };
    return iconMap[iconName];
  }

  stats = computed(() => {
    const role = this.authService.currentUser()?.role;
    const user = this.authService.currentUser();
    let students = this.dataService.students();
    let subjects = this.dataService.subjects();
    let attendance = this.dataService.attendance();

    if (role === 'instructor' && user) {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        subjects = subjects.filter(s => s.instructor_id === instructor.instructor_id);
        students = students.filter(st => st.instructor_id === instructor.instructor_id);
        attendance = attendance.filter(a => a.instructor_id === instructor.instructor_id);
      }
    } else if (role === 'student' && user) {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (student) attendance = attendance.filter(a => a.student_id === student.student_id);
      const presentCount = attendance.filter(a => a.status === 'Present').length;
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
      const absentCount = attendance.filter(a => a.status === 'Absent').length;
      return [
        { label: 'My Subjects', value: this.dataService.enrollments().filter(e => e.student_id === student?.student_id).length, icon: 'BookOpen', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
        { label: 'Total Records', value: attendance.length, icon: 'TrendingUp', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
        { label: 'Attendance Rate', value: attendanceRate + '%', icon: 'TrendingUp', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
        { label: 'Absences', value: absentCount, icon: 'UserX', bgColor: 'bg-red-100', textColor: 'text-red-600' }
      ];
    } else if (role === 'parent' && user) {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (parent) attendance = attendance.filter(a => a.student_id === parent.student_id);
      const presentCount = attendance.filter(a => a.status === 'Present').length;
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
      const absentCount = attendance.filter(a => a.status === 'Absent').length;
      return [
        { label: "Child's Records", value: attendance.length, icon: 'TrendingUp', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
        { label: 'Present', value: presentCount, icon: 'TrendingUp', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
        { label: 'Attendance Rate', value: attendanceRate + '%', icon: 'TrendingUp', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
        { label: 'Absences', value: absentCount, icon: 'UserX', bgColor: 'bg-red-100', textColor: 'text-red-600' }
      ];
    }

    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
    const absentToday = attendance.filter(a =>
      new Date(a.date).toDateString() === new Date().toDateString() && a.status === 'Absent'
    ).length;

    return [
      { label: 'Total Students', value: students.length, icon: 'Users', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
      { label: 'Total Subjects', value: subjects.length, icon: 'BookOpen', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
      { label: 'Attendance Rate', value: attendanceRate + '%', icon: 'TrendingUp', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
      { label: 'Absent Today', value: absentToday, icon: 'UserX', bgColor: 'bg-red-100', textColor: 'text-red-600' }
    ];
  });

  private setupDailyAutoClear() {
    const checkAndClear = () => {
      const lastClearDate = localStorage.getItem('lastAttendanceClearDate');
      const today = new Date().toDateString();
      if (lastClearDate !== today) {
        localStorage.setItem('lastAttendanceClearDate', today);
      }
    };
    setInterval(checkAndClear, 60000);
    checkAndClear();
  }
}
