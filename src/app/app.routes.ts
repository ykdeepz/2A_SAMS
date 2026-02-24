import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { SignUpComponent } from './features/auth/signup/signup.component';
import { AuthGuardService } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignUpComponent
  },
  {
    path: 'instructor',
    canActivate: [AuthGuardService],
    data: { role: 'instructor' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/instructor/dashboard/dashboard.component').then(
            (m) => m.InstructorDashboardComponent
          )
      },
      {
        path: 'subjects',
        loadComponent: () =>
          import('./features/instructor/subjects/subjects.component').then(
            (m) => m.InstructorSubjectsComponent
          )
      },
      {
        path: 'subject/:id',
        loadComponent: () =>
          import('./features/instructor/subject-detail/subject-detail.component').then(
            (m) => m.SubjectDetailComponent
          )
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./features/instructor/schedule/schedule.component').then(
            (m) => m.ScheduleComponent
          )
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/instructor/settings/settings.component').then(
            (m) => m.SettingsComponent
          )
      }
    ]
  },
  {
    path: 'student',
    canActivate: [AuthGuardService],
    data: { role: 'student' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/dashboard/dashboard.component').then(
            (m) => m.StudentDashboardComponent
          )
      },
      {
        path: 'subjects',
        loadComponent: () =>
          import('./features/student/subjects/subjects.component').then(
            (m) => m.StudentSubjectsComponent
          )
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/student/attendance/attendance.component').then(
            (m) => m.StudentAttendanceComponent
          )
      },
      {
        path: 'grades',
        loadComponent: () =>
          import('./features/student/grades/grades.component').then(
            (m) => m.StudentGradesComponent
          )
      }
    ]
  },
  {
    path: 'parent',
    canActivate: [AuthGuardService],
    data: { role: 'parent' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/parent/dashboard/dashboard.component').then(
            (m) => m.ParentDashboardComponent
          )
      },
      {
        path: 'child-attendance',
        loadComponent: () =>
          import('./features/parent/child-attendance/child-attendance.component').then(
            (m) => m.ChildAttendanceComponent
          )
      },
      {
        path: 'child-grades',
        loadComponent: () =>
          import('./features/parent/child-grades/child-grades.component').then(
            (m) => m.ChildGradesComponent
          )
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [AuthGuardService],
    data: { role: 'admin' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then(
            (m) => m.AdminUsersComponent
          )
      },
      {
        path: 'subjects',
        loadComponent: () =>
          import('./features/admin/subjects/subjects.component').then(
            (m) => m.AdminSubjectsComponent
          )
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/reports.component').then(
            (m) => m.AdminReportsComponent
          )
      }
    ]
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
