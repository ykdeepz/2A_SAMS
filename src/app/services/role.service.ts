import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private authService = inject(AuthService);
  
  currentRole = computed(() => this.authService.currentUser()?.role);
  
  isAdmin = computed(() => this.currentRole() === 'admin');
  isInstructor = computed(() => this.currentRole() === 'instructor');
  isStudent = computed(() => this.currentRole() === 'student');
  isParent = computed(() => this.currentRole() === 'parent');
  
  canManageAllSubjects = computed(() => this.isAdmin());
  canManageOwnSubjects = computed(() => this.isAdmin() || this.isInstructor());
  canTakeAttendance = computed(() => this.isInstructor());
  canCreateAccounts = computed(() => this.isAdmin() || this.isInstructor());
  canViewReports = computed(() => this.isAdmin() || this.isInstructor());
  canViewAllData = computed(() => this.isAdmin());
  
  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
