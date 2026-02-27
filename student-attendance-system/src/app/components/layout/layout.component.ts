import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  authService = inject(AuthService);
  router = inject(Router);
  
  sidebarCollapsed = signal(false);
  pageTitle = signal('Dashboard');
  currentUser = this.authService.currentUser;

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  menuItems = () => {
    const role = this.currentUser()?.role;
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'instructor'] },
      { path: '/subjects', label: 'Subjects', icon: '📚', roles: ['admin', 'instructor', 'student'] },
      { path: '/take-attendance', label: 'Take Attendance', icon: '✓', roles: ['instructor'] },
      { path: '/attendance-records', label: 'Attendance Records', icon: '📋', roles: ['admin', 'instructor', 'student', 'parent'] },
      { path: '/calendar', label: 'Calendar', icon: '📅', roles: ['admin', 'instructor', 'student', 'parent'] },
      { path: '/create-account', label: 'Create Account', icon: '👤', roles: ['admin'] },
      { path: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'instructor'] },
      { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin', 'instructor', 'student', 'parent'] }
    ];
    return items.filter(item => item.roles.includes(role || ''));
  };

  logout() {
    this.authService.logout();
  }
}
