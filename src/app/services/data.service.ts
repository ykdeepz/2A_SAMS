import { Injectable, signal } from '@angular/core';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Student, Subject, Attendance, SubjectEnrollment, Instructor, Parent, User, Department } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class DataService {

  students    = signal<Student[]>([]);
  subjects    = signal<Subject[]>([]);
  attendance  = signal<Attendance[]>([]);
  enrollments = signal<SubjectEnrollment[]>([]);
  instructors = signal<Instructor[]>([]);
  parents     = signal<Parent[]>([]);
  users       = signal<User[]>([]);
  departments = signal<Department[]>([]);
  loading     = signal(true);
  loadError   = signal(false);

  constructor() { this.loadAllData(); }

  async loadAllData() {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      const results = await Promise.allSettled([
        this.loadUsers(), this.loadStudents(), this.loadSubjects(),
        this.loadAttendance(), this.loadEnrollments(), this.loadInstructors(),
        this.loadParents(), this.loadDepartments()
      ]);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('Some collections failed to load:', failed);
        this.loadError.set(true);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────
  private async getAll<T>(col: string): Promise<T[]> {
    const snap = await getDocs(collection(db, col));
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }) as T);
  }

  // Strip _docId before writing to Firestore
  private clean(data: any): any {
    const { _docId, ...rest } = data;
    return rest;
  }

  private async addDoc_<T extends object>(col: string, data: T): Promise<T> {
    const ref = await addDoc(collection(db, col), this.clean(data));
    return { ...data, _docId: ref.id };
  }

  private async updateDoc_(col: string, docId: string, data: object) {
    await updateDoc(doc(db, col, docId), this.clean(data) as any);
  }

  private async deleteDoc_(col: string, docId: string) {
    await deleteDoc(doc(db, col, docId));
  }

  // Always look up the stored object to get _docId — never trust the passed object
  private findDocId(stored: any[], key: string, value: any): string {
    const item = stored.find(x => x[key] === value);
    if (!item?._docId) throw new Error(`_docId not found for ${key}=${value}`);
    return item._docId;
  }

  // ── Users ─────────────────────────────────────────────────
  async loadUsers() {
    try { this.users.set(await this.getAll<User>('users')); }
    catch (e) { console.error(e); throw e; }
  }

  async addUser(user: User) {
    const saved = await this.addDoc_('users', user);
    this.users.update(u => [...u, saved]);
    return saved;
  }

  async updateUser(user: User) {
    const docId = this.findDocId(this.users(), 'user_id', user.user_id);
    await this.updateDoc_('users', docId, user);
    this.users.update(u => u.map(x => x.user_id === user.user_id ? { ...user, _docId: docId } as any : x));
    return user;
  }

  async deleteUser(userId: string) {
    const docId = this.findDocId(this.users(), 'user_id', userId);
    await this.deleteDoc_('users', docId);
    this.users.update(u => u.filter(x => x.user_id !== userId));
    return true;
  }

  // ── Students ──────────────────────────────────────────────
  async loadStudents() {
    try { this.students.set(await this.getAll<Student>('students')); }
    catch (e) { console.error(e); throw e; }
  }

  getStudents() { return this.students(); }

  async addStudent(student: Student) {
    const saved = await this.addDoc_('students', student);
    this.students.update(s => [...s, saved]);
    return saved;
  }

  async updateStudent(student: Student) {
    const docId = this.findDocId(this.students(), 'student_id', student.student_id);
    await this.updateDoc_('students', docId, student);
    this.students.update(s => s.map(x => x.student_id === student.student_id ? { ...student, _docId: docId } as any : x));
    return student;
  }

  async deleteStudent(studentId: string) {
    const docId = this.findDocId(this.students(), 'student_id', studentId);
    await this.deleteDoc_('students', docId);
    this.students.update(s => s.filter(x => x.student_id !== studentId));
  }

  // ── Subjects ──────────────────────────────────────────────
  async loadSubjects() {
    try { this.subjects.set(await this.getAll<Subject>('subjects')); }
    catch (e) { console.error(e); throw e; }
  }

  getSubjects() { return this.subjects(); }

  async addSubject(subject: Subject) {
    const saved = await this.addDoc_('subjects', subject);
    this.subjects.update(s => [...s, saved]);
    return saved;
  }

  async updateSubject(subject: Subject) {
    const docId = this.findDocId(this.subjects(), 'subject_id', subject.subject_id);
    await this.updateDoc_('subjects', docId, subject);
    this.subjects.update(s => s.map(x => x.subject_id === subject.subject_id ? { ...subject, _docId: docId } as any : x));
    return subject;
  }

  async deleteSubject(id: string) {
    const docId = this.findDocId(this.subjects(), 'subject_id', id);
    await this.deleteDoc_('subjects', docId);
    this.subjects.update(s => s.filter(x => x.subject_id !== id));
  }

  // ── Attendance ────────────────────────────────────────────
  async loadAttendance() {
    try { this.attendance.set(await this.getAll<Attendance>('attendance')); }
    catch (e) { console.error(e); throw e; }
  }

  getAttendance() { return this.attendance(); }

  async addAttendance(record: Attendance) {
    const exists = this.attendance().some(a =>
      a.student_id === record.student_id &&
      a.subject_id === record.subject_id &&
      new Date(a.date).toDateString() === new Date(record.date).toDateString()
    );
    if (exists) return false;
    const saved = await this.addDoc_('attendance', record);
    this.attendance.update(a => [...a, saved]);
    return true;
  }

  // ── Enrollments ───────────────────────────────────────────
  async loadEnrollments() {
    try { this.enrollments.set(await this.getAll<SubjectEnrollment>('enrollments')); }
    catch (e) { console.error(e); throw e; }
  }

  getEnrollments() { return this.enrollments(); }

  async enrollStudent(enrollment: SubjectEnrollment) {
    const saved = await this.addDoc_('enrollments', enrollment);
    this.enrollments.update(e => [...e, saved]);
    return saved;
  }

  async unenrollStudent(enrollmentId: string) {
    const docId = this.findDocId(this.enrollments(), 'enrollment_id', enrollmentId);
    await this.deleteDoc_('enrollments', docId);
    this.enrollments.update(e => e.filter(x => x.enrollment_id !== enrollmentId));
  }

  // ── Instructors ───────────────────────────────────────────
  async loadInstructors() {
    try { this.instructors.set(await this.getAll<Instructor>('instructors')); }
    catch (e) { console.error(e); throw e; }
  }

  getInstructors() { return this.instructors(); }

  async getInstructorByUserId(userId: string): Promise<Instructor | undefined> {
    return this.instructors().find(i => i.user_id === userId);
  }

  async addInstructor(instructor: Instructor) {
    const saved = await this.addDoc_('instructors', instructor);
    this.instructors.update(i => [...i, saved]);
    return saved;
  }

  async updateInstructor(instructor: Instructor) {
    const docId = this.findDocId(this.instructors(), 'instructor_id', instructor.instructor_id);
    await this.updateDoc_('instructors', docId, instructor);
    this.instructors.update(i => i.map(x => x.instructor_id === instructor.instructor_id ? { ...instructor, _docId: docId } as any : x));
    return instructor;
  }

  async deleteInstructor(instructorId: string) {
    const docId = this.findDocId(this.instructors(), 'instructor_id', instructorId);
    await this.deleteDoc_('instructors', docId);
    this.instructors.update(i => i.filter(x => x.instructor_id !== instructorId));
  }

  // ── Parents ───────────────────────────────────────────────
  async loadParents() {
    try { this.parents.set(await this.getAll<Parent>('parents')); }
    catch (e) { console.error(e); throw e; }
  }

  getParents() { return this.parents(); }

  async addParent(parent: Parent) {
    const saved = await this.addDoc_('parents', parent);
    this.parents.update(p => [...p, saved]);
    return saved;
  }

  async updateParent(parent: Parent) {
    const docId = this.findDocId(this.parents(), 'parent_id', parent.parent_id);
    await this.updateDoc_('parents', docId, parent);
    this.parents.update(p => p.map(x => x.parent_id === parent.parent_id ? { ...parent, _docId: docId } as any : x));
    return parent;
  }

  async deleteParent(parentId: string) {
    const docId = this.findDocId(this.parents(), 'parent_id', parentId);
    await this.deleteDoc_('parents', docId);
    this.parents.update(p => p.filter(x => x.parent_id !== parentId));
  }

  // ── Departments ───────────────────────────────────────────
  async loadDepartments() {
    try { this.departments.set(await this.getAll<Department>('departments')); }
    catch (e) { console.error(e); throw e; }
  }

  getDepartments() { return this.departments(); }

  async addDepartment(department: Department) {
    const saved = await this.addDoc_('departments', department);
    this.departments.update(d => [...d, saved]);
    return saved;
  }

  async updateDepartment(department: Department) {
    // Use _docId directly from the passed object (set when fetched from Firestore)
    const docId = (department as any)._docId;
    if (!docId) throw new Error('Department _docId missing');
    await this.updateDoc_('departments', docId, department);
    this.departments.update(d => d.map(x => (x as any)._docId === docId ? { ...department, _docId: docId } as any : x));
    return department;
  }

  async deleteDepartment(dept: Department) {
    const docId = (dept as any)._docId;
    if (!docId) throw new Error('Department _docId missing');
    await this.deleteDoc_('departments', docId);
    this.departments.update(d => d.filter(x => (x as any)._docId !== docId));
  }
}

