import { Injectable } from '@angular/core';
import { User, StudentUser, InstructorUser, Subject, Attendance } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly REGISTERED_STORAGE_KEY = 'sams_registered_credentials_v1';
  private readonly SUBJECTS_STORAGE_KEY = 'sams_subjects_v1';
  private readonly ATTENDANCES_STORAGE_KEY = 'sams_attendances_v1';
  private users: User[] = [
    {
      id: '1',
      email: 'instructor@ustp.edu',
      password: '123456',
      role: 'instructor',
      name: 'Dr. Smith',
      profile: { phone: '123-456-7890' }
    } as InstructorUser,
    {
      id: '2',
      email: 'student1@ustp.edu',
      password: '123456',
      role: 'student',
      name: 'John Doe',
      studentId: '2024001',
      enrolledSubjects: ['sub1']
    } as StudentUser,
    {
      id: '3',
      email: 'student2@ustp.edu',
      password: '123456',
      role: 'student',
      name: 'Jane Doe',
      studentId: '2024002',
      enrolledSubjects: ['sub1']
    } as StudentUser
  ];

  private subjects: Subject[] = [
    {
      id: 'sub1',
      name: 'Computer Science 101',
      code: 'CS101',
      instructorId: '1',
      enrolledStudents: ['2', '3'],
      schedule: { days: ['Mon', 'Wed'], time: '10:00 AM', room: 'Room 101' }
    }
  ];

  private attendances: Attendance[] = [];

  constructor() {
    // Load registered users from localStorage at initialization
    this.loadRegisteredUsers();
    this.loadSubjects();
    this.loadAttendances();
  }

  private loadRegisteredUsers(): void {
    try {
      const registered = localStorage.getItem(this.REGISTERED_STORAGE_KEY);
      if (!registered) return;
      
      const registeredCredentials = JSON.parse(registered);
      
      // Load user details from separate storage keys
      const instructorDetailsKey = 'sams_user_details_instructor';
      const studentDetailsKey = 'sams_user_details_student';
      const parentDetailsKey = 'sams_user_details_parent';
      
      const instructorDetails = JSON.parse(localStorage.getItem(instructorDetailsKey) || '{}');
      const studentDetails = JSON.parse(localStorage.getItem(studentDetailsKey) || '{}');
      const parentDetails = JSON.parse(localStorage.getItem(parentDetailsKey) || '{}');
      
      // Add registered users to the users array if not already present
      if (registeredCredentials.instructor && Array.isArray(registeredCredentials.instructor)) {
        registeredCredentials.instructor.forEach((cred: any) => {
          if (!this.users.find(u => u.email === cred.id && u.role === 'instructor')) {
            const details = instructorDetails[cred.id] || {};
            this.users.push({
              id: 'inst_' + Date.now() + Math.random(),
              email: cred.id,
              password: cred.password,
              role: 'instructor',
              name: details.name || cred.id.split('@')[0],
              profile: { phone: details.phone || '' },
              subjects: []
            } as InstructorUser);
          }
        });
      }
      
      if (registeredCredentials.student && Array.isArray(registeredCredentials.student)) {
        registeredCredentials.student.forEach((cred: any) => {
          if (!this.users.find(u => (u as StudentUser).studentId === cred.id && u.role === 'student')) {
            const details = studentDetails[cred.id] || {};
            this.users.push({
              id: 'stud_' + Date.now() + Math.random(),
              email: details.email || cred.id + '@ustp.edu',
              password: cred.password,
              role: 'student',
              name: details.name || cred.id,
              studentId: cred.id,
              enrolledSubjects: details.enrolledSubjects || [],
              location: details.location
            } as StudentUser);
          }
        });
      }
      
      if (registeredCredentials.parent && Array.isArray(registeredCredentials.parent)) {
        registeredCredentials.parent.forEach((cred: any) => {
          if (!this.users.find(u => u.email === cred.id && u.role === 'parent')) {
            const details = parentDetails[cred.id] || {};
            this.users.push({
              id: 'parent_' + Date.now() + Math.random(),
              email: cred.id,
              password: cred.password,
              role: 'parent',
              name: details.name || cred.id.split('@')[0]
            } as User);
          }
        });
      }
    } catch (e) {
      console.error('Error loading registered users:', e);
    }
  }

  private loadSubjects(): void {
    try {
      const stored = localStorage.getItem(this.SUBJECTS_STORAGE_KEY);
      if (stored) {
        const parsedSubjects = JSON.parse(stored);
        if (Array.isArray(parsedSubjects)) {
          this.subjects = parsedSubjects;
        }
      }
    } catch (e) {
      console.error('Error loading subjects:', e);
    }
  }

  private loadAttendances(): void {
    try {
      const stored = localStorage.getItem(this.ATTENDANCES_STORAGE_KEY);
      if (stored) {
        const parsedAttendances = JSON.parse(stored);
        if (Array.isArray(parsedAttendances)) {
          this.attendances = parsedAttendances;
        }
      }
    } catch (e) {
      console.error('Error loading attendances:', e);
    }
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem('sams_current_user_v1');
    if (!stored) return null;
    try {
      const { role, id } = JSON.parse(stored);
      if (role === 'student') {
        return this.users.find(u => u.role === 'student' && (u as StudentUser).studentId === id) || 
               this.users.find(u => u.role === 'student' && u.email === id) || null;
      } else {
        return this.users.find(u => u.role === role && u.email === id) || null;
      }
    } catch (e) {
      return null;
    }
  }

  getSubjectsByInstructor(instructorId: string): Subject[] {
    return this.subjects.filter(s => s.instructorId === instructorId);
  }

  getStudentsBySubject(subjectId: string): StudentUser[] {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return [];
    return this.users.filter(u => u.role === 'student' && subject.enrolledStudents.includes(u.id)) as StudentUser[];
  }

  getStudentById(studentId: string): StudentUser | null {
    return this.users.find(u => u.role === 'student' && (u as StudentUser).studentId === studentId) as StudentUser || null;
  }

  addStudentToSubject(subjectId: string, studentId: string): boolean {
    const subject = this.subjects.find(s => s.id === subjectId);
    const student = this.getStudentById(studentId);
    if (!subject || !student || subject.enrolledStudents.includes(student.id)) return false;
    subject.enrolledStudents.push(student.id);
    (student as StudentUser).enrolledSubjects.push(subjectId);
    this.saveSubjects();
    return true;
  }

  removeStudentFromSubject(subjectId: string, studentId: string): boolean {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return false;
    const index = subject.enrolledStudents.indexOf(studentId);
    if (index === -1) return false;
    subject.enrolledStudents.splice(index, 1);
    const student = this.users.find(u => u.id === studentId) as StudentUser;
    const subIndex = student.enrolledSubjects.indexOf(subjectId);
    if (subIndex !== -1) student.enrolledSubjects.splice(subIndex, 1);
    this.saveSubjects();
    return true;
  }

  createSubject(subject: Omit<Subject, 'id'>): Subject {
    const newSubject: Subject = { ...subject, id: 'sub' + Date.now() };
    this.subjects.push(newSubject);
    this.saveSubjects();
    return newSubject;
  }

  recordAttendance(attendance: Omit<Attendance, 'id'>): void {
    const newAttendance: Attendance = { ...attendance, id: 'att' + Date.now() };
    this.attendances.push(newAttendance);
    this.saveAttendances();
  }

  getAttendanceForSubject(subjectId: string, date: string): Attendance[] {
    return this.attendances.filter(a => a.subjectId === subjectId && a.date === date);
  }

  getAttendanceForDate(date: string): Attendance[] {
    return this.attendances.filter(a => a.date === date);
  }

  getAllAttendances(): Attendance[] {
    return this.attendances;
  }

  reloadRegisteredUsers(): void {
    this.loadRegisteredUsers();
  }

  private saveSubjects(): void {
    try {
      localStorage.setItem(this.SUBJECTS_STORAGE_KEY, JSON.stringify(this.subjects));
    } catch (e) {
      console.error('Error saving subjects:', e);
    }
  }

  private saveAttendances(): void {
    try {
      localStorage.setItem(this.ATTENDANCES_STORAGE_KEY, JSON.stringify(this.attendances));
    } catch (e) {
      console.error('Error saving attendances:', e);
    }
  }
}