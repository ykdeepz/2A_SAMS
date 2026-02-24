// src/app/shared/components/sidebar/sidebar.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { User, UserRole } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() currentUser: User | null = null;
  @Output() logout = new EventEmitter<void>();

  isOpen = true;
  expandedMenu: string | null = null;

  menuItems: { [key in UserRole]?: MenuItem[] } = {
    instructor: [
      { label: 'Dashboard', icon: 'grid', route: '/instructor/dashboard' },
      { label: 'My Subjects', icon: 'book', route: '/instructor/subjects' },
      { label: 'Schedule', icon: 'calendar', route: '/instructor/schedule' },
      { label: 'Settings', icon: 'settings', route: '/instructor/settings' }
    ],
    student: [
      { label: 'Dashboard', icon: 'grid', route: '/student/dashboard' },
      { label: 'My Subjects', icon: 'book', route: '/student/subjects' },
      { label: 'Attendance', icon: 'check-circle', route: '/student/attendance' },
      { label: 'Grades', icon: 'award', route: '/student/grades' }
    ],
    parent: [
      { label: 'Dashboard', icon: 'grid', route: '/parent/dashboard' },
      { label: "Child's Attendance", icon: 'check-circle', route: '/parent/child-attendance' },
      { label: "Child's Grades", icon: 'award', route: '/parent/child-grades' }
    ],
    admin: [
      { label: 'Dashboard', icon: 'grid', route: '/admin/dashboard' },
      { label: 'Users', icon: 'users', route: '/admin/users' },
      { label: 'Subjects', icon: 'book', route: '/admin/subjects' },
      { label: 'Reports', icon: 'bar-chart-2', route: '/admin/reports' }
    ]
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get currentMenuItems(): MenuItem[] {
    return this.currentUser ? this.menuItems[this.currentUser.role] || [] : [];
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  toggleMenu(label: string): void {
    this.expandedMenu = this.expandedMenu === label ? null : label;
  }

  onLogout(): void {
    this.logout.emit();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getIcon(iconName: string): string {
    const icons: { [key: string]: string } = {
      grid: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V9h-8v12zm0-14V3h8v8h-8z',
      book: 'M4 6h16V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16v-2H4V6z',
      calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
      settings: 'M19.14,12.94c0.04,-0.3 0.06,-0.61 0.06,-0.94c0,-0.32 -0.02,-0.64 -0.07,-0.94l2.03,-1.58c0.18,-0.14 0.23,-0.41 0.12,-0.64l-1.92,-3.32c-0.12,-0.22 -0.37,-0.29 -0.59,-0.22l-2.39,0.96c-0.5,-0.38 -1.03,-0.7 -1.62,-0.94L14.4,2.81c-0.04,-0.24 -0.24,-0.41 -0.48,-0.41h-3.84c-0.24,0 -0.43,0.17 -0.47,0.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-0.22,-0.08 -0.47,0 -0.59,0.22L2.74,8.87C2.62,9.08 2.66,9.34 2.86,9.48l2.03,1.58C4.84,11.36 4.8,11.69 4.8,12s0.02,0.64 0.07,0.94l-2.03,1.58c-0.18,0.14 -0.23,0.41 -0.12,0.64l1.92,3.32c0.12,0.22 0.37,0.29 0.59,0.22l2.39,-0.96c0.5,0.38 1.03,0.7 1.62,0.94l0.36,2.54c0.05,0.24 0.24,0.41 0.48,0.41h3.84c0.24,0 0.44,-0.17 0.47,-0.41l0.36,-2.54c0.59,-0.24 1.13,-0.56 1.62,-0.94l2.39,0.96c0.22,0.08 0.47,0 0.59,-0.22l1.92,-3.32c0.12,-0.22 0.07,-0.5 -0.12,-0.64L19.14,12.94zM12,15.6c-1.98,0 -3.6,-1.62 -3.6,-3.6s1.62,-3.6 3.6,-3.6s3.6,1.62 3.6,3.6S13.98,15.6 12,15.6z',
      'check-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      award: 'M21 26H3V10c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v16zm-2-16h-7V3h7v7z',
      users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm8 0c1.66 0 2.99-1.34 2.99-3S25.66 5 24 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
      'bar-chart-2': 'M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-1h2v19h-2zm4 3h2v16h-2z'
    };
    return icons[iconName] || icons['grid'];
  }
}
