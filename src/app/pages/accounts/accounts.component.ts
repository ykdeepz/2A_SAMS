import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { LucideAngularModule, UserCircle, Mail, Calendar, Shield, X, Edit2, Trash2 } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent {
  dataService = inject(DataService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  // Icons
  readonly UserCircle = UserCircle;
  readonly Mail = Mail;
  readonly Calendar = Calendar;
  readonly Shield = Shield;
  readonly X = X;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;

  selectedAccount = signal<User | null>(null);
  selectedInstructorDetails = signal<any>(null);
  showModal = signal(false);
  isEditing = signal(false);
  editForm = signal({
    full_name: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    role: 'instructor' as 'admin' | 'instructor' | 'student' | 'parent'
  });

  allAccounts = computed(() => {
    return this.dataService.users().filter(u => u.user_id !== '1'); // Exclude master admin
  });

  instructorAccounts = computed(() => {
    return this.allAccounts().filter(u => u.role === 'instructor');
  });

  studentAccounts = computed(() => {
    return this.allAccounts().filter(u => u.role === 'student');
  });

  parentAccounts = computed(() => {
    return this.allAccounts().filter(u => u.role === 'parent');
  });

  viewAccount(account: User) {
    this.selectedAccount.set(account);
    
    // Load instructor details if it's an instructor
    if (account.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === account.user_id);
      this.selectedInstructorDetails.set(instructor || null);
    } else {
      this.selectedInstructorDetails.set(null);
    }
    
    this.showModal.set(true);
    this.isEditing.set(false);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedAccount.set(null);
    this.selectedInstructorDetails.set(null);
    this.isEditing.set(false);
  }

  startEdit() {
    const account = this.selectedAccount();
    const instructorDetails = this.selectedInstructorDetails();
    
    if (account) {
      this.editForm.set({
        full_name: account.full_name,
        first_name: account.first_name,
        middle_name: account.middle_name || '',
        last_name: account.last_name,
        email: account.email,
        phone: instructorDetails?.phone || '',
        department: instructorDetails?.department || '',
        role: account.role
      });
      this.isEditing.set(true);
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  async saveEdit() {
    const account = this.selectedAccount();
    const instructorDetails = this.selectedInstructorDetails();
    if (!account) return;

    const form = this.editForm();
    
    // Generate full name from parts
    const fullName = form.middle_name 
      ? `${form.first_name} ${form.middle_name} ${form.last_name}`
      : `${form.first_name} ${form.last_name}`;
    
    const updatedUser: User = {
      ...account,
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      full_name: fullName,
      email: form.email,
      role: form.role
    };

    try {
      await this.dataService.updateUser(updatedUser);
      
      // Update instructor details if it's an instructor
      if (account.role === 'instructor' && instructorDetails) {
        const updatedInstructor = {
          ...instructorDetails,
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          full_name: fullName,
          email: form.email,
          phone: form.phone,
          department: form.department
        };
        await this.dataService.updateInstructor(updatedInstructor);
        this.selectedInstructorDetails.set(updatedInstructor);
      }
      
      this.selectedAccount.set(updatedUser);
      this.isEditing.set(false);
      
      await Swal.fire({
        title: 'Updated!',
        text: 'Account has been updated successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating account:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to update account. Please try again.',
        icon: 'error'
      });
    }
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      'admin': 'badge-admin',
      'instructor': 'badge-instructor',
      'student': 'badge-student',
      'parent': 'badge-parent'
    };
    return classes[role] || '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInstructorDepartment(userId: string): string {
    const instructor = this.dataService.instructors().find(i => i.user_id === userId);
    return instructor?.department || '';
  }

  async deleteAccount() {
    const account = this.selectedAccount();
    if (!account) return;

    // Confirm deletion
    const result = await Swal.fire({
      title: 'Delete Account?',
      html: `
        <p>Are you sure you want to delete <strong>${account.full_name}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
        ${account.role === 'instructor' ? '<p class="text-sm text-red-600 mt-2">⚠️ This will delete all subjects and unenroll students. Student and parent accounts will remain.</p>' : ''}
        ${account.role === 'student' ? '<p class="text-sm text-red-600 mt-2">⚠️ This will also delete the parent account and all attendance records.</p>' : ''}
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      // Perform cascading deletes based on role
      if (account.role === 'instructor') {
        await this.deleteInstructorCascade(account.user_id);
      } else if (account.role === 'student') {
        await this.deleteStudentCascade(account.user_id);
      } else if (account.role === 'parent') {
        await this.deleteParentCascade(account.user_id);
      }

      // Delete the user account
      await this.dataService.deleteUser(account.user_id);

      // Close modal and show success
      this.closeModal();
      
      await Swal.fire({
        title: 'Deleted!',
        text: 'Account has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // Reload data
      await this.dataService.loadAllData();
    } catch (error) {
      console.error('Error deleting account:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to delete account. Please try again.',
        icon: 'error'
      });
    }
  }

  private async deleteInstructorCascade(userId: string) {
    // Find instructor record
    const instructor = this.dataService.instructors().find(i => i.user_id === userId);
    if (!instructor) return;

    // Get all subjects for this instructor
    const instructorSubjects = this.dataService.subjects().filter(s => s.instructor_id === instructor.instructor_id);
    
    for (const subject of instructorSubjects) {
      // Get all enrollments for this subject
      const subjectEnrollments = this.dataService.enrollments().filter(e => e.subject_id === subject.subject_id);
      
      for (const enrollment of subjectEnrollments) {
        // Delete attendance records for this enrollment
        const attendanceRecords = this.dataService.attendance().filter(a => 
          a.student_id === enrollment.student_id && a.subject_id === subject.subject_id
        );
        for (const attendance of attendanceRecords) {
          try {
            await this.http.delete(`${this.apiUrl}/attendance/${attendance.attendance_id}`).toPromise();
          } catch (error) {
            console.error('Error deleting attendance:', error);
          }
        }
        
        // Delete enrollment
        await this.dataService.unenrollStudent(enrollment.enrollment_id);
      }
      
      // Delete subject (students and parents remain in the system)
      await this.dataService.deleteSubject(subject.subject_id);
    }
    
    // Delete instructor record
    await this.dataService.deleteInstructor(instructor.instructor_id);
  }

  private async deleteStudentCascade(userId: string) {
    // Find student record
    const student = this.dataService.students().find(s => s.user_id === userId);
    if (!student) return;

    // Delete all attendance records
    const attendanceRecords = this.dataService.attendance().filter(a => a.student_id === student.student_id);
    for (const attendance of attendanceRecords) {
      try {
        await this.http.delete(`${this.apiUrl}/attendance/${attendance.attendance_id}`).toPromise();
      } catch (error) {
        console.error('Error deleting attendance:', error);
      }
    }

    // Delete all enrollments
    const enrollments = this.dataService.enrollments().filter(e => e.student_id === student.student_id);
    for (const enrollment of enrollments) {
      await this.dataService.unenrollStudent(enrollment.enrollment_id);
    }

    // Find and delete parent if exists
    const parent = this.dataService.parents().find(p => p.student_id === student.student_id);
    if (parent) {
      await this.dataService.deleteParent(parent.parent_id);
      await this.dataService.deleteUser(parent.user_id);
    }

    // Delete student record
    await this.dataService.deleteStudent(student.student_id);
  }

  private async deleteParentCascade(userId: string) {
    // Find parent record
    const parent = this.dataService.parents().find(p => p.user_id === userId);
    if (!parent) return;

    // Just delete parent record (student remains)
    await this.dataService.deleteParent(parent.parent_id);
  }
}
