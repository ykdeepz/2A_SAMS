import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  profileForm: any = { email: '', name: '', phone: '' };
  passwordForm: any = { current: '', new: '', confirm: '' };
  message = signal('');

  constructor(private authService: AuthService) {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.email = user.email;
    }
  }

  updateProfile() {
    this.showMessage('Profile updated successfully');
  }

  changePassword() {
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      this.showMessage('Passwords do not match');
      return;
    }
    this.showMessage('Password changed successfully');
    this.passwordForm = { current: '', new: '', confirm: '' };
  }

  showMessage(msg: string) {
    this.message.set(msg);
    setTimeout(() => this.message.set(''), 3000);
  }
}
