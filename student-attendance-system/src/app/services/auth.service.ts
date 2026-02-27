import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  currentUser = signal<User | null>(null);
  
  constructor(private router: Router) {
    this.loadUser();
  }

  login(email: string, password: string): boolean {
    // Mock authentication
    const mockUsers: User[] = [
      { user_id: '1', email: 'admin@school.com', role: 'admin' },
      { user_id: '2', email: 'instructor@school.com', role: 'instructor' },
      { user_id: '3', email: 'student@school.com', role: 'student' },
      { user_id: '4', email: 'parent@school.com', role: 'parent' }
    ];

    const user = mockUsers.find(u => u.email === email);
    if (user) {
      this.currentUser.set(user);
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      this.redirectByRole(user.role);
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.router.navigate(['/login']);
  }

  private loadUser() {
    if (this.isBrowser) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        this.currentUser.set(JSON.parse(stored));
      }
    }
  }

  private redirectByRole(role: string) {
    switch(role) {
      case 'admin':
      case 'instructor':
        this.router.navigate(['/dashboard']);
        break;
      case 'student':
      case 'parent':
        this.router.navigate(['/attendance-records']);
        break;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }
}
