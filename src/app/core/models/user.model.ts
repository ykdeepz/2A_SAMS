// src/app/core/models/user.model.ts

export type UserRole = 'instructor' | 'student' | 'parent' | 'admin';
export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  enrolledDate?: Date;
  studentId?: string;
  childId?: string;
  childName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
  department?: string;
}
