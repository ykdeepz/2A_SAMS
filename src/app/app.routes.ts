import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{
		path: 'login',
		loadComponent: () => import('./components/auth/login/login').then(m => m.LoginComponent)
	},
	{
		path: 'signup',
		loadComponent: () => import('./components/auth/login/login').then(m => m.LoginComponent),
		data: { signUp: true }
	},
	{
		path: 'dashboard',
		children: [
			{ path: '', redirectTo: 'instructor', pathMatch: 'full' },
			{ path: 'admin', loadComponent: () => import('./components/dashboard/admin/admin').then(m => m.Admin) },
			{ path: 'instructor', loadComponent: () => import('./components/dashboard/instructor/instructor').then(m => m.Instructor) },
			{ path: 'parent', loadComponent: () => import('./components/dashboard/parent/parent').then(m => m.Parent) },
			{ path: 'student', loadComponent: () => import('./components/dashboard/student/student').then(m => m.Student) }
		]
	}
];
