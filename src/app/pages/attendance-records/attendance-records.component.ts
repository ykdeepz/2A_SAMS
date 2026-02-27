import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-attendance-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-records.component.html',
  styleUrls: ['./attendance-records.component.css']
})
export class AttendanceRecordsComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);
  
  filterSubject = '';
  filterStatus = '';
  searchTerm = '';

  subjects = this.dataService.subjects;

  filteredRecords = computed(() => {
    let records = this.dataService.attendance();
    const user = this.authService.currentUser();

    // Role-based filtering
    if (user?.role === 'student') {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (student) {
        records = records.filter(r => r.student_id === student.student_id);
      }
    } else if (user?.role === 'parent') {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (parent) {
        records = records.filter(r => r.student_id === parent.student_id);
      }
    } else if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        records = records.filter(r => r.instructor_id === instructor.instructor_id);
      }
    }

    // Apply filters
    if (this.filterSubject) {
      records = records.filter(r => r.subject_id === this.filterSubject);
    }
    if (this.filterStatus) {
      records = records.filter(r => r.status === this.filterStatus);
    }
    if (this.searchTerm) {
      records = records.filter(r => 
        r.student_name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
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
