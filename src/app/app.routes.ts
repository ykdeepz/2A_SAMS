import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SubjectsComponent } from './pages/subjects/subjects.component';
import { SubjectDetailComponent } from './pages/subject-detail/subject-detail.component';
import { TakeAttendanceComponent } from './pages/take-attendance/take-attendance.component';
import { AttendanceRecordsComponent } from './pages/attendance-records/attendance-records.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { CreateAccountComponent } from './pages/create-account/create-account.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard(['admin', 'instructor'])] },
      { path: 'subjects', component: SubjectsComponent },
      { path: 'subject/:id', component: SubjectDetailComponent, data: { renderMode: 'client' } },
      { path: 'take-attendance', component: TakeAttendanceComponent, canActivate: [roleGuard(['instructor'])] },
      { path: 'attendance-records', component: AttendanceRecordsComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'create-account', component: CreateAccountComponent, canActivate: [roleGuard(['admin'])] },
      { path: 'reports', component: ReportsComponent, canActivate: [roleGuard(['admin', 'instructor'])] },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
