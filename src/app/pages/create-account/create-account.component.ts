import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Parent, Student, RegistrationRequest } from '../../models/user.model';
import { LucideAngularModule, CheckCircle2, Check, XCircle } from 'lucide-angular';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { secondaryAuth } from '../../firebase.config';
import { EmailService } from '../../services/email.service';
import Swal from 'sweetalert2';

function generateUniqueId(prefix: string) {
  return prefix + Date.now() + Math.floor(Math.random() * 10000);
}

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent {
  private dataService = inject(DataService);
  private emailService = inject(EmailService);

  private readonly loginUrl = window.location.origin + '/login';

  readonly CheckCircle2 = CheckCircle2;
  readonly Check = Check;
  readonly XCircle = XCircle;

  pendingRequests = computed(() =>
    this.dataService.registrationRequests().filter(r => r.status === 'pending')
  );

  // ── Approve ────────────────────────────────────────────────
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

      await this.dataService.updateRegistrationRequest({
        ...req, status: 'approved', reviewed_at: new Date().toISOString()
      });

      await Swal.fire({
        title: 'Approved!',
        text: `Account created for ${req.full_name}.`,
        icon: 'success', timer: 2000, showConfirmButton: false
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to approve request.';
      const friendlyMsg = msg.includes('email-already-in-use')
        ? 'This email already has a Firebase Auth account. Please delete it from Firebase Console → Authentication first, then try again.'
        : msg;
      await Swal.fire({ title: 'Error!', text: friendlyMsg, icon: 'error' });
    }
  }

  // ── Deny ───────────────────────────────────────────────────
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
      await this.dataService.updateRegistrationRequest({
        ...req, status: 'denied', reviewed_at: new Date().toISOString()
      });
      await Swal.fire({
        title: 'Request Denied',
        text: `The request from ${req.full_name} has been denied.`,
        icon: 'info', timer: 2000, showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({ title: 'Error!', text: 'Failed to deny request.', icon: 'error' });
    }
  }

  // ── Create instructor from request ─────────────────────────
  private async createInstructorFromRequest(req: RegistrationRequest) {
    const emailExists = this.dataService.users().some(u => u.email === req.email);
    if (emailExists) throw new Error(`Email ${req.email} already exists.`);

    let userId: string | null = null;
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, req.email, 'instructor123');
      userId = credential.user.uid;
      // Sign out of secondary app immediately — we only needed the UID
      await signOut(secondaryAuth);

      await this.dataService.addUser({
        user_id: userId, email: req.email, role: 'instructor' as const,
        first_name: req.first_name, middle_name: req.middle_name,
        last_name: req.last_name, full_name: req.full_name,
        created_at: new Date().toISOString()
      });
      await this.dataService.addInstructor({
        instructor_id: req.instructor_id || generateUniqueId('INST'),
        first_name: req.first_name, middle_name: req.middle_name,
        last_name: req.last_name, full_name: req.full_name,
        email: req.email, phone: req.phone || '',
        department: req.department || '', user_id: userId,
        created_at: new Date().toISOString()
      });

      // Send approval email with login credentials
      await this.emailService.sendApprovalEmail({
        to_email:  req.email,
        full_name: req.full_name,
        email:     req.email,
        password:  'instructor123',
        role:      'Instructor',
        login_url: this.loginUrl
      });
    } catch (error) {
      // Roll back the Firebase Auth account if Firestore writes failed
      if (userId && secondaryAuth.currentUser?.uid === userId) {
        try { await secondaryAuth.currentUser.delete(); } catch (e) {
          console.error('Failed to roll back Firebase Auth account:', e);
        }
      }
      await signOut(secondaryAuth).catch(() => {});
      throw error;
    }
  }

  // ── Create student + parent from request ───────────────────
  private async createStudentFromRequest(req: RegistrationRequest) {
    const emailExists = this.dataService.users().some(u => u.email === req.email);
    if (emailExists) throw new Error(`Email ${req.email} already exists.`);
    if (req.parent_email) {
      const parentEmailExists = this.dataService.users().some(u => u.email === req.parent_email);
      if (parentEmailExists) throw new Error(`Parent email ${req.parent_email} already exists.`);
    }

    let studentUserId: string | null = null;
    let parentUserId: string | null = null;

    try {
      const stuCredential = await createUserWithEmailAndPassword(secondaryAuth, req.email, 'student123');
      studentUserId = stuCredential.user.uid;
      // Sign out immediately so the secondary app is clean for the next call
      await signOut(secondaryAuth);

      await this.dataService.addUser({
        user_id: studentUserId, email: req.email, role: 'student' as const,
        first_name: req.first_name, middle_name: req.middle_name,
        last_name: req.last_name, full_name: req.full_name,
        created_at: new Date().toISOString()
      });

      const studentId = req.student_id || generateUniqueId('STU');
      await this.dataService.addStudent({
        student_id: studentId, first_name: req.first_name, middle_name: req.middle_name,
        last_name: req.last_name, full_name: req.full_name, email: req.email,
        grade_level: req.grade_level || '', section: req.section || '',
        qr_code_data: `STUDENT-${studentId}`, instructor_id: 'ADMIN-CREATED',
        user_id: studentUserId, created_at: new Date().toISOString()
      } as Student);

      // Send approval email to student
      await this.emailService.sendApprovalEmail({
        to_email:  req.email,
        full_name: req.full_name,
        email:     req.email,
        password:  'student123',
        role:      'Student',
        login_url: this.loginUrl
      });

      if (req.parent_email) {
        const parentCredential = await createUserWithEmailAndPassword(secondaryAuth, req.parent_email, 'parent123');
        parentUserId = parentCredential.user.uid;
        await signOut(secondaryAuth);

        await this.dataService.addUser({
          user_id: parentUserId, email: req.parent_email, role: 'parent' as const,
          first_name: req.parent_first_name || '', middle_name: req.parent_middle_name,
          last_name: req.parent_last_name || '', full_name: req.parent_full_name || '',
          created_at: new Date().toISOString()
        });
        await this.dataService.addParent({
          parent_id: 'P' + Date.now(), first_name: req.parent_first_name || '',
          middle_name: req.parent_middle_name, last_name: req.parent_last_name || '',
          full_name: req.parent_full_name || '', email: req.parent_email,
          phone: req.parent_phone || '', student_id: studentId,
          user_id: parentUserId, created_at: new Date().toISOString()
        } as Parent);

        // Send approval email to parent
        await this.emailService.sendApprovalEmail({
          to_email:  req.parent_email,
          full_name: req.parent_full_name || 'Parent/Guardian',
          email:     req.parent_email,
          password:  'parent123',
          role:      'Parent',
          login_url: this.loginUrl
        });
      }
    } catch (error) {
      // Roll back any Firebase Auth accounts created before the failure
      if (secondaryAuth.currentUser) {
        try { await secondaryAuth.currentUser.delete(); } catch (e) {
          console.error('Failed to roll back Auth account:', e);
        }
      }
      await signOut(secondaryAuth).catch(() => {});
      throw error;
    }
  }
}
