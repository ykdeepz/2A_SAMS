import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SubjectService } from '../../../core/services/subject.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { Student, Subject, AttendanceRecord } from '../../../core/models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css'],
})
export class StudentDashboardComponent implements OnInit {
  currentStudent: Student | null = null;
  subjects: Subject[] = [];
  attendance: AttendanceRecord[] = [];

  constructor(
    private authService: AuthService,
    private subjectService: SubjectService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.role === 'student') {
      this.currentStudent = {
        id: user.id,
        studentId: user.id.replace('student-', '2024-'),
        name: user.name,
        email: user.email,
        enrolledDate: '2024-08-15',
      };
      this.subjectService.getSubjectsByStudentId(this.currentStudent.id).subscribe(subjects => {
        this.subjects = subjects;
      });
      this.attendanceService.getAttendanceByStudent(this.currentStudent.id).subscribe(records => {
        this.attendance = records;
      });
    }
  }
}
