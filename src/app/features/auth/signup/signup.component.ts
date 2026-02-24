// src/app/features/auth/signup/signup.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignUpComponent implements OnInit {
  signupForm!: FormGroup;
  selectedRole: UserRole = 'student';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  roles: { label: string; value: UserRole }[] = [
    { label: 'Student', value: 'student' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Parent', value: 'parent' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.signupForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        department: [''],
        agreeTerms: [false, [Validators.requiredTrue]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSignUp(): void {
    if (this.signupForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.signupForm.value;

    this.authService.signup({
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      role: this.selectedRole,
      department: this.selectedRole === 'instructor' ? formValue.department : undefined
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Redirecting...';
        setTimeout(() => {
          this.redirectBasedOnRole(response.user.role);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Sign up failed. Please try again.';
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

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
