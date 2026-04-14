import { Component, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RoleService } from '../../services/role.service';
import { InstructorFormComponent } from './instructor-form/instructor-form.component';
import { StudentFormComponent, StudentFormData } from './student-form/student-form.component';
import { Instructor, Parent, Student } from '../../models/user.model';
import { LucideAngularModule, CheckCircle2, AlertCircle, X, UserCircle, GraduationCap } from 'lucide-angular';
import Swal from 'sweetalert2';

// Utility to generate unique IDs for users
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
  
  // Lucide icons
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly X = X;
  readonly UserCircle = UserCircle;
  readonly GraduationCap = GraduationCap;
  
  activeTab = signal<'instructor' | 'student'>('instructor');
  
  // Role permissions
  canCreateInstructor = this.roleService.isAdmin;
  canCreateStudent = this.roleService.canCreateAccounts;

  constructor() {
    // Set default tab based on role
    if (!this.canCreateInstructor() && this.canCreateStudent()) {
      this.activeTab.set('student');
    }
  }

  setActiveTab(tab: 'instructor' | 'student') {
    this.activeTab.set(tab);
  }

  async onInstructorSubmit(instructor: Instructor) {
    try {
      const emailExists = this.dataService.users().some(u => u.email === instructor.email);
      if (emailExists) {
        await Swal.fire({ title: 'Email already exists', text: 'An account with this email already exists.', icon: 'error' });
        return;
      }

      const userId = generateUniqueId('U');
      const user = {
        user_id: userId,
        email: instructor.email,
        password: 'instructor123',
        role: 'instructor' as const,
        first_name: instructor.first_name,
        middle_name: instructor.middle_name,
        last_name: instructor.last_name,
        full_name: instructor.full_name,
        created_at: new Date().toISOString()
      };

      await this.dataService.addUser(user);
      await this.dataService.addInstructor({ ...instructor, user_id: userId, created_at: new Date().toISOString() });

      await Swal.fire({
        title: 'Success!',
        html: `Instructor account created!<br><strong>Email:</strong> ${user.email}<br><strong>Default password:</strong> instructor123`,
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

      const studentUserId = generateUniqueId('U');
      const studentUser: any = {
        user_id: studentUserId,
        email: data.student.email,
        password: 'student123',
        role: 'student' as const,
        first_name: data.student.first_name,
        last_name: data.student.last_name,
        full_name: data.student.full_name,
        created_at: new Date().toISOString()
      };
      if (data.student.middle_name) studentUser.middle_name = data.student.middle_name;

      await this.dataService.addUser(studentUser);
      await this.dataService.addStudent({
        ...data.student,
        user_id: studentUserId,
        created_at: new Date().toISOString()
      } as any);

      const parentUserId = generateUniqueId('U');
      const parentUser: any = {
        user_id: parentUserId,
        email: data.parent.email,
        password: 'parent123',
        role: 'parent' as const,
        first_name: data.parent.first_name,
        last_name: data.parent.last_name,
        full_name: data.parent.full_name,
        created_at: new Date().toISOString()
      };
      if (data.parent.middle_name) parentUser.middle_name = data.parent.middle_name;

      await this.dataService.addUser(parentUser);
      await this.dataService.addParent({
        ...data.parent,
        user_id: parentUserId,
        created_at: new Date().toISOString()
      } as any);

      await Swal.fire({
        title: 'Success!',
        html: `Student & parent accounts created!<br><strong>Student:</strong> ${studentUser.email}<br><strong>Parent:</strong> ${parentUser.email}<br><strong>Default passwords:</strong> student123 / parent123`,
        icon: 'success', timer: 3000, showConfirmButton: false
      });

      this.studentForm?.resetForm();
    } catch (error) {
      await Swal.fire({ title: 'Error!', text: error instanceof Error ? error.message : 'Failed to create student account.', icon: 'error' });
    }
  }
}
