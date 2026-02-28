import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { SubjectEnrollment } from '../../models/user.model';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.css']
})
export class SubjectDetailComponent {
  subjectId = '';
  activeTab = signal('students');
  showEnrollModal = signal(false);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private dataService: DataService
  ) {
    this.subjectId = this.route.snapshot.paramMap.get('id') || '';
  }

  subject = computed(() => {
    return this.dataService.subjects().find(s => s.subject_id === this.subjectId);
  });

  enrollments = computed(() => {
    return this.dataService.enrollments().filter(e => e.subject_id === this.subjectId);
  });

  subjectAttendance = computed(() => {
    return this.dataService.attendance().filter(a => a.subject_id === this.subjectId);
  });

  availableStudents = computed(() => {
    const subject = this.subject();
    if (!subject) return [];
    
    const enrolledIds = this.enrollments().map(e => e.student_id);
    return this.dataService.students().filter(s => 
      !enrolledIds.includes(s.student_id) &&
      s.grade_level === subject.grade_level &&
      s.section === subject.section
    );
  });

  enrollStudent(student: any) {
    const subject = this.subject();
    if (!subject) return;

    const enrollment: SubjectEnrollment = {
      enrollment_id: 'E' + Date.now(),
      subject_id: this.subjectId,
      student_id: student.student_id,
      student_name: student.full_name,
      subject_name: subject.subject_name,
      enrolled_date: new Date()
    };

    this.dataService.enrollStudent(enrollment);
    this.showEnrollModal.set(false);
  }

  unenroll(enrollmentId: string) {
    if (confirm('Unenroll this student?')) {
      this.dataService.unenrollStudent(enrollmentId);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
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
