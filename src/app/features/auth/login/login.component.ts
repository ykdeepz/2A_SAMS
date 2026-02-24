// src/app/features/auth/login/login.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  selectedRole: UserRole = 'student';
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  rememberMe = false;

  roles: { label: string; value: UserRole }[] = [
    { label: 'Student', value: 'student' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Parent', value: 'parent' },
    { label: 'Admin', value: 'admin' }
  ];

  demoCredentials: { [key in UserRole]: { email: string; password: string } } = {
    student: { email: 'alice.johnson@university.edu', password: 'student123' },
    instructor: { email: 'sarah.wilson@university.edu', password: 'instructor123' },
    parent: { email: 'parent1@email.com', password: 'parent123' },
    admin: { email: 'admin@university.edu', password: 'admin123' }
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSavedEmail();
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  loadSavedEmail(): void {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({ email: savedEmail, rememberMe: true });
      this.rememberMe = true;
    }
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fillDemoCredentials(): void {
    const credentials = this.demoCredentials[this.selectedRole];
    this.loginForm.patchValue({
      email: credentials.email,
      password: credentials.password
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password, rememberMe } = this.loginForm.value;

    // Save email if remember me is checked
    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    this.authService.login({
      email,
      password,
      role: this.selectedRole
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.redirectBasedOnRole(response.user.role);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Login failed. Please try again.';
      }
    });
  }

  private redirectBasedOnRole(role: UserRole): void {
    const routeMap: { [key in UserRole]: string } = {
      student: '/student/dashboard',
      instructor: '/instructor/dashboard',
      parent: '/parent/dashboard',
      admin: '/admin/dashboard'
    };

    this.router.navigate([routeMap[role]]);
  }

  navigateToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
