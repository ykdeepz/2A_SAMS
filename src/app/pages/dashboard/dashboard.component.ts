import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { LucideAngularModule, Users, BookOpen, TrendingUp, UserX, ClipboardList, Calendar, RotateCcw } from 'lucide-angular';
import { CalendarComponent } from '../calendar/calendar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, CalendarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private roleService = inject(RoleService);

  // Public access for template
  get auth() { return this.authService; }

  // Lucide icons
  readonly Users = Users;
  readonly BookOpen = BookOpen;
  readonly TrendingUp = TrendingUp;
  readonly UserX = UserX;
  readonly ClipboardList = ClipboardList;
  readonly CalendarIcon = Calendar;
  readonly RotateCcw = RotateCcw;

  canTakeAttendance = this.roleService.canTakeAttendance;
  isStudent = this.roleService.isStudent;
  isParent = this.roleService.isParent;
  showQuickActions = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'instructor';
  });

  getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      'Users': this.Users,
      'BookOpen': this.BookOpen,
      'TrendingUp': this.TrendingUp,
      'UserX': this.UserX,
      'ClipboardList': this.ClipboardList
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
      if (student) {
        attendance = attendance.filter(a => a.student_id === student.student_id);
      }
      const presentCount = attendance.filter(a => a.status === 'Present').length;
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
      const absentCount = attendance.filter(a => a.status === 'Absent').length;
      return [
        { label: 'My Subjects', value: this.dataService.enrollments().filter(e => e.student_id === student?.student_id).length, icon: 'BookOpen', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
        { label: 'Total Records', value: attendance.length, icon: 'ClipboardList', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
        { label: 'Attendance Rate', value: attendanceRate + '%', icon: 'TrendingUp', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
        { label: 'Absences', value: absentCount, icon: 'UserX', bgColor: 'bg-red-100', textColor: 'text-red-600' }
      ];
    } else if (role === 'parent' && user) {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (parent) {
        attendance = attendance.filter(a => a.student_id === parent.student_id);
      }
      const presentCount = attendance.filter(a => a.status === 'Present').length;
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
      const absentCount = attendance.filter(a => a.status === 'Absent').length;
      return [
        { label: "Child's Records", value: attendance.length, icon: 'ClipboardList', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
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

  recentAttendance = computed(() => {
    const role = this.authService.currentUser()?.role;
    const user = this.authService.currentUser();
    let attendance = this.dataService.attendance();
    
    if (role === 'instructor' && user) {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        attendance = attendance.filter(a => a.instructor_id === instructor.instructor_id);
      }
    } else if (role === 'student' && user) {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (student) {
        attendance = attendance.filter(a => a.student_id === student.student_id);
      }
    } else if (role === 'parent' && user) {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (parent) {
        attendance = attendance.filter(a => a.student_id === parent.student_id);
      }
    }
    
    // Remove duplicates based on student_id and date (keep most recent)
    const uniqueMap = new Map<string, any>();
    attendance.slice().reverse().forEach(record => {
      const key = `${record.student_id}-${new Date(record.date).toDateString()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, record);
      }
    });
    
    return Array.from(uniqueMap.values()).slice(-5).reverse();
  });

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'Present': 'bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium',
      'Late': 'bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-sm font-medium',
      'Absent': 'bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium',
      'Excused': 'bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-medium'
    };
    return classes[status] || '';
  }

  ngOnInit() {
    // Implement daily auto-clear of attendance records at midnight
    this.setupDailyAutoClear();
  }

  private setupDailyAutoClear() {
    const checkAndClear = () => {
      const lastClearDate = localStorage.getItem('lastAttendanceClearDate');
      const today = new Date().toDateString();
      
      if (lastClearDate !== today) {
        // Clear attendance records for previous day (optional - for archival purposes)
        // This can be customized based on business logic
        localStorage.setItem('lastAttendanceClearDate', today);
      }
    };

    // Check every minute
   setInterval(checkAndClear, 60000);
    checkAndClear(); // Initial check
  }

  async resetStatistics() {
    const result = await Swal.fire({
      title: 'Reset Statistics?',
      text: 'This will clear all attendance records. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, reset all',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await this.dataService.resetAllAttendance();
        
        await Swal.fire({
          title: 'Success!',
          text: 'All statistics have been reset.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to reset statistics.',
          icon: 'error'
        });
      }
    }
  }
}
