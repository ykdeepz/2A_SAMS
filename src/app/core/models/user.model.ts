export type UserRole = 'instructor' | 'student' | 'parent' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  avatar?: string;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
  token: AuthToken;
}
