import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [],
  templateUrl: './student.html',
  styleUrls: ['./student.css'],
})
export class Student {
  constructor(private router: Router) {}

  logout(): void {
    try { localStorage.removeItem('sams_current_user_v1'); } catch (e) {}
    this.router.navigate(['/login']);
  }

}
