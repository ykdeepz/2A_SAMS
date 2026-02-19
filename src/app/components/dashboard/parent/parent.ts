import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [],
  templateUrl: './parent.html',
  styleUrls: ['./parent.css'],
})
export class Parent {
  constructor(private router: Router) {}

  logout(): void {
    try { localStorage.removeItem('sams_current_user_v1'); } catch (e) {}
    this.router.navigate(['/login']);
  }

}
