import { Injectable, signal } from '@angular/core';
import {
  collection, getDocs, addDoc, setDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase.config';
import { Student, Subject, Attendance, SubjectEnrollment, Instructor, Parent, User, Department, RegistrationRequest } from '../models/user.model';

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
  registrationRequests = signal<RegistrationRequest[]>([]);
  loading     = signal(true);
  loadError   = signal(false);

  constructor() {
    // Wait for Firebase Auth to restore the session before loading Firestore data.
    // Loading immediately in the constructor fires before the auth token is ready,
    // causing every read to be rejected with "Missing or insufficient permissions".
    // Only departments is publicly readable (allow read: if true), so load it
    // immediately for the signup form dropdown; everything else waits for auth.
    this.loadDepartments().catch(() => {});

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.loadAllData();
      } else {
        // Signed out — clear all protected data from memory
        this.students.set([]);
        this.subjects.set([]);
        this.attendance.set([]);
        this.enrollments.set([]);
        this.instructors.set([]);
        this.parents.set([]);
        this.users.set([]);
        this.registrationRequests.set([]);
        this.loading.set(false);
        this.loadError.set(false);
      }
    });
  }

  async loadAllData() {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      // Load collections available to all authenticated users
      const results = await Promise.allSettled([
        this.loadUsers(), this.loadStudents(), this.loadSubjects(),
        this.loadAttendance(), this.loadEnrollments(), this.loadInstructors(),
        this.loadParents(), this.loadDepartments()
      ]);

      // Check for genuine failures (not permission-denied, which just means
      // the current user's role doesn't have access to that collection)
      const genuineFailed = results.filter(r => {
        if (r.status !== 'rejected') return false;
        const code = (r.reason as any)?.code;
        return code !== 'permission-denied';
      });

      if (genuineFailed.length > 0) {
        console.error('Some collections failed to load:', genuineFailed);
        this.loadError.set(true);
      }

      // Load registration_requests separately — only admins can read these,
      // so a permission-denied here is expected for non-admin users
      await this.loadRegistrationRequests().catch(e => {
        if (e?.code !== 'permission-denied') {
          console.error('Failed to load registration requests:', e);
        }
      });

      // Fix any user documents whose Firestore doc ID doesn't match their
      // user_id (Auth UID). This happens for accounts created before the
      // setDoc fix. Runs silently — permission-denied just means the current
      // user isn't admin, which is fine.
      this.migrateUserDocIds().catch(() => {});

    } catch (e) {
      console.error('Failed to load data:', e);
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  // ── One-time migration: re-key user docs so doc ID == user_id (Auth UID) ──
  // Safe to run repeatedly — skips docs that are already correct.
  // Checks localStorage so it only runs once per browser after completion.
  async migrateUserDocIds() {
    if (localStorage.getItem('userDocMigrationDone') === 'true') return;

    const snap = await getDocs(collection(db, 'users'));
    let migrated = 0;
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as User;
      const docId = docSnap.id;
      const userId = data.user_id;
      if (!userId || docId === userId) continue;
      try {
        await setDoc(doc(db, 'users', userId), { ...data });
        await deleteDoc(doc(db, 'users', docId));
        migrated++;
      } catch (e) {
        // Skip docs we don't have permission for
      }
    }

    if (migrated > 0) {
      console.log(`User doc migration complete: ${migrated} doc(s) fixed.`);
      await this.loadUsers().catch(() => {});
    }

    // Mark done so it never runs again on this browser
    localStorage.setItem('userDocMigrationDone', 'true');
  }

  // ── Helpers ──────────────────────────────────────────────
  private async getAll<T>(col: string): Promise<T[]> {
    const snap = await getDocs(collection(db, col));
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }) as T);
  }

  // Strip _docId and any undefined values before writing to Firestore
  private clean(data: any): any {
    const { _docId, ...rest } = data;
    // Firestore rejects undefined values — remove them entirely
    return Object.fromEntries(
      Object.entries(rest).filter(([_, v]) => v !== undefined)
    );
  }

  private async addDoc_<T extends object>(col: string, data: T): Promise<T> {
    const ref = await addDoc(collection(db, col), this.clean(data));
    return { ...data, _docId: ref.id };
  }

  // Write a document with a specific ID (used for users so doc ID == Auth UID)
  private async setDoc_<T extends object>(col: string, docId: string, data: T): Promise<T> {
    await setDoc(doc(db, col, docId), this.clean(data));
    return { ...data, _docId: docId };
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
    // Use the Auth UID as the Firestore document ID so that
    // request.auth.uid == userId in security rules works correctly.
    const saved = await this.setDoc_('users', user.user_id, user);
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
    // Cascade delete: Delete all related records
    const user = this.users().find(u => u.user_id === userId);
    if (!user) return false;
    
    // Delete student records if user is a student
    const student = this.students().find(s => s.user_id === userId);
    if (student) {
      await this.deleteStudent(student.student_id);
    }
    
    // Delete instructor records if user is an instructor
    const instructor = this.instructors().find(i => i.user_id === userId);
    if (instructor) {
      await this.deleteInstructor(instructor.instructor_id);
    }
    
    // Delete parent records if user is a parent
    const parent = this.parents().find(p => p.user_id === userId);
    if (parent) {
      await this.deleteParent(parent.parent_id);
    }
    
    // Delete the user
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
    // Collect records BEFORE updating signals, otherwise the filtered arrays will be empty
    const enrollmentsToDelete = this.enrollments().filter(e => e.student_id === studentId);
    const attendanceToDelete = this.attendance().filter(a => a.student_id === studentId);
    const parentsToDelete = this.parents().filter(p => p.student_id === studentId);

    // Delete enrollments from Firestore then update signal
    for (const enrollment of enrollmentsToDelete) {
      if (enrollment._docId) {
        await this.deleteDoc_('enrollments', enrollment._docId);
      }
    }
    this.enrollments.update(e => e.filter(x => x.student_id !== studentId));

    // Delete attendance records from Firestore then update signal
    for (const record of attendanceToDelete) {
      if (record._docId) {
        await this.deleteDoc_('attendance', record._docId);
      }
    }
    this.attendance.update(a => a.filter(x => x.student_id !== studentId));

    // Delete related parents
    for (const parent of parentsToDelete) {
      await this.deleteParent(parent.parent_id);
    }

    // Delete the student
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
    try { 
      const records = await this.getAll<Attendance>('attendance');
      // Ensure dates are properly converted from Firestore timestamps
      const fixedRecords = records.map(r => ({
        ...r,
        date: r.date instanceof Date ? r.date : new Date(r.date as any)
      }));
      this.attendance.set(fixedRecords); 
    }
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
    
    // Convert date to ISO string for consistent storage
    const recordToSave = {
      ...record,
      date: record.date instanceof Date ? record.date.toISOString() : new Date(record.date).toISOString()
    };
    
    const saved = await this.addDoc_('attendance', recordToSave);
    // Convert date back to Date object for in-memory storage
    const fixedSaved = {
      ...saved,
      date: new Date(saved.date as any)
    };
    this.attendance.update(a => [...a, fixedSaved]);
    return true;
  }

  // ── Enrollments ───────────────────────────────────────────
  async loadEnrollments() {
    try {
      const records = await this.getAll<SubjectEnrollment>('enrollments');
      // Convert Firestore Timestamps to JS Dates (same pattern as loadAttendance)
      const fixed = records.map(r => ({
        ...r,
        enrolled_date: r.enrolled_date instanceof Date
          ? r.enrolled_date
          : new Date((r.enrolled_date as any)?.toDate?.() ?? r.enrolled_date)
      }));
      this.enrollments.set(fixed);
    }
    catch (e) { console.error(e); throw e; }
  }

  getEnrollments() { return this.enrollments(); }

  async enrollStudent(enrollment: SubjectEnrollment) {
    // Store enrolled_date as ISO string so it round-trips cleanly (same as attendance dates)
    const toSave = {
      ...enrollment,
      enrolled_date: enrollment.enrolled_date instanceof Date
        ? enrollment.enrolled_date.toISOString()
        : new Date(enrollment.enrolled_date).toISOString()
    };
    const saved = await this.addDoc_('enrollments', toSave);
    // Convert back to Date for in-memory signal
    const fixedSaved = {
      ...saved,
      enrolled_date: new Date(saved.enrolled_date as any)
    };
    this.enrollments.update(e => [...e, fixedSaved]);
    return fixedSaved;
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
    // Cascade delete: Delete subjects, attendance, and enrollments
    const subjectsToDelete = this.subjects().filter(s => s.instructor_id === instructorId);
    for (const subject of subjectsToDelete) {
      await this.deleteSubject(subject.subject_id);
    }

    // Collect attendance records BEFORE updating the signal
    const attendanceToDelete = this.attendance().filter(a => a.instructor_id === instructorId);
    for (const record of attendanceToDelete) {
      if (record._docId) {
        await this.deleteDoc_('attendance', record._docId);
      }
    }
    this.attendance.update(a => a.filter(x => x.instructor_id !== instructorId));

    // Delete the instructor
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

  // ── Clear all attendance for a subject on a specific day ──
  async clearAttendanceForDay(subjectId: string, date: Date = new Date()) {
    const dateStr = date.toDateString();
    const recordsToDelete = this.attendance().filter(a =>
      a.subject_id === subjectId && new Date(a.date).toDateString() === dateStr
    );
    
    for (const record of recordsToDelete) {
      if (record._docId) {
        await this.deleteDoc_('attendance', record._docId);
      }
    }
    
    this.attendance.update(a => a.filter(x => !(x.subject_id === subjectId && new Date(x.date).toDateString() === dateStr)));
  }

  // ── Reset all attendance statistics ──
  async resetAllAttendance() {
    const recordsToDelete = this.attendance();
    
    for (const record of recordsToDelete) {
      if (record._docId) {
        await this.deleteDoc_('attendance', record._docId);
      }
    }
    
    this.attendance.set([]);
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

  // ── Registration Requests ─────────────────────────────────
  async loadRegistrationRequests() {
    try { this.registrationRequests.set(await this.getAll<RegistrationRequest>('registration_requests')); }
    catch (e) { console.error(e); throw e; }
  }

  async addRegistrationRequest(req: RegistrationRequest) {
    const saved = await this.addDoc_('registration_requests', req);
    this.registrationRequests.update(r => [...r, saved]);
    return saved;
  }

  async updateRegistrationRequest(req: RegistrationRequest) {
    const docId = (req as any)._docId;
    if (!docId) throw new Error('RegistrationRequest _docId missing');
    await this.updateDoc_('registration_requests', docId, req);
    this.registrationRequests.update(r => r.map(x => (x as any)._docId === docId ? { ...req, _docId: docId } as any : x));
    return req;
  }

  async deleteRegistrationRequest(req: RegistrationRequest) {
    const docId = (req as any)._docId;
    if (!docId) throw new Error('RegistrationRequest _docId missing');
    await this.deleteDoc_('registration_requests', docId);
    this.registrationRequests.update(r => r.filter(x => (x as any)._docId !== docId));
  }
}

