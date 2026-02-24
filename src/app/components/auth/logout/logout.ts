import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  standalone: true,   // ← VERY IMPORTANT
  template: ''
})
export class Logout implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    localStorage.clear();
    sessionStorage.clear();

    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}