import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Subject } from '../../models/user.model';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.css']
})
export class SubjectsComponent {
  searchTerm = '';
  showCreateModal = signal(false);
  newSubject: any = {};

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {}

  canManage = () => {
    return this.authService.hasRole(['admin', 'instructor']);
  };

  filteredSubjects = () => {
    const subjects = this.dataService.subjects();
    if (!this.searchTerm) return subjects;
    return subjects.filter(s => 
      s.subject_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      s.subject_code.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  };

  getEnrolledCount(subjectId: string): number {
    return this.dataService.enrollments().filter(e => e.subject_id === subjectId).length;
  }

  createSubject() {
    const user = this.authService.currentUser();
    const instructor = this.dataService.instructors()[0];
    
    const subject: Subject = {
      subject_id: 'SUB' + Date.now(),
      subject_name: this.newSubject.subject_name,
      subject_code: this.newSubject.subject_code,
      instructor_id: instructor?.instructor_id || 'I001',
      instructor_name: instructor?.full_name || 'Instructor',
      grade_level: this.newSubject.grade_level,
      section: this.newSubject.section,
      schedule: this.newSubject.schedule
    };

    this.dataService.addSubject(subject);
    this.showCreateModal.set(false);
    this.newSubject = {};
  }

  deleteSubject(id: string) {
    if (confirm('Delete this subject?')) {
      this.dataService.deleteSubject(id);
    }
  }
}
