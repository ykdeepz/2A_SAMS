import { Component, signal, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Camera, CheckCircle, AlertCircle, XCircle, Upload } from 'lucide-angular';
import jsQR from 'jsqr';
import Swal from 'sweetalert2';

interface ScanResult {
  sessionId: string;
  timestamp: Date;
  status: 'success' | 'error' | 'duplicate';
}

@Component({
  selector: 'app-qr-code-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-slate-800">Mark Attendance via QR Code</h1>
            <p class="text-slate-600 mt-2">Use your camera to scan the QR code and mark yourself present</p>
          </div>
          <lucide-icon [img]="CameraIcon" [size]="48" class="text-amber-600"></lucide-icon>
        </div>

        <!-- Scan buttons -->
        <div class="flex flex-col gap-3">
          <!-- Opens native camera on mobile, file picker on desktop -->
          <label class="w-full flex items-center justify-center gap-2 btn-primary rounded-lg px-6 py-4 font-medium text-lg cursor-pointer">
            <lucide-icon [img]="CameraIcon" [size]="20"></lucide-icon>
            Scan QR Code with Camera
            <input type="file" accept="image/*" capture="environment" class="hidden" (change)="onFileUpload($event)">
          </label>

          <!-- Upload from gallery / file -->
          <label class="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 rounded-lg px-6 py-4 font-medium text-lg cursor-pointer transition-colors">
            <lucide-icon [img]="UploadIcon" [size]="20"></lucide-icon>
            Upload QR Code Image
            <input type="file" accept="image/*" class="hidden" (change)="onFileUpload($event)">
          </label>
        </div>

        <!-- Last Scan Result -->
        @if (lastScan(); as scan) {
          <div [ngClass]="'mt-4 p-4 rounded-lg border-2 ' + getScanStatusClasses(scan.status)">
            <div class="flex items-center gap-3">
              @switch (scan.status) {
                @case ('success') {
                  <lucide-icon [img]="CheckIcon" [size]="24" class="text-green-600"></lucide-icon>
                  <div>
                    <p class="font-bold text-green-800">Attendance Marked!</p>
                    <p class="text-sm text-green-700">Scanned at {{ scan.timestamp | date:'medium' }}</p>
                  </div>
                }
                @case ('duplicate') {
                  <lucide-icon [img]="AlertIcon" [size]="24" class="text-yellow-600"></lucide-icon>
                  <div>
                    <p class="font-bold text-yellow-800">Already Marked</p>
                    <p class="text-sm text-yellow-700">You've already marked attendance for this session</p>
                  </div>
                }
                @case ('error') {
                  <lucide-icon [img]="ErrorIcon" [size]="24" class="text-red-600"></lucide-icon>
                  <div>
                    <p class="font-bold text-red-800">Error</p>
                    <p class="text-sm text-red-700">Failed to process attendance. Please try again.</p>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- Scan History -->
        @if (scanHistory().length > 0) {
          <div class="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 class="font-bold text-slate-800 mb-3">Today's Attendance Records</h3>
            <div class="space-y-2">
              @for (record of scanHistory(); track $index) {
                <div class="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                  <div>
                    <p class="text-sm font-medium text-slate-800">{{ record.subject_name }}</p>
                    <p class="text-xs text-slate-600">{{ record.date | date:'short' }}</p>
                  </div>
                  <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Present</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./qr-code-scanner.component.css']
})
export class QrCodeScannerComponent implements OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  readonly CameraIcon = Camera;
  readonly CheckIcon = CheckCircle;
  readonly AlertIcon = AlertCircle;
  readonly ErrorIcon = XCircle;
  readonly UploadIcon = Upload;

  lastScan = signal<ScanResult | null>(null);
  scannedSessions = signal<Set<string>>(new Set());
  currentUser = this.authService.currentUser;

  scanHistory = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const student = this.dataService.students().find(s => s.user_id === user.user_id);
    if (!student) return [];
    const today = new Date().toDateString();
    const attendance = this.dataService.attendance().filter(a => {
      const attendDate = new Date(a.date).toDateString();
      return a.student_id === student.student_id && attendDate === today;
    });
    return attendance.map(a => ({
      ...a,
      subject_name: this.dataService.subjects().find(s => s.subject_id === a.subject_id)?.subject_name || 'Unknown'
    }));
  });

  ngOnDestroy() {}

  async onFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      // Draw the image onto a canvas, then read pixel data for jsQR
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (!code) {
        await Swal.fire('Invalid Image', 'Could not find a valid QR code in the uploaded image.', 'error');
        (event.target as HTMLInputElement).value = '';
        return;
      }

      await this.processQRCode(code.data);
    } catch (err) {
      console.error('Upload QR error:', err);
      await Swal.fire('Invalid Image', 'Could not read the uploaded image. Please try a clearer photo.', 'error');
    }

    (event.target as HTMLInputElement).value = '';
  }

  async processQRCode(qrData: string) {
    try {
      if (!qrData.startsWith('ATTEND:')) {
        this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'error' });
        await Swal.fire('Invalid QR Code', 'This is not a valid attendance QR code.', 'error');
        return;
      }

      // Format: ATTEND:<subjectId>:<expiryTimestamp>
      const parts = qrData.replace('ATTEND:', '').split(':');
      const subjectId = parts[0];
      const expiryTs = parts[1] ? parseInt(parts[1]) : null;

      // Check expiry
      if (expiryTs && Date.now() > expiryTs) {
        this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'error' });
        await Swal.fire({
          title: 'QR Code Expired',
          text: 'This QR code has already expired. Please ask your instructor to generate a new one.',
          icon: 'warning',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }

      const sessionId = qrData;

      // Check for duplicate scan
      if (this.scannedSessions().has(sessionId)) {
        this.lastScan.set({ sessionId, timestamp: new Date(), status: 'duplicate' });
        return;
      }

      const user = this.currentUser();
      const student = this.dataService.students().find(s => s.user_id === user?.user_id);
      if (!student) throw new Error('Student not found');

      const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
      if (!subject) throw new Error('Subject not found');

      const attendanceRecord = {
        attendance_id: 'ATT' + Date.now(),
        student_id: student.student_id,
        student_name: student.full_name,
        instructor_id: subject.instructor_id,
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        status: 'Present' as const,
        method: 'QR' as const
      };

      const marked = await this.dataService.addAttendance(attendanceRecord);

      if (!marked) {
        // Already marked today (duplicate detected by the service)
        this.lastScan.set({ sessionId, timestamp: new Date(), status: 'duplicate' });
        return;
      }

      this.scannedSessions().add(sessionId);
      this.lastScan.set({ sessionId, timestamp: new Date(), status: 'success' });

      await this.notifyParentAndInstructor(student, subjectId);

    } catch (error: any) {
      console.error('QR processing error:', error);
      this.lastScan.set({ sessionId: '', timestamp: new Date(), status: 'error' });
      const msg = error?.message || error?.code || 'Unknown error';
      await Swal.fire('Error', `Failed to mark attendance: ${msg}`, 'error');
    }
  }

  private async notifyParentAndInstructor(student: any, subjectId: string) {
    try {
      const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
      const instructor = this.dataService.instructors().find(i => i.instructor_id === subject?.instructor_id);

      // Notify instructor
      if (instructor?.user_id) {
        // In a real app, send via email/SMS
        console.log(`Instructor ${instructor?.full_name} notified: ${student.full_name} marked present`);
      }

      // Notify parent(s)
      const parents = this.dataService.parents().filter(p => p.student_id === student.student_id);
      parents.forEach(parent => {
        console.log(`Parent ${parent?.full_name} notified: ${student.full_name} marked present for ${subject?.subject_name}`);
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  getScanStatusClasses(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-300';
      case 'duplicate':
        return 'bg-yellow-50 border-yellow-300';
      case 'error':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-slate-50 border-slate-300';
    }
  }
}
