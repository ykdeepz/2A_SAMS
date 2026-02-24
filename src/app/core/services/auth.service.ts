// src/app/core/services/auth.service.ts

import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, AuthResponse, LoginRequest, SignUpRequest } from '../models/user.model';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  public isAuthenticated$ = this.currentUser$.pipe(
    map(user => !!user)
  );

  private tokenSubject = new BehaviorSubject<string | null>(this.loadTokenFromStorage());

  constructor(private mockDataService: MockDataService) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    // Simulate API call with delay
    return of(null).pipe(
      delay(800),
      map(() => {
        const user = this.mockDataService.getUserByEmail(loginRequest.email);

        if (!user) {
          throw new Error('User not found');
        }

        if (user.password !== loginRequest.password) {
          throw new Error('Invalid password');
        }

        if (user.role !== loginRequest.role) {
          throw new Error(`User role does not match. Expected ${user.role}`);
        }

        const response: AuthResponse = {
          user: { ...user, password: '' }, // Don't send password back
          token: this.generateMockToken(user.id)
        };

        // Store user and token
        this.saveUserToStorage(response.user);
        this.saveTokenToStorage(response.token);
        this.currentUserSubject.next(response.user);
        this.tokenSubject.next(response.token);

        return response;
      })
    );
  }

  signup(signupRequest: SignUpRequest): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        const existingUser = this.mockDataService.getUserByEmail(signupRequest.email);

        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        if (signupRequest.password !== signupRequest.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (signupRequest.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Create new user
        const newUser: User = {
          id: `${signupRequest.role}-${Date.now()}`,
          email: signupRequest.email,
          password: signupRequest.password,
          name: signupRequest.name,
          role: signupRequest.role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${signupRequest.name}`,
          department: signupRequest.department,
          enrolledDate: new Date()
        };

        // In a real app, this would save to database
        // For now, we just simulate it
        const response: AuthResponse = {
          user: { ...newUser, password: '' },
          token: this.generateMockToken(newUser.id)
        };

        // Store user and token
        this.saveUserToStorage(response.user);
        this.saveTokenToStorage(response.token);
        this.currentUserSubject.next(response.user);
        this.tokenSubject.next(response.token);

        return response;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  private generateMockToken(userId: string): string {
    return `mock_token_${userId}_${Date.now()}`;
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private loadUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  private saveTokenToStorage(token: string): void {
    localStorage.setItem('authToken', token);
  }

  private loadTokenFromStorage(): string | null {
    return localStorage.getItem('authToken');
  }
}
