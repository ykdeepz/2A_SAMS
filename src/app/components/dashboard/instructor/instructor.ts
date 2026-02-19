import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-instructor',
  standalone: true,
  imports: [],
  templateUrl: './instructor.html',
  styleUrls: ['./instructor.css'],
})
export class Instructor {
  constructor(private router: Router) {}

  logout(): void {
    try { localStorage.removeItem('sams_current_user_v1'); } catch (e) {}
    this.router.navigate(['/login']);
  }

}
