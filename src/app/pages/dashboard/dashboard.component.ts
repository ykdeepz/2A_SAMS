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
      { label: 'Total Students', value: students.length, icon: '👥', bgColor: 'bg-indigo-100' },
      { label: 'Total Subjects', value: subjects.length, icon: '📚', bgColor: 'bg-green-100' },
      { label: 'Attendance Rate', value: attendanceRate + '%', icon: '📊', bgColor: 'bg-amber-100' },
      { label: 'Today\'s Records', value: this.getTodayCount(), icon: '✓', bgColor: 'bg-red-100' }
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
      'Present': 'px-3 py-1 rounded-full text-sm bg-green-100 text-green-800',
      'Late': 'px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800',
      'Absent': 'px-3 py-1 rounded-full text-sm bg-red-100 text-red-800',
      'Excused': 'px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800'
    };
    return classes[status] || '';
  }
}
