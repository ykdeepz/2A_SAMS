import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  currentUser = signal<User | null>(null);

  constructor(private router: Router) { this.loadUser(); }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs.map(d => ({ ...d.data(), _docId: d.id }) as any);
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        const { password: _, ...withoutPassword } = user;
        this.currentUser.set(withoutPassword as User);
        if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(withoutPassword));
        this.router.navigate(['/dashboard']);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  logout() {
    this.currentUser.set(null);
    if (this.isBrowser) localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  private loadUser() {
    if (this.isBrowser) {
      const stored = localStorage.getItem('currentUser');
      if (stored) this.currentUser.set(JSON.parse(stored));
    }
  }

  isAuthenticated(): boolean { return this.currentUser() !== null; }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }
}
