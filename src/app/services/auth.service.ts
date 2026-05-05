import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { doc, getDoc } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { db, auth } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  currentUser = signal<User | null>(null);

  constructor(private router: Router) {
    // Restore session from localStorage immediately (avoids flash on reload)
    if (this.isBrowser) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try { this.currentUser.set(JSON.parse(stored)); } catch {}
      }
    }

    // Keep in sync with Firebase Auth state
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Load the Firestore profile to get role, name, etc.
        const profile = await this.loadProfile(firebaseUser.uid);
        if (profile) {
          this.currentUser.set(profile);
          if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(profile));
        }
      } else {
        // Signed out
        this.currentUser.set(null);
        if (this.isBrowser) localStorage.removeItem('currentUser');
      }
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await this.loadProfile(credential.user.uid);
      if (!profile) {
        // Auth succeeded but no Firestore profile — sign back out
        await signOut(auth);
        return false;
      }
      this.currentUser.set(profile);
      if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(profile));
      this.router.navigate(['/dashboard']);
      return true;
    } catch (error: any) {
      // Firebase Auth error codes
      const code = error?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' ||
          code === 'auth/invalid-credential' || code === 'auth/invalid-email') {
        return false;
      }
      console.error('Login error:', error);
      return false;
    }
  }

  async logout() {
    await signOut(auth);
    this.currentUser.set(null);
    if (this.isBrowser) localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) return { success: false, error: 'Not authenticated' };

    try {
      // Re-authenticate first (Firebase requires this before sensitive operations)
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      return { success: true };
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return { success: false, error: 'Current password is incorrect' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'New password is too weak (min 6 characters)' };
      }
      return { success: false, error: 'Failed to change password' };
    }
  }

  // Load the Firestore user profile by Firebase Auth UID (document ID = UID)
  private async loadProfile(uid: string): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      return snap.data() as User;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  isAuthenticated(): boolean { return this.currentUser() !== null; }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }
}
