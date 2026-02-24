import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [currentUser]="currentUser" (logout)="onLogout()"></app-sidebar>
      <div class="main-content"><div class="header"><h1>My Attendance</h1></div><div class="content"><p>Attendance records</p></div></div>
    </div>
  `,
  styles: [`.layout { display: flex; min-height: 100vh; background: #f7fafc; }.main-content { margin-left: 260px; flex: 1; }.header { background: white; padding: 30px; border-bottom: 1px solid #e2e8f0; }.content { padding: 30px; }`]
})
export class StudentAttendanceComponent {
  currentUser: User | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser = this.authService.currentUser;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
