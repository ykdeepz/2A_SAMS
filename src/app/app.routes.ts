
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  // Instructor routes
  {
    path: 'instructor/dashboard',
    loadComponent: () => import('./features/instructor/dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent),
    canActivate: [authGuard],
    data: { role: 'instructor' }
  },
  {
    path: 'instructor/subjects',
    loadComponent: () => import('./features/instructor/pages/subjects-list/subjects-list.component').then(m => m.SubjectsListComponent),
    canActivate: [authGuard],
    data: { role: 'instructor' }
  },
  {
    path: 'instructor/subject/:id',
    loadComponent: () => import('./features/instructor/pages/subject-detail/subject-detail.component').then(m => m.SubjectDetailComponent),
    canActivate: [authGuard],
    data: { role: 'instructor' }
  },
  {
    path: 'instructor/schedule',
    loadComponent: () => import('./features/instructor/pages/schedule/schedule.component').then(m => m.ScheduleComponent),
    canActivate: [authGuard],
    data: { role: 'instructor' }
  },
  {
    path: 'instructor/settings',
    loadComponent: () => import('./features/instructor/pages/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
    data: { role: 'instructor' }
  },
  // Student routes
  {
    path: 'student/dashboard',
    loadComponent: () => import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
    canActivate: [authGuard],
    data: { role: 'student' }
  },
  // Parent routes
  {
    path: 'parent/dashboard',
    loadComponent: () => import('./features/parent/dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent),
    canActivate: [authGuard],
    data: { role: 'parent' }
  },
  // Admin routes
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard],
    data: { role: 'admin' }
  },
  {
    path: 'logout',
    loadComponent: () => import('./features/auth/logout/logout.component').then(m => m.LogoutComponent)
  },
  // Default fallback
  { path: '**', redirectTo: 'login' }
];