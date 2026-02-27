import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    setTimeout(() => {
      const success = this.authService.login(this.email, this.password);
      if (!success) {
        this.error.set('Invalid credentials');
      }
      this.loading.set(false);
    }, 500);
  }
}
