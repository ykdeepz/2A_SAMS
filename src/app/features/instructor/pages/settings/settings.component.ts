import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  editMode = false;
  showNotification = false;
  notificationMessage = '';
  
  profileForm = {
    email: '',
    name: ''
  };

  notificationSettings = {
    emailNotifications: true,
    attendanceReminders: true,
    classUpdates: true,
    systemAlerts: true
  };

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.email = this.currentUser.email;
      this.profileForm.name = this.currentUser.name;
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  saveProfile(): void {
    this.showNotification = true;
    this.notificationMessage = 'Profile updated successfully!';
    this.editMode = false;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }

  toggleNotification(setting: keyof typeof this.notificationSettings): void {
    this.notificationSettings[setting] = !this.notificationSettings[setting];
    this.showNotification = true;
    this.notificationMessage = 'Notification settings updated!';
    setTimeout(() => {
      this.showNotification = false;
    }, 2000);
  }

  resetPassword(): void {
    this.showNotification = true;
    this.notificationMessage = 'Password reset link sent to your email!';
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }

  exportData(): void {
    this.showNotification = true;
    this.notificationMessage = 'Your data export has started. Check your email for the download link.';
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }

  goBack(): void {
    this.location.back();
  }
}
