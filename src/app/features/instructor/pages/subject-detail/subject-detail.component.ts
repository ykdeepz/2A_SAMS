import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { SubjectService } from '../../../../core/services/subject.service';
import { StudentService } from '../../../../core/services/student.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { Subject } from '../../../../core/models/subject.model';
import { Student } from '../../../../core/models/student.model';
import { AttendanceRecord } from '../../../../core/models/attendance.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.css']
})
export class SubjectDetailComponent implements OnInit {
  subject: Subject | null = null;
  students: Student[] = [];
  attendance: AttendanceRecord[] = [];
  currentTab: 'info' | 'students' | 'attendance' = 'info';

  constructor(
    private route: ActivatedRoute,
    private subjectService: SubjectService,
    private studentService: StudentService,
    private attendanceService: AttendanceService,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSubject(id);
      this.loadAttendance(id);
    }
  }

  loadSubject(id: string): void {
    this.subjectService.getSubjectById(id).subscribe(
      (subject: Subject | undefined) => {
        this.subject = subject || null;
        if (subject) {
          this.loadEnrolledStudents(subject.enrolledStudents);
        }
      },
      (error: any) => console.error('Error loading subject:', error)
    );
  }

  loadEnrolledStudents(studentIds: string[]): void {
    this.studentService.getAllStudents().subscribe(
      (allStudents: Student[]) => {
        this.students = allStudents.filter((s: Student) => studentIds.includes(s.id));
      },
      (error: any) => console.error('Error loading students:', error)
    );
  }

  loadAttendance(subjectId: string): void {
    this.attendanceService.getAttendanceBySubject(subjectId).subscribe(
      (records: AttendanceRecord[]) => {
        this.attendance = records.slice(0, 20);
      },
      (error: any) => console.error('Error loading attendance:', error)
    );
  }

  getStudentName(studentId: string): string {
    const student = this.students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  }

  setTab(tab: 'info' | 'students' | 'attendance'): void {
    this.currentTab = tab;
  }

  goBack(): void {
    this.location.back();
  }
}
