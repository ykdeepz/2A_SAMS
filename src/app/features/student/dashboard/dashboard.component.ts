import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { SubjectService } from '../../../core/services/subject.service';
import { User } from '../../../core/models/user.model';
import { Subject } from '../../../core/models/subject.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [currentUser]="currentUser" (logout)="onLogout()"></app-sidebar>
      <div class="main-content">
        <div class="header">
          <h1>Welcome, {{ currentUser?.name }}!</h1>
          <p>Student Dashboard</p>
        </div>
        <div class="content">
          <h2>My Subjects ({{ subjects.length }})</h2>
          <div class="subjects-list">
            <div *ngFor="let subject of subjects" class="subject-card">
              <h3>{{ subject.code }}</h3>
              <p>{{ subject.name }}</p>
              <p>{{ subject.schedule }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; background: #f7fafc; }
    .main-content { margin-left: 260px; flex: 1; }
    .header { background: white; padding: 30px; border-bottom: 1px solid #e2e8f0; }
    .header h1 { margin: 0; }
    .content { padding: 30px; }
    .subjects-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; }
    .subject-card { background: white; padding: 16px; border-radius: 8px; }
  `]
})
export class StudentDashboardComponent implements OnInit {
  currentUser: User | null = null;
  subjects: Subject[] = [];

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

    this.subjectService.getSubjectsByStudent(this.currentUser.id)
      .subscribe(subjects => {
        this.subjects = subjects;
      });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
