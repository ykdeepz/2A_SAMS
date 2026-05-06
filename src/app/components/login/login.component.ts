import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { RegistrationRequest } from '../../models/user.model';
import { LucideAngularModule, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeClosed, UserPlus, ArrowLeft } from 'lucide-angular';
import Swal from 'sweetalert2';

type SignupTab = 'instructor' | 'student';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private dataService = inject(DataService);

  // ── Icons ──────────────────────────────────────────────────
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly ArrowRight = ArrowRight;
  readonly Eye = Eye;
  readonly EyeClosed = EyeClosed;
  readonly UserPlus = UserPlus;
  readonly ArrowLeft = ArrowLeft;

  // ── Sign-in state ──────────────────────────────────────────
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  // ── View toggle ────────────────────────────────────────────
  view = signal<'login' | 'signup'>('login');
  signupTab = signal<SignupTab>('instructor');

  // ── Instructor signup form ─────────────────────────────────
  instForm = {
    instructor_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: ''
  };

  departments = computed(() => this.dataService.departments());

  // ── Student signup form ────────────────────────────────────
  stuForm = {
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    grade_level: '',
    section: ''
  };

  parentForm = {
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: ''
  };

  signupLoading = signal(false);
  signupError = signal('');

  // ── Sign-in ────────────────────────────────────────────────
  async onSubmit() {
    this.loading.set(true);
    this.error.set('');
    const success = await this.authService.login(this.email, this.password);
    if (!success) this.error.set('Invalid email or password');
    this.loading.set(false);
  }

  // ── Switch views ───────────────────────────────────────────
  showSignup() {
    this.signupError.set('');
    this.view.set('signup');
  }

  showLogin() {
    this.signupError.set('');
    this.view.set('login');
  }

  // ── Validation helpers ─────────────────────────────────────
  isInstructorFormValid(): boolean {
    return !!(
      this.instForm.instructor_id &&
      this.instForm.first_name &&
      this.instForm.last_name &&
      this.instForm.email &&
      this.instForm.phone &&
      this.instForm.department
    );
  }

  isStudentFormValid(): boolean {
    return !!(
      this.stuForm.student_id &&
      this.stuForm.first_name &&
      this.stuForm.last_name &&
      this.stuForm.email &&
      this.stuForm.grade_level &&
      this.stuForm.section &&
      this.parentForm.first_name &&
      this.parentForm.last_name &&
      this.parentForm.email &&
      this.parentForm.phone
    );
  }

  // ── Submit signup request ──────────────────────────────────
  async submitSignup() {
    this.signupError.set('');
    this.signupLoading.set(true);

    try {
      if (this.signupTab() === 'instructor') {
        if (!this.isInstructorFormValid()) {
          this.signupError.set('Please fill in all required fields.');
          this.signupLoading.set(false);
          return;
        }

        // Check for duplicate email in pending requests
        const existing = this.dataService.registrationRequests().find(
          r => r.email === this.instForm.email && r.status === 'pending'
        );
        if (existing) {
          this.signupError.set('A pending request with this email already exists.');
          this.signupLoading.set(false);
          return;
        }

        const fullName = [this.instForm.first_name, this.instForm.middle_name, this.instForm.last_name]
          .filter(n => n).join(' ');

        const req: RegistrationRequest = {
          request_id: 'REQ' + Date.now(),
          type: 'instructor',
          status: 'pending',
          submitted_at: new Date().toISOString(),
          instructor_id: this.instForm.instructor_id,
          first_name: this.instForm.first_name,
          middle_name: this.instForm.middle_name || undefined,
          last_name: this.instForm.last_name,
          full_name: fullName,
          email: this.instForm.email,
          phone: this.instForm.phone,
          department: this.instForm.department
        };

        await this.dataService.addRegistrationRequest(req);

      } else {
        if (!this.isStudentFormValid()) {
          this.signupError.set('Please fill in all required fields.');
          this.signupLoading.set(false);
          return;
        }

        const existing = this.dataService.registrationRequests().find(
          r => r.email === this.stuForm.email && r.status === 'pending'
        );
        if (existing) {
          this.signupError.set('A pending request with this email already exists.');
          this.signupLoading.set(false);
          return;
        }

        const stuFullName = [this.stuForm.first_name, this.stuForm.middle_name, this.stuForm.last_name]
          .filter(n => n).join(' ');
        const parentFullName = [this.parentForm.first_name, this.parentForm.middle_name, this.parentForm.last_name]
          .filter(n => n).join(' ');

        const req: RegistrationRequest = {
          request_id: 'REQ' + Date.now(),
          type: 'student',
          status: 'pending',
          submitted_at: new Date().toISOString(),
          student_id: this.stuForm.student_id,
          first_name: this.stuForm.first_name,
          middle_name: this.stuForm.middle_name || undefined,
          last_name: this.stuForm.last_name,
          full_name: stuFullName,
          email: this.stuForm.email,
          grade_level: this.stuForm.grade_level,
          section: this.stuForm.section,
          parent_first_name: this.parentForm.first_name,
          parent_middle_name: this.parentForm.middle_name || undefined,
          parent_last_name: this.parentForm.last_name,
          parent_full_name: parentFullName,
          parent_email: this.parentForm.email,
          parent_phone: this.parentForm.phone
        };

        await this.dataService.addRegistrationRequest(req);
      }

      await Swal.fire({
        title: 'Request Submitted!',
        text: 'Your registration request has been sent to the admin for review. You will be notified once approved.',
        icon: 'success',
        confirmButtonText: 'OK'
      });

      this.resetSignupForms();
      this.view.set('login');

    } catch (error) {
      this.signupError.set('Failed to submit request. Please try again.');
    } finally {
      this.signupLoading.set(false);
    }
  }

  private resetSignupForms() {
    this.instForm = { instructor_id: '', first_name: '', middle_name: '', last_name: '', email: '', phone: '', department: '' };
    this.stuForm = { student_id: '', first_name: '', middle_name: '', last_name: '', email: '', grade_level: '', section: '' };
    this.parentForm = { first_name: '', middle_name: '', last_name: '', email: '', phone: '' };
  }
}
