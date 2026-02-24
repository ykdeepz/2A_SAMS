import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService } from '../../../core/services/student.service';
import { SubjectService } from '../../../core/services/subject.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { Student, Subject, AttendanceRecord } from '../../../core/models';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.css'],
})
export class ParentDashboardComponent implements OnInit {
  child: Student | null = null;
  subjects: Subject[] = [];
  attendance: AttendanceRecord[] = [];

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private subjectService: SubjectService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.role === 'parent') {
      // For demo, parent1 is for Alice Johnson, parent2 for Bob Smith
      const childId = user.email === 'parent1@email.com' ? 'student-001' : 'student-002';
      this.studentService.getStudentById(childId).subscribe(child => {
        this.child = child || null;
        if (child) {
          this.subjectService.getSubjectsByStudentId(child.id).subscribe(subjects => {
            this.subjects = subjects;
          });
          this.attendanceService.getAttendanceByStudent(child.id).subscribe(records => {
            this.attendance = records;
          });
        }
      });
    }
  }

  getSubjectById(id: string): Subject | undefined {
    return this.subjects.find(s => s.id === id);
  }
}
