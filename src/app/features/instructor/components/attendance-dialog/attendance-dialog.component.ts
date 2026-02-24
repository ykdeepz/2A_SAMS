import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Student } from '../../../../core/models';
import { StudentService } from '../../../../core/services/student.service';
import { AttendanceService } from '../../../../core/services/attendance.service';

@Component({
  selector: 'app-attendance-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-dialog.component.html',
  styleUrls: ['./attendance-dialog.component.css'],
})
export class AttendanceDialogComponent implements OnInit {
  @Input() scannedStudentId!: string;
  @Input() subjects: Subject[] = [];
  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  student: Student | null = null;
  selectedSubjectId: string | null = null;
  status: 'present' | 'late' = 'present';
  notes: string = '';
  error: string | null = null;
  loading = true;

  constructor(private studentService: StudentService, private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.studentService.getStudentByStudentId(this.scannedStudentId).subscribe(student => {
      this.student = student || null;
      this.loading = false;
    });
  }

  submitAttendance(): void {
    if (!this.selectedSubjectId) {
      this.error = 'Please select a subject.';
      return;
    }
    if (!this.student) {
      this.error = 'Student not found.';
      return;
    }
    this.attendanceService.markAttendance({
      studentId: this.student.id,
      subjectId: this.selectedSubjectId,
      status: this.status,
      notes: this.notes
    }).subscribe(() => {
      this.submitted.emit();
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
