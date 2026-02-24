import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin {
  constructor(private router: Router) {}

  logout(): void {
    try { localStorage.removeItem('sams_current_user_v1'); } catch (e) {}
    this.router.navigate(['/login']);
  }

}
