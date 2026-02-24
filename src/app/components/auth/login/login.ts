import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../services/data.service';

type UserRole = 'instructor' | 'student' | 'parent' | 'admin';

interface SignInData {
  id: string;
  password: string;
}

interface InstructorSignUpData extends SignInData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  department: string;
  confirmPassword: string;
}

interface StudentSignUpData extends SignInData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  gradeLevel: string;
  section: string;
  address: string;
  confirmPassword: string;
}

interface ParentSignUpData extends SignInData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  confirmPassword: string;
}

type SignUpData = InstructorSignUpData | StudentSignUpData | ParentSignUpData;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute, private dataService: DataService) {}
  isSignUp = false;
  selectedRole: UserRole = 'instructor';
  message = '';
  messageColor = 'red';
  isForgotPasswordOpen = false;
  isHelpOpen = false;
  forgotPasswordRole: UserRole = 'instructor';
  forgotPasswordId = '';
  forgotPasswordEmail = '';
  forgotPasswordNewPassword = '';
  forgotPasswordConfirmPassword = '';

  roles: UserRole[] = ['instructor', 'student', 'parent', 'admin'];

  // Form field storage
  private formData: { [key in UserRole]: any } = {
    instructor: {
      id: '', firstName: '', middleName: '', lastName: '',
      email: '', department: '', password: '', confirmPassword: ''
    },
    student: {
      id: '', firstName: '', middleName: '', lastName: '',
      email: '', mobileNumber: '', gradeLevel: '', section: '',
      address: '',
      password: '', confirmPassword: ''
    },
    parent: {
      id: '', firstName: '', middleName: '', lastName: '',
      email: '', password: '', confirmPassword: ''
    },
    admin: {
      id: '', password: '', confirmPassword: ''
    }
  };

  private mockCredentials: { [key in UserRole]: { id: string; password: string } } = {
    instructor: { id: 'instructor@ustp.edu', password: '123456' },
    student: { id: '2024001', password: '123456' },
    parent: { id: 'parent@example.com', password: '123456' },
    admin: { id: 'admin@ustp.edu', password: 'admin123' }
  };

  private registeredCredentials: { [key in UserRole]: Array<{ id: string; password: string }> } = {
    instructor: [],
    student: [],
    parent: [],
    admin: []
  };

  private readonly STORAGE_KEY = 'sams_registered_credentials_v1';

  private signInData: { [key in UserRole]: SignInData } = {
    instructor: { id: '', password: '' },
    student: { id: '', password: '' },
    parent: { id: '', password: '' },
    admin: { id: '', password: '' }
  };

  get currentData(): any {
    return this.formData[this.selectedRole];
  }

  get idLabel(): string {
    return `${this.capitalize(this.selectedRole)} Email`;
  }

  get idPlaceholder(): string {
    return `${this.selectedRole}@ustp.edu`;
  }

  get demoCredentials(): string {
    const cred = this.mockCredentials[this.selectedRole];
    return `Demo: ${cred.id} / ${cred.password}`;
  }

  get signInCurrentData(): SignInData {
    return this.signInData[this.selectedRole];
  }

  get displayRoles(): UserRole[] {
    return this.isSignUp ? ['instructor', 'student', 'parent'] : this.roles;
  }

  isInstructor(): boolean {
    return this.selectedRole === 'instructor';
  }

  isStudent(): boolean {
    return this.selectedRole === 'student';
  }
  isParent(): boolean {
    return this.selectedRole === 'parent';
  }

  get forgotPasswordLabel(): string {
    return `${this.capitalize(this.forgotPasswordRole)} Email`;
  }

  get forgotPasswordPlaceholder(): string {
    return `${this.forgotPasswordRole}@ustp.edu`;
  }

  openForgotPassword(): void {
    this.isForgotPasswordOpen = true;
    this.forgotPasswordRole = this.selectedRole;
    this.clearForgotPasswordForm();
    this.clearMessage();
  }

  closeForgotPassword(): void {
    this.isForgotPasswordOpen = false;
    this.clearForgotPasswordForm();
  }

  openHelp(): void {
    this.isHelpOpen = true;
  }

  closeHelp(): void {
    this.isHelpOpen = false;
  }

  handleForgotPassword(): void {
    if (!this.forgotPasswordId) {
      this.setError('Please enter your ID.');
      return;
    }

    if (!this.forgotPasswordNewPassword || !this.forgotPasswordConfirmPassword) {
      this.setError('Please enter and confirm your new password.');
      return;
    }

    if (this.forgotPasswordNewPassword !== this.forgotPasswordConfirmPassword) {
      this.setError('Passwords do not match.');
      return;
    }

    if (this.forgotPasswordNewPassword.length < 6) {
      this.setError('Password must be at least 6 characters.');
      return;
    }

    // attempt to update stored credential
    const id = this.forgotPasswordId;
    const list = this.registeredCredentials[this.forgotPasswordRole];
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx].password = this.forgotPasswordNewPassword;
      this.saveRegisteredToStorage();
      this.setSuccess(`Password reset successfully for ${this.capitalize(this.forgotPasswordRole)}!`);
      this.closeForgotPassword();
      return;
    }

    // if not found in registered list, check if matches demo credential
    const mock = this.mockCredentials[this.forgotPasswordRole];
    if (mock && mock.id === id) {
      this.setError('Cannot reset demo account password. Please register a new account.');
      return;
    }

    this.setError('Account not found.');
  }

  private clearForgotPasswordForm(): void {
    this.forgotPasswordId = '';
    this.forgotPasswordEmail = '';
    this.forgotPasswordNewPassword = '';
    this.forgotPasswordConfirmPassword = '';
  }

  switchRole(role: UserRole): void {
    this.selectedRole = role;
  }

  toggleSignUp(): void {
    this.isSignUp = !this.isSignUp;
    this.clearMessage();
    this.clearForm();
  }

  onSubmit(): void {
    this.isSignUp ? this.handleSignUp() : this.handleLogin();
  }

  private handleLogin(): void {
    const data = this.signInCurrentData;
    if (!data.id || !data.password) {
      this.setError('Please fill in all fields.');
      return;
    }

    const registered = this.registeredCredentials[this.selectedRole].find(
      cred => cred.id === data.id && cred.password === data.password
    );

    const mockCred = this.mockCredentials[this.selectedRole];
    const isMockMatch = data.id === mockCred.id && data.password === mockCred.password;

    if (registered || isMockMatch) {
      this.setSuccess(`Login successful as ${this.capitalize(this.selectedRole)}!`);
      this.signInData[this.selectedRole] = { id: '', password: '' };
      // set current user session in localStorage
      try {
        const current = { role: this.selectedRole, id: data.id };
        localStorage.setItem('sams_current_user_v1', JSON.stringify(current));
        // Reload registered users in DataService to ensure new registrations are available
        this.dataService.reloadRegisteredUsers();
      } catch (e) {
        // ignore
      }
      // redirect to role-specific dashboard with a small delay
      setTimeout(() => {
        this.router.navigate(['/dashboard', this.selectedRole]);
      }, 500);
    } else {
      this.setError(`Invalid ${this.selectedRole} credentials.`);
    }
  }

  ngOnInit(): void {
    // Check if user is already logged in
    const currentUserSession = localStorage.getItem('sams_current_user_v1');
    if (currentUserSession) {
      try {
        const { role } = JSON.parse(currentUserSession);
        // Verify the session is still valid by checking DataService
        const user = this.dataService.getCurrentUser();
        if (user && user.role === role) {
          // User is still logged in, redirect to dashboard
          this.router.navigate(['/dashboard', role]);
          return;
        }
      } catch (e) {
        // Invalid session, continue to login
      }
    }

    // If route provides signUp data, open signup mode
    const signUpData = this.route.snapshot.data && this.route.snapshot.data['signUp'];
    this.isSignUp = !!signUpData;
    this.loadRegisteredFromStorage();
  }

  private handleSignUp(): void {
    if (this.selectedRole === 'admin') {
      this.setError('Admin signup is not allowed.');
      return;
    }
    const data = this.currentData;

    if (this.selectedRole === 'instructor') {
      if (!data.id || !data.firstName || !data.lastName || !data.email || 
          !data.department || !data.password || !data.confirmPassword) {
        this.setError('Please fill in all required fields.');
        return;
      }
    } else if (this.selectedRole === 'student') {
      if (!data.id || !data.firstName || !data.lastName || !data.email || 
          !data.mobileNumber || !data.gradeLevel || !data.section || 
          !data.address ||
          !data.password || !data.confirmPassword) {
        this.setError('Please fill in all required fields.');
        return;
      }
    } else if (this.selectedRole === 'parent') {
      if (!data.firstName || !data.middleName || !data.lastName || !data.email || 
          !data.password || !data.confirmPassword) {
        this.setError('Please fill in all required fields.');
        return;
      }
    }

    if (data.password !== data.confirmPassword) {
      this.setError('Passwords do not match.');
      return;
    }

    if (data.password.length < 6) {
      this.setError('Password must be at least 6 characters.');
      return;
    }

    const idToStore = this.selectedRole === 'student' ? data.id : (this.selectedRole === 'parent' ? data.email : (data.email || data.id));

    const credentialExists = this.registeredCredentials[this.selectedRole].some(
      cred => cred.id === idToStore
    );

    if (credentialExists) {
      this.setError(`This ${this.selectedRole} account already exists.`);
      return;
    }

    this.registeredCredentials[this.selectedRole].push({
      id: idToStore,
      password: data.password
    });

    // Store additional user details
    const userDetailsKey = `sams_user_details_${this.selectedRole}`;
    try {
      const existingDetails = JSON.parse(localStorage.getItem(userDetailsKey) || '{}');
      existingDetails[idToStore] = {
        email: data.email,
        name: `${data.firstName}${data.middleName ? ' ' + data.middleName : ''} ${data.lastName}`,
        ...(this.selectedRole === 'student' && { 
          studentId: data.id, 
          gradeLevel: data.gradeLevel, 
          section: data.section,
          location: {
            address: data.address
          }
        }),
        ...(this.selectedRole === 'instructor' && { department: data.department })
      };
      localStorage.setItem(userDetailsKey, JSON.stringify(existingDetails));
    } catch (e) {
      // ignore
    }

    // persist to localStorage
    this.saveRegisteredToStorage();
    
    // Reload registered users in DataService
    this.dataService.reloadRegisteredUsers();
    
    // Auto-login after successful registration
    try {
      const current = { role: this.selectedRole, id: idToStore };
      localStorage.setItem('sams_current_user_v1', JSON.stringify(current));
      this.setSuccess(`${this.capitalize(this.selectedRole)} account created successfully!`);
      // Redirect to dashboard
      setTimeout(() => {
        this.router.navigate(['/dashboard', this.selectedRole]);
      }, 500);
    } catch (e) {
      this.setSuccess(`${this.capitalize(this.selectedRole)} account created successfully! You can now sign in.`);
      this.isSignUp = false;
      this.clearForm();
    }
  }

  private saveRegisteredToStorage(): void {
    try {
      const payload = JSON.stringify(this.registeredCredentials);
      localStorage.setItem(this.STORAGE_KEY, payload);
    } catch (e) {
      // ignore storage errors
    }
  }

  private loadRegisteredFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // basic validation
      if (typeof parsed === 'object' && parsed !== null) {
        // ensure arrays exist for each role
        (['instructor','student','parent','admin'] as UserRole[]).forEach(role => {
          if (Array.isArray(parsed[role])) {
            this.registeredCredentials[role] = parsed[role];
          }
        });
      }
    } catch (e) {
      // ignore parse errors
    }
  }


  private setError(message: string): void {
    this.message = message;
    this.messageColor = 'red';
  }

  private setSuccess(message: string): void {
    this.message = message;
    this.messageColor = 'green';
  }

  private clearMessage(): void {
    this.message = '';
  }

  private clearForm(): void {
    if (this.selectedRole === 'instructor') {
      this.formData[this.selectedRole] = {
        id: '', firstName: '', middleName: '', lastName: '',
        email: '', department: '', password: '', confirmPassword: ''
      };
    } else if (this.selectedRole === 'student') {
      this.formData[this.selectedRole] = {
        id: '', firstName: '', middleName: '', lastName: '',
        email: '', mobileNumber: '', gradeLevel: '', section: '',
        password: '', confirmPassword: ''
      };
    } else if (this.selectedRole === 'parent') {
      this.formData[this.selectedRole] = {
        id: '', firstName: '', middleName: '', lastName: '',
        email: '', password: '', confirmPassword: ''
      };
    }
  }

  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
