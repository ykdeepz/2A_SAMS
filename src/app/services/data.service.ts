import { Injectable, signal } from '@angular/core';
import { Student, Subject, Attendance, SubjectEnrollment, Instructor, Parent } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  students = signal<Student[]>([]);
  subjects = signal<Subject[]>([]);
  attendance = signal<Attendance[]>([]);
  enrollments = signal<SubjectEnrollment[]>([]);
  instructors = signal<Instructor[]>([]);
  parents = signal<Parent[]>([]);

  constructor() {
    this.initMockData();
  }

  private initMockData() {
    // Mock instructors
    this.instructors.set([
      { instructor_id: 'I001', full_name: 'John Smith', email: 'instructor@school.com', phone: '555-0101', department: 'Mathematics', user_id: '2' }
    ]);

    // Mock students
    this.students.set([
      { student_id: 'S001', full_name: 'Alice Johnson', email: 'alice@school.com', grade_level: '10', section: 'A', qr_code_data: 'STUDENT-S001', instructor_id: 'I001', user_id: '3' },
      { student_id: 'S002', full_name: 'Bob Williams', email: 'bob@school.com', grade_level: '10', section: 'A', qr_code_data: 'STUDENT-S002', instructor_id: 'I001', user_id: '5' }
    ]);

    // Mock subjects
    this.subjects.set([
      { subject_id: 'SUB001', subject_name: 'Mathematics', subject_code: 'MATH101', instructor_id: 'I001', instructor_name: 'John Smith', grade_level: '10', section: 'A', schedule: 'Mon/Wed 9:00 AM' }
    ]);

    // Mock enrollments
    this.enrollments.set([
      { enrollment_id: 'E001', subject_id: 'SUB001', student_id: 'S001', student_name: 'Alice Johnson', subject_name: 'Mathematics', enrolled_date: new Date() }
    ]);
  }

  // Students
  getStudents() { return this.students(); }
  addStudent(student: Student) {
    this.students.update(s => [...s, student]);
  }

  // Subjects
  getSubjects() { return this.subjects(); }
  addSubject(subject: Subject) {
    this.subjects.update(s => [...s, subject]);
  }
  deleteSubject(id: string) {
    this.subjects.update(s => s.filter(sub => sub.subject_id !== id));
  }

  // Attendance
  getAttendance() { return this.attendance(); }
  addAttendance(record: Attendance) {
    // Check for duplicate
    const exists = this.attendance().some(a => 
      a.student_id === record.student_id && 
      a.subject_id === record.subject_id && 
      new Date(a.date).toDateString() === new Date(record.date).toDateString()
    );
    if (!exists) {
      this.attendance.update(a => [...a, record]);
      return true;
    }
    return false;
  }

  // Enrollments
  getEnrollments() { return this.enrollments(); }
  enrollStudent(enrollment: SubjectEnrollment) {
    this.enrollments.update(e => [...e, enrollment]);
  }
  unenrollStudent(enrollmentId: string) {
    this.enrollments.update(e => e.filter(enr => enr.enrollment_id !== enrollmentId));
  }

  // Instructors
  getInstructors() { return this.instructors(); }
  addInstructor(instructor: Instructor) {
    this.instructors.update(i => [...i, instructor]);
  }

  // Parents
  getParents() { return this.parents(); }
  addParent(parent: Parent) {
    this.parents.update(p => [...p, parent]);
  }
}
