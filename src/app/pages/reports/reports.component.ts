import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Workbook } from 'exceljs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);
  
  filterSubject = '';
  dateRange = '30';
  selectedMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  subjects = computed(() => {
    const user = this.authService.currentUser();
    const all = this.dataService.subjects();
    if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      return instructor ? all.filter(s => s.instructor_id === instructor.instructor_id) : [];
    }
    return all;
  });

  filteredRecords = computed(() => {
    const user = this.authService.currentUser();
    let records = this.dataService.attendance();

    // Instructors only see their own subjects
    if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        records = records.filter(r => r.instructor_id === instructor.instructor_id);
      }
    }

    if (this.filterSubject) {
      records = records.filter(r => r.subject_id === this.filterSubject);
    }

    const daysAgo = parseInt(this.dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    records = records.filter(r => new Date(r.date) >= cutoffDate);

    return records;
  });

  statusStats = computed(() => {
    const records = this.filteredRecords();
    const total = records.length;
    if (total === 0) {
      return [
        { label: 'Present', value: 0, percentage: 0, color: '#10b981' },
        { label: 'Late',    value: 0, percentage: 0, color: '#f59e0b' },
        { label: 'Absent',  value: 0, percentage: 0, color: '#ef4444' },
        { label: 'Excused', value: 0, percentage: 0, color: '#3b82f6' }
      ];
    }

    const present = records.filter(r => r.status === 'Present').length;
    const late    = records.filter(r => r.status === 'Late').length;
    const absent  = records.filter(r => r.status === 'Absent').length;
    const excused = records.filter(r => r.status === 'Excused').length;

    return [
      { label: 'Present', value: present, percentage: Math.round((present / total) * 100), color: '#10b981' },
      { label: 'Late',    value: late,    percentage: Math.round((late    / total) * 100), color: '#f59e0b' },
      { label: 'Absent',  value: absent,  percentage: Math.round((absent  / total) * 100), color: '#ef4444' },
      { label: 'Excused', value: excused, percentage: Math.round((excused / total) * 100), color: '#3b82f6' }
    ];
  });

  async exportToExcel() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    // Get the selected month's start and end dates
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Get all attendance records for the selected month
    let attendanceRecords = this.dataService.attendance();
    
    // Filter by instructor if not admin
    if (currentUser.role === 'instructor') {
      const instructorProfile = await this.dataService.getInstructorByUserId(currentUser.user_id);
      if (instructorProfile) {
        attendanceRecords = attendanceRecords.filter(r => r.instructor_id === instructorProfile.instructor_id);
      }
    }

    // Filter by month
    attendanceRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // If a subject filter is active, apply it to the export too
    if (this.filterSubject) {
      attendanceRecords = attendanceRecords.filter(r => r.subject_id === this.filterSubject);
    }

    if (attendanceRecords.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'No attendance records found for the selected month.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    // Get unique students from attendance records
    const studentIds = [...new Set(attendanceRecords.map(r => r.student_id))];
    const students = this.dataService.students().filter(s => studentIds.includes(s.student_id));

    // Get unique class days across ALL records for the period (not per-student).
    // A student who was absent has no record for that day, so we must derive
    // class days from the full record set, not from each student's own records.
    const allClassDays = [...new Set(attendanceRecords.map(r => {
      const date = new Date(r.date);
      return date.toISOString().split('T')[0];
    }))].sort();
    const totalClassDays = allClassDays.length;

    // Prepare data for Excel
    const excelData: any[] = [];

    // Add header row
    const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    excelData.push([`Monthly Attendance Report - ${monthName}`]);
    excelData.push([]); // Empty row

    // Add column headers
    excelData.push(['Student Name', 'Days Conducted', 'Days Attended', 'Percentage']);

    // Calculate attendance for each student
    for (const student of students) {
      const studentRecords = attendanceRecords.filter(r => r.student_id === student.student_id);

      // Days attended = Present or Late
      const daysAttended = studentRecords.filter(r =>
        r.status === 'Present' || r.status === 'Late'
      ).length;

      const percentage = totalClassDays > 0
        ? ((daysAttended / totalClassDays) * 100).toFixed(2) + '%'
        : '0%';

      excelData.push([
        student.full_name,
        totalClassDays,
        daysAttended,
        percentage
      ]);
    }

    // Create workbook and worksheet
    const wb = new Workbook();
    const ws = wb.addWorksheet('Attendance Report');

    // Set column widths
    ws.columns = [
      { width: 30 }, // Student Name
      { width: 15 }, // Days Conducted
      { width: 15 }, // Days Attended
      { width: 12 }  // Percentage
    ];

    // Add rows from excelData array
    for (const row of excelData) {
      ws.addRow(row);
    }

    // Generate filename
    const filename = `Attendance_Report_${this.selectedMonth}.xlsx`;

    // Save file via browser download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Export Successful',
      text: `Report exported as ${filename}`,
      timer: 2000,
      showConfirmButton: false
    });
  }
}
