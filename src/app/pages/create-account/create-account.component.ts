import { Component, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RoleService } from '../../services/role.service';
import { InstructorFormComponent } from './instructor-form/instructor-form.component';
import { StudentFormComponent, StudentFormData } from './student-form/student-form.component';
import { Instructor, Parent, Student, RegistrationRequest } from '../../models/user.model';
import { LucideAngularModule, CheckCircle2, AlertCircle, X, UserCircle, GraduationCap, Clock, Check, XCircle } from 'lucide-angular';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase.config';
import Swal from 'sweetalert2';

function generateUniqueId(prefix: string) {
  return prefix + Date.now() + Math.floor(Math.random() * 10000);
}

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [CommonModule, InstructorFormComponent, StudentFormComponent, LucideAngularModule],
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent {
  @ViewChild(InstructorFormComponent) instructorForm?: InstructorFormComponent;
  @ViewChild(StudentFormComponent) studentForm?: StudentFormComponent;

  private dataService = inject(DataService);
  private roleService = inject(RoleService);

  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly X = X;
  readonly UserCircle = UserCircle;
  readonly GraduationCap = GraduationCap;
  readonly Clock = Clock;
  readonly Check = Check;
  readonly XCircle = XCircle;

  activeTab = signal<'instructor' | 'student' | 'pending'>('instructor');

  canCreateInstructor = this.roleService.isAdmin;
  canCreateStudent = this.roleService.canCreateAccounts;

  pendingRequests = computed(() =>
    this.dataService.registrationRequests().filter(r => r.status === 'pending')
  );

  constructor() {
    if (!this.canCreateInstructor() && this.canCreateStudent()) {
      this.activeTab.set('student');
    }
  }

  setActiveTab(tab: 'instructor' | 'student' | 'pending') {
    this.activeTab.set(tab);
  }

  // ── Approve a registration request ────────────────────────
  async approveRequest(req: RegistrationRequest) {
    const result = await Swal.fire({
      title: 'Approve Request?',
      html: `Create account for <strong>${req.full_name}</strong> (${req.type})?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      if (req.type === 'instructor') {
        await this.createInstructorFromRequest(req);
      } else {
        await this.createStudentFromRequest(req);
      }

      const updated: RegistrationRequest = { ...req, status: 'approved', reviewed_at: new Date().toISOString() };
      await this.dataService.updateRegistrationRequest(updated);

      await Swal.fire({
        title: 'Approved!',
        text: `Account created for ${req.full_name}.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to approve request.',
        icon: 'error'
      });
    }
  }

  // ── Deny a registration request ────────────────────────────
  async denyRequest(req: RegistrationRequest) {
    const result = await Swal.fire({
      title: 'Deny Request?',
      html: `Deny account request from <strong>${req.full_name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, deny',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const updated: RegistrationRequest = { ...req, status: 'denied', reviewed_at: new Date().toISOString() };
      await this.dataService.updateRegistrationRequest(updated);

      await Swal.fire({
        title: 'Request Denied',
        text: `The request from ${req.full_name} has been denied.`,
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({ title: 'Error!', text: 'Failed to deny request.', icon: 'error' });
    }
  }

  // ── Internal: create instructor account from request ───────
  private async createInstructorFromRequest(req: RegistrationRequest) {
    const emailExists = this.dataService.users().some(u => u.email === req.email);
    if (emailExists) throw new Error(`Email ${req.email} already exists.`);

    // Create Firebase Auth account (default password: instructor123)
    const credential = await createUserWithEmailAndPassword(auth, req.email, 'instructor123');
    const userId = credential.user.uid;

    // Store profile in Firestore — no password field
    await this.dataService.addUser({
      user_id: userId,
      email: req.email,
      role: 'instructor' as const,
      first_name: req.first_name,
      middle_name: req.middle_name,
      last_name: req.last_name,
      full_name: req.full_name,
      created_at: new Date().toISOString()
    });
    await this.dataService.addInstructor({
      instructor_id: req.instructor_id || generateUniqueId('INST'),
      first_name: req.first_name,
      middle_name: req.middle_name,
      last_name: req.last_name,
      full_name: req.full_name,
      email: req.email,
      phone: req.phone || '',
      department: req.department || '',
      user_id: userId,
      created_at: new Date().toISOString()
    });
  }

  // ── Internal: create student + parent accounts from request ─
  private async createStudentFromRequest(req: RegistrationRequest) {
    const emailExists = this.dataService.users().some(u => u.email === req.email);
    if (emailExists) throw new Error(`Email ${req.email} already exists.`);
    if (req.parent_email) {
      const parentEmailExists = this.dataService.users().some(u => u.email === req.parent_email);
      if (parentEmailExists) throw new Error(`Parent email ${req.parent_email} already exists.`);
    }

    // Create student Firebase Auth account
    const stuCredential = await createUserWithEmailAndPassword(auth, req.email, 'student123');
    const studentUserId = stuCredential.user.uid;

    await this.dataService.addUser({
      user_id: studentUserId,
      email: req.email,
      role: 'student' as const,
      first_name: req.first_name,
      middle_name: req.middle_name,
      last_name: req.last_name,
      full_name: req.full_name,
      created_at: new Date().toISOString()
    });

    const studentId = req.student_id || generateUniqueId('STU');
    await this.dataService.addStudent({
      student_id: studentId,
      first_name: req.first_name,
      middle_name: req.middle_name,
      last_name: req.last_name,
      full_name: req.full_name,
      email: req.email,
      grade_level: req.grade_level || '',
      section: req.section || '',
      qr_code_data: `STUDENT-${studentId}`,
      instructor_id: 'ADMIN-CREATED',
      user_id: studentUserId,
      created_at: new Date().toISOString()
    } as Student);

    if (req.parent_email) {
      // Create parent Firebase Auth account
      const parentCredential = await createUserWithEmailAndPassword(auth, req.parent_email, 'parent123');
      const parentUserId = parentCredential.user.uid;

      await this.dataService.addUser({
        user_id: parentUserId,
        email: req.parent_email,
        role: 'parent' as const,
        first_name: req.parent_first_name || '',
        middle_name: req.parent_middle_name,
        last_name: req.parent_last_name || '',
        full_name: req.parent_full_name || '',
        created_at: new Date().toISOString()
      });

      await this.dataService.addParent({
        parent_id: 'P' + Date.now(),
        first_name: req.parent_first_name || '',
        middle_name: req.parent_middle_name,
        last_name: req.parent_last_name || '',
        full_name: req.parent_full_name || '',
        email: req.parent_email,
        phone: req.parent_phone || '',
        student_id: studentId,
        user_id: parentUserId,
        created_at: new Date().toISOString()
      } as Parent);
    }
  }

  // ── Direct creation (existing flow) ───────────────────────
  async onInstructorSubmit(instructor: Instructor) {
    try {
      const emailExists = this.dataService.users().some(u => u.email === instructor.email);
      if (emailExists) {
        await Swal.fire({ title: 'Email already exists', text: 'An account with this email already exists.', icon: 'error' });
        return;
      }

      // Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, instructor.email, 'instructor123');
      const userId = credential.user.uid;

      // Store profile without password
      await this.dataService.addUser({
        user_id: userId,
        email: instructor.email,
        role: 'instructor' as const,
        first_name: instructor.first_name,
        middle_name: instructor.middle_name,
        last_name: instructor.last_name,
        full_name: instructor.full_name,
        created_at: new Date().toISOString()
      });
      await this.dataService.addInstructor({ ...instructor, user_id: userId, created_at: new Date().toISOString() });

      await Swal.fire({
        title: 'Success!',
        html: `Instructor account created!<br><strong>Email:</strong> ${instructor.email}<br><strong>Default password:</strong> instructor123`,
        icon: 'success', timer: 2500, showConfirmButton: false
      });

      this.instructorForm?.resetForm();
    } catch (error) {
      await Swal.fire({ title: 'Error!', text: error instanceof Error ? error.message : 'Failed to create instructor account.', icon: 'error' });
    }
  }

  async onStudentSubmit(data: StudentFormData) {
    try {
      const existingEmails = this.dataService.users().map(u => u.email);
      if (existingEmails.includes(data.student.email)) {
        await Swal.fire({ title: 'Email already exists', text: `Student email "${data.student.email}" is already in use.`, icon: 'error' });
        return;
      }
      if (existingEmails.includes(data.parent.email)) {
        await Swal.fire({ title: 'Email already exists', text: `Parent email "${data.parent.email}" is already in use.`, icon: 'error' });
        return;
      }

      // Create student Firebase Auth account
      const stuCredential = await createUserWithEmailAndPassword(auth, data.student.email, 'student123');
      const studentUserId = stuCredential.user.uid;

      const studentUser: any = {
        user_id: studentUserId,
        email: data.student.email,
        role: 'student' as const,
        first_name: data.student.first_name,
        last_name: data.student.last_name,
        full_name: data.student.full_name,
        created_at: new Date().toISOString()
      };
      if (data.student.middle_name) studentUser.middle_name = data.student.middle_name;

      await this.dataService.addUser(studentUser);
      await this.dataService.addStudent({ ...data.student, user_id: studentUserId, created_at: new Date().toISOString() } as any);

      // Create parent Firebase Auth account
      const parentCredential = await createUserWithEmailAndPassword(auth, data.parent.email, 'parent123');
      const parentUserId = parentCredential.user.uid;

      const parentUser: any = {
        user_id: parentUserId,
        email: data.parent.email,
        role: 'parent' as const,
        first_name: data.parent.first_name,
        last_name: data.parent.last_name,
        full_name: data.parent.full_name,
        created_at: new Date().toISOString()
      };
      if (data.parent.middle_name) parentUser.middle_name = data.parent.middle_name;

      await this.dataService.addUser(parentUser);
      await this.dataService.addParent({ ...data.parent, user_id: parentUserId, created_at: new Date().toISOString() } as any);

      await Swal.fire({
        title: 'Success!',
        html: `Student & parent accounts created!<br><strong>Student:</strong> ${data.student.email}<br><strong>Parent:</strong> ${data.parent.email}<br><strong>Default passwords:</strong> student123 / parent123`,
        icon: 'success', timer: 3000, showConfirmButton: false
      });

      this.studentForm?.resetForm();
    } catch (error) {
      await Swal.fire({ title: 'Error!', text: error instanceof Error ? error.message : 'Failed to create student account.', icon: 'error' });
    }
  }
}
