// src/app/features/instructor/subjects/subjects.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { SubjectService } from '../../../core/services/subject.service';
import { User } from '../../../core/models/user.model';
import { Subject } from '../../../core/models/subject.model';

@Component({
  selector: 'app-instructor-subjects',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.css'
})
export class InstructorSubjectsComponent implements OnInit {
  currentUser: User | null = null;
  subjects: Subject[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private subjectService: SubjectService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadSubjects();
  }

  loadSubjects(): void {
    this.subjectService.getSubjectsByInstructor(this.currentUser!.id)
      .subscribe(subjects => {
        this.subjects = subjects;
        this.isLoading = false;
      });
  }

  navigateToSubject(subjectId: string): void {
    this.router.navigate(['/instructor/subject', subjectId]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
