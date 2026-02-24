import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, AuthToken, LoginRequest } from '../models';
import { MOCK_USERS } from './mock-data';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<AuthToken | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  token$ = this.tokenSubject.asObservable();
  isAuthenticated$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadTokenFromStorage();
  }

  login(request: LoginRequest): Observable<{ user: User; token: AuthToken }> {
    const user = MOCK_USERS.find(u => u.email === request.email && u.role === request.role);

    if (user && user.password === request.password) {
      const token: AuthToken = {
        token: 'mock-jwt-token-' + Date.now(),
        expiresIn: 3600,
      };

      this.currentUserSubject.next(user);
      this.tokenSubject.next(token);

      // Store in localStorage
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', JSON.stringify(token));

      return of({ user, token });
    }

    throw new Error('Invalid credentials');
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): AuthToken | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  private loadTokenFromStorage(): void {
    const user = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');

    if (user && token) {
      this.currentUserSubject.next(JSON.parse(user));
      this.tokenSubject.next(JSON.parse(token));
    }
  }
}
