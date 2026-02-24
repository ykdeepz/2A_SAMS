// src/app/core/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser) {
    // Check if route requires specific role
    const requiredRole = route.data['role'];
    if (requiredRole && authService.currentUser.role !== requiredRole) {
      router.navigate(['/unauthorized']);
      return false;
    }
    return true;
  }

  // Not logged in, redirect to login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// Import inject for compatibility
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.currentUser) {
      const requiredRole = route.data['role'];
      if (requiredRole && this.authService.currentUser.role !== requiredRole) {
        this.router.navigate(['/unauthorized']);
        return false;
      }
      return true;
    }

    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
