import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {}

  stats = computed(() => {
    const role = this.authService.currentUser()?.role;
    const students = this.dataService.students();
    const subjects = this.dataService.subjects();
    const attendance = this.dataService.attendance();
    
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return [
      { label: 'Total Students', value: students.length, icon: '👥', bgColorClass: 'bg-indigo' },
      { label: 'Total Subjects', value: subjects.length, icon: '📚', bgColorClass: 'bg-green' },
      { label: 'Attendance Rate', value: attendanceRate + '%', icon: '📊', bgColorClass: 'bg-amber' },
      { label: 'Today\'s Records', value: this.getTodayCount(), icon: '✓', bgColorClass: 'bg-red' }
    ];
  });

  recentAttendance = computed(() => {
    return this.dataService.attendance().slice(-5).reverse();
  });

  getTodayCount(): number {
    const today = new Date().toDateString();
    return this.dataService.attendance().filter(a => 
      new Date(a.date).toDateString() === today
    ).length;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'Present': 'status-present',
      'Late': 'status-late',
      'Absent': 'status-absent',
      'Excused': 'status-excused'
    };
    return classes[status] || '';
  }
}
