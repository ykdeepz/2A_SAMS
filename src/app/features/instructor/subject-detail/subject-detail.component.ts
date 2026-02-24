import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Student, AttendanceRecord } from '../../../core/models';
import { SubjectService } from '../../../core/services/subject.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { StudentService } from '../../../core/services/student.service';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.css'],
})
export class SubjectDetailComponent implements OnInit {
  @Input() subjectId!: string;
  subject: Subject | null = null;
  students: Student[] = [];
  attendance: AttendanceRecord[] = [];
  selectedTab: 'students' | 'attendance' | 'overview' = 'students';
  selectedDate: string = new Date().toISOString().substring(0, 10);

  constructor(
    private subjectService: SubjectService,
    private attendanceService: AttendanceService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.subjectService.getSubjectById(this.subjectId).subscribe(subject => {
      this.subject = subject || null;
      if (subject) {
        this.loadStudents(subject.enrolledStudents);
        this.loadAttendance();
      }
    });
  }

  getStudentById(id: string): Student | undefined {
    return this.students.find(s => s.id === id);
  }

  loadStudents(studentIds: string[]): void {
    this.students = [];
    studentIds.forEach(id => {
      this.studentService.getStudentById(id).subscribe(student => {
        if (student) this.students.push(student);
      });
    });
  }

  loadAttendance(): void {
    if (!this.subject) return;
    this.attendanceService.getAttendanceBySubject(this.subject.id, new Date(this.selectedDate)).subscribe(records => {
      this.attendance = records;
    });
  }

  onTabChange(tab: 'students' | 'attendance' | 'overview'): void {
    this.selectedTab = tab;
    if (tab === 'attendance') this.loadAttendance();
  }

  onDateChange(date: string): void {
    this.selectedDate = date;
    this.loadAttendance();
  }
}
