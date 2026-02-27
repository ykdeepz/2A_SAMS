import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Student, Instructor, Parent, User } from '../../models/user.model';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent {
  accountType = 'instructor';
  instructorForm: any = {};
  studentForm: any = {};
  parentForm: any = {};
  message = signal('');

  constructor(private dataService: DataService) {}

  createInstructor() {
    const userId = 'U' + Date.now();
    const instructor: Instructor = {
      instructor_id: 'I' + Date.now(),
      full_name: this.instructorForm.full_name,
      email: this.instructorForm.email,
      phone: this.instructorForm.phone,
      department: this.instructorForm.department,
      user_id: userId
    };

    this.dataService.addInstructor(instructor);
    this.showMessage('Instructor account created successfully');
    this.instructorForm = {};
  }

  createStudent() {
    const userId = 'U' + Date.now();
    const studentId = 'S' + Date.now();
    
    const student: Student = {
      student_id: studentId,
      full_name: this.studentForm.full_name,
      email: this.studentForm.email,
      grade_level: this.studentForm.grade_level,
      section: this.studentForm.section,
      qr_code_data: `STUDENT-${studentId}`,
      instructor_id: this.dataService.instructors()[0]?.instructor_id || 'I001',
      user_id: userId
    };

    this.dataService.addStudent(student);

    // Create parent if info provided
    if (this.parentForm.full_name) {
      const parent: Parent = {
        parent_id: 'P' + Date.now(),
        full_name: this.parentForm.full_name,
        email: this.parentForm.email,
        phone: this.parentForm.phone,
        student_id: studentId,
        user_id: 'U' + (Date.now() + 1)
      };
      this.dataService.addParent(parent);
    }

    this.showMessage('Student account created successfully');
    this.studentForm = {};
    this.parentForm = {};
  }

  showMessage(msg: string) {
    this.message.set(msg);
    setTimeout(() => this.message.set(''), 3000);
  }
}
