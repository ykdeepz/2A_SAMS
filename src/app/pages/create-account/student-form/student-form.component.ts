import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student, Parent } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data.service';
import Swal from 'sweetalert2';

export interface StudentFormData {
  student: Student;
  parent: Parent;
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.css']
})
export class StudentFormComponent {
  private authService = inject(AuthService);
  private dataService = inject(DataService);
  
  @Output() submitForm = new EventEmitter<StudentFormData>();
  
  loading = signal(false);
  
  formData = {
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    grade_level: '',
    section: ''
  };

  parentData = {
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: ''
  };

  onSubmit() {
    if (!this.isFormValid()) return;
    
    this.loading.set(true);
    
    // Get current instructor - only check if user is an instructor
    const user = this.authService.currentUser();
    let instructorId = '';
    
    if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      
      if (!instructor) {
        Swal.fire({
          title: 'Error!',
          text: 'Instructor profile not found',
          icon: 'error'
        });
        this.loading.set(false);
        return;
      }
      instructorId = instructor.instructor_id;
    } else if (user?.role === 'admin') {
      // Admin creating student - use a default or let it be empty
      instructorId = 'ADMIN-CREATED';
    }
    
    // Simulate API call
    setTimeout(() => {
      const studentFullName = [
        this.formData.first_name,
        this.formData.middle_name,
        this.formData.last_name
      ].filter(n => n).join(' ');

      const parentFullName = [
        this.parentData.first_name,
        this.parentData.middle_name,
        this.parentData.last_name
      ].filter(n => n).join(' ');

      const student: Student = {
        student_id: this.formData.student_id,
        first_name: this.formData.first_name,
        middle_name: this.formData.middle_name || undefined,
        last_name: this.formData.last_name,
        full_name: studentFullName,
        email: this.formData.email,
        grade_level: this.formData.grade_level,
        section: this.formData.section,
        qr_code_data: `STUDENT-${this.formData.student_id}`,
        instructor_id: instructorId,
        user_id: 'U' + Date.now(),
        created_at: new Date().toISOString()
      };

      const parent: Parent = {
        parent_id: 'P' + Date.now(),
        first_name: this.parentData.first_name,
        middle_name: this.parentData.middle_name || undefined,
        last_name: this.parentData.last_name,
        full_name: parentFullName,
        email: this.parentData.email,
        phone: this.parentData.phone,
        student_id: this.formData.student_id,
        user_id: 'U' + (Date.now() + 1),
        created_at: new Date().toISOString()
      };
      
      this.submitForm.emit({ student, parent });
      this.resetForm();
      this.loading.set(false);
    }, 800);
  }

  isFormValid(): boolean {
    return !!(
      this.formData.student_id &&
      this.formData.first_name &&
      this.formData.last_name &&
      this.formData.email &&
      this.formData.grade_level &&
      this.formData.section &&
      this.parentData.first_name &&
      this.parentData.last_name &&
      this.parentData.email &&
      this.parentData.phone
    );
  }

  resetForm() {
    this.formData = {
      student_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone: '',
      grade_level: '',
      section: ''
    };
    
    this.parentData = {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone: ''
    };
  }
}
