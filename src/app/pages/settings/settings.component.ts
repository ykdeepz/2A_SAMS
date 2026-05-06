import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { User } from '../../models/user.model';
import { ThemeService, THEMES, Theme } from '../../services/theme.service';
import { LucideAngularModule, Eye, EyeClosed } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private dataService = inject(DataService);
  themeService = inject(ThemeService);

  readonly themes = THEMES;

  profileForm: any = { email: '', name: '' };
  passwordForm: any = { current: '', new: '', confirm: '' };
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  readonly Eye = Eye;
  readonly EyeClosed = EyeClosed;
  showCurrent = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  constructor() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.email = user.email;
      this.profileForm.name = user.full_name;
    }
  }

  async updateProfile() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (!this.profileForm.email) {
      this.showMessage('Email is required', 'error');
      return;
    }

    try {
      const updated = await this.dataService.updateUser({
        ...user,
        email: this.profileForm.email,
        full_name: this.profileForm.name,
        first_name: user.first_name,
        last_name: user.last_name
      });
      this.authService.currentUser.set(updated as User);
      localStorage.setItem('currentUser', JSON.stringify(updated));
      this.showMessage('Profile updated successfully', 'success');
    } catch {
      this.showMessage('Failed to update profile', 'error');
    }
  }

  async changePassword() {
    if (!this.passwordForm.current || !this.passwordForm.new || !this.passwordForm.confirm) {
      this.showMessage('All fields are required', 'error');
      return;
    }
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      this.showMessage('New passwords do not match', 'error');
      return;
    }
    if (this.passwordForm.new.length < 6) {
      this.showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    const result = await this.authService.changePassword(
      this.passwordForm.current,
      this.passwordForm.new
    );

    if (result.success) {
      this.passwordForm = { current: '', new: '', confirm: '' };
      this.showMessage('Password changed successfully', 'success');
    } else {
      this.showMessage(result.error || 'Failed to change password', 'error');
    }
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message.set(msg);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }
}
