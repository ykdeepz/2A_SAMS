import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RoleService } from '../../services/role.service';
import { InstructorFormComponent } from './instructor-form/instructor-form.component';
import { StudentFormComponent, StudentFormData } from './student-form/student-form.component';
import { Instructor } from '../../models/user.model';
import { LucideAngularModule, CheckCircle2, AlertCircle, X, UserCircle, GraduationCap } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [CommonModule, InstructorFormComponent, StudentFormComponent, LucideAngularModule],
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent {
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
      // Create user account first
      const userId = 'U' + Date.now();
      const user = {
        user_id: userId,
        email: instructor.email,
        password: 'instructor123', // Default password
        role: 'instructor' as const,
        first_name: instructor.first_name,
        middle_name: instructor.middle_name,
        last_name: instructor.last_name,
        full_name: instructor.full_name,
        created_at: new Date().toISOString()
      };
      
      await this.dataService.addUser(user);
      
      // Then create instructor profile
      const instructorWithUser = {
        ...instructor,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      await this.dataService.addInstructor(instructorWithUser);
      
      await Swal.fire({
        title: 'Success!',
        html: 'Instructor account created successfully!<br><strong>Default password:</strong> instructor123',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to create instructor account. Please try again.',
        icon: 'error'
      });
    }
  }

  async onStudentSubmit(data: StudentFormData) {
    try {
      // Create student user account
      const studentUserId = 'U' + Date.now();
      const studentUser = {
        user_id: studentUserId,
        email: data.student.email,
        password: 'student123', // Default password
        role: 'student' as const,
        first_name: data.student.first_name,
        middle_name: data.student.middle_name,
        last_name: data.student.last_name,
        full_name: data.student.full_name,
        created_at: new Date().toISOString()
      };
      
      await this.dataService.addUser(studentUser);
      
      // Create student profile
      const studentWithUser = {
        ...data.student,
        user_id: studentUserId,
        created_at: new Date().toISOString()
      };
      
      await this.dataService.addStudent(studentWithUser);
      
      // Create parent user account
      const parentUserId = 'U' + (Date.now() + 1);
      const parentUser = {
        user_id: parentUserId,
        email: data.parent.email,
        password: 'parent123', // Default password
        role: 'parent' as const,
        first_name: data.parent.first_name,
        middle_name: data.parent.middle_name,
        last_name: data.parent.last_name,
        full_name: data.parent.full_name,
        created_at: new Date().toISOString()
      };
      
      await this.dataService.addUser(parentUser);
      
      // Create parent profile
      const parentWithUser = {
        ...data.parent,
        user_id: parentUserId,
        created_at: new Date().toISOString()
      };
      
      await this.dataService.addParent(parentWithUser);
      
      await Swal.fire({
        title: 'Success!',
        html: 'Student and parent accounts created!<br><strong>Default passwords:</strong> student123 / parent123',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to create student account. Please try again.',
        icon: 'error'
      });
    }
  }
}
