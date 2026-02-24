import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [currentUser]="currentUser" (logout)="onLogout()"></app-sidebar>
      <div class="main-content">
        <div class="header"><h1>Subject Details</h1></div>
        <div class="content"><p>Subject ID: {{ subjectId }}</p></div>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; background: #f7fafc; }
    .main-content { margin-left: 260px; flex: 1; }
    .header { background: white; padding: 30px; border-bottom: 1px solid #e2e8f0; }
    .header h1 { margin: 0; }
    .content { padding: 30px; }
  `]
})
export class SubjectDetailComponent implements OnInit {
  currentUser: User | null = null;
  subjectId: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.subjectId = this.route.snapshot.paramMap.get('id');
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
