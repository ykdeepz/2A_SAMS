import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Attendance } from '../../models/user.model';
import { LucideAngularModule, ClipboardList, QrCode, Pencil, Trash2, X, Save } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-attendance-records',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './attendance-records.component.html',
  styleUrls: ['./attendance-records.component.css']
})
export class AttendanceRecordsComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);

  readonly ClipboardList = ClipboardList;
  readonly QrCode = QrCode;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Save = Save;

  filterSubject = '';
  filterStatus = '';
  searchTerm = '';

  // Edit modal state
  editingRecord = signal<Attendance | null>(null);
  editStatus = signal<'Present' | 'Late' | 'Absent' | 'Excused'>('Present');
  editSaving = signal(false);

  canEdit = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'instructor';
  });

  subjects = computed(() => {
    const user = this.authService.currentUser();
    const all = this.dataService.subjects();
    if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      return instructor ? all.filter(s => s.instructor_id === instructor.instructor_id) : [];
    }
    if (user?.role === 'student') {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (!student) return [];
      const enrolledIds = this.dataService.enrollments().filter(e => e.student_id === student.student_id).map(e => e.subject_id);
      return all.filter(s => enrolledIds.includes(s.subject_id));
    }
    if (user?.role === 'parent') {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (!parent) return [];
      const enrolledIds = this.dataService.enrollments().filter(e => e.student_id === parent.student_id).map(e => e.subject_id);
      return all.filter(s => enrolledIds.includes(s.subject_id));
    }
    return all;
  });

  filteredRecords = computed(() => {
    let records = this.dataService.attendance();
    const user = this.authService.currentUser();

    if (user?.role === 'student') {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (student) records = records.filter(r => r.student_id === student.student_id);
    } else if (user?.role === 'parent') {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (parent) records = records.filter(r => r.student_id === parent.student_id);
    } else if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) records = records.filter(r => r.instructor_id === instructor.instructor_id);
    }

    if (this.filterSubject) records = records.filter(r => r.subject_id === this.filterSubject);
    if (this.filterStatus) records = records.filter(r => r.status === this.filterStatus);
    if (this.searchTerm) records = records.filter(r =>
      r.student_name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  // ── Edit ──────────────────────────────────────────────────
  openEdit(record: Attendance) {
    this.editingRecord.set(record);
    this.editStatus.set(record.status);
  }

  closeEdit() {
    this.editingRecord.set(null);
  }

  async saveEdit() {
    const record = this.editingRecord();
    if (!record) return;

    this.editSaving.set(true);
    try {
      await this.dataService.updateAttendance({ ...record, status: this.editStatus() });
      this.closeEdit();
      await Swal.fire({ title: 'Updated!', text: 'Attendance record updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch {
      await Swal.fire({ title: 'Error!', text: 'Failed to update record.', icon: 'error' });
    } finally {
      this.editSaving.set(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────
  async deleteRecord(record: Attendance) {
    const result = await Swal.fire({
      title: 'Delete Record?',
      html: `Delete attendance for <strong>${record.student_name}</strong> on ${this.formatDate(record.date)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await this.dataService.deleteAttendance(record.attendance_id);
      await Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch {
      await Swal.fire({ title: 'Error!', text: 'Failed to delete record.', icon: 'error' });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'Present': 'bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium',
      'Late': 'bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-sm font-medium',
      'Absent': 'bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium',
      'Excused': 'bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-medium'
    };
    return classes[status] || '';
  }
}
