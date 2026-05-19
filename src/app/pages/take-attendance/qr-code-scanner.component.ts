import { Component, signal, inject, computed, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Camera, CheckCircle, AlertCircle, XCircle, Upload, StopCircle } from 'lucide-angular';
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
            <p class="text-slate-600 mt-2">Scan the QR code to mark yourself present</p>
          </div>
          <lucide-icon [img]="CameraIcon" [size]="48" class="text-amber-600"></lucide-icon>
        </div>

        @if (!cameraActive()) {
          <!-- Buttons -->
          <div class="flex flex-col gap-3">
            <button (click)="startCamera()"
              class="w-full flex items-center justify-center gap-2 btn-primary rounded-lg px-6 py-4 font-medium text-lg">
              <lucide-icon [img]="CameraIcon" [size]="20"></lucide-icon>
              Start Camera & Scan
            </button>

            <label class="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 rounded-lg px-6 py-4 font-medium text-lg cursor-pointer transition-colors">
              <lucide-icon [img]="UploadIcon" [size]="20"></lucide-icon>
              Upload QR Code Image
              <input type="file" accept="image/*" class="hidden" (change)="onFileUpload($event)">
            </label>
          </div>
        } @else {
          <!-- Camera modal overlay -->
          <div class="fixed inset-0 z-50 bg-black flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 bg-black/80">
              <p class="text-white font-semibold text-lg">Scan QR Code</p>
              <button (click)="stopCamera()"
                class="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors">
                <lucide-icon [img]="StopIcon" [size]="16"></lucide-icon>
                Close
              </button>
            </div>

            <!-- Video feed fills remaining space -->
            <div class="relative flex-1 overflow-hidden">
              <video #videoEl autoplay playsinline muted
                class="w-full h-full object-cover"></video>
              <!-- Scan guide box -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-64 h-64 border-4 border-amber-400 rounded-2xl opacity-80"></div>
              </div>
              <p class="absolute bottom-6 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-lg">
                Point the QR code inside the box
              </p>
            </div>
          </div>
        }

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
  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly CameraIcon = Camera;
  readonly CheckIcon = CheckCircle;
  readonly AlertIcon = AlertCircle;
  readonly ErrorIcon = XCircle;
  readonly UploadIcon = Upload;
  readonly StopIcon = StopCircle;

  cameraActive = signal(false);
  lastScan = signal<ScanResult | null>(null);
  scannedSessions = signal<Set<string>>(new Set());
  currentUser = this.authService.currentUser;

  private stream: MediaStream | null = null;
  private scanLoop: number | null = null;
  private processing = false;

  scanHistory = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const student = this.dataService.students().find(s => s.user_id === user.user_id);
    if (!student) return [];
    const today = new Date().toDateString();
    return this.dataService.attendance()
      .filter(a => a.student_id === student.student_id && new Date(a.date).toDateString() === today)
      .map(a => ({
        ...a,
        subject_name: this.dataService.subjects().find(s => s.subject_id === a.subject_id)?.subject_name || 'Unknown'
      }));
  });

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      this.cameraActive.set(true);
      this.cdr.detectChanges();

      // Wait for Angular to render the video element
      await new Promise(r => setTimeout(r, 80));

      const video = this.videoEl?.nativeElement;
      if (!video) throw new Error('Video element not ready');

      video.srcObject = this.stream;
      await video.play();

      this.startScanLoop(video);
    } catch (err: any) {
      this.cameraActive.set(false);
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Could not start camera. Try uploading an image instead.';
      await Swal.fire('Camera Error', msg, 'error');
    }
  }

  private startScanLoop(video: HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const tick = () => {
      if (!this.cameraActive() || this.processing) {
        this.scanLoop = requestAnimationFrame(tick);
        return;
      }
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
        if (code) {
          this.processing = true;
          this.processQRCode(code.data).finally(() => {
            // Resume scanning after 2.5s so the result is visible
            setTimeout(() => { this.processing = false; }, 2500);
          });
        }
      }
      this.scanLoop = requestAnimationFrame(tick);
    };

    this.scanLoop = requestAnimationFrame(tick);
  }

  stopCamera() {
    if (this.scanLoop !== null) {
      cancelAnimationFrame(this.scanLoop);
      this.scanLoop = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoEl?.nativeElement) {
      this.videoEl.nativeElement.srcObject = null;
    }
    this.cameraActive.set(false);
    this.processing = false;
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async onFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width  = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
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

      const parts = qrData.replace('ATTEND:', '').split(':');
      const subjectId = parts[0];
      const expiryTs  = parts[1] ? parseInt(parts[1]) : null;

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
      if (this.scannedSessions().has(sessionId)) {
        this.lastScan.set({ sessionId, timestamp: new Date(), status: 'duplicate' });
        return;
      }

      const user    = this.currentUser();
      const student = this.dataService.students().find(s => s.user_id === user?.user_id);
      if (!student) throw new Error('Student not found');

      const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
      if (!subject) throw new Error('Subject not found');

      const attendanceRecord = {
        attendance_id: 'ATT' + Date.now(),
        student_id:    student.student_id,
        student_name:  student.full_name,
        instructor_id: subject.instructor_id,
        subject_id:    subject.subject_id,
        subject_name:  subject.subject_name,
        date:   new Date(),
        time:   new Date().toLocaleTimeString(),
        status: 'Present' as const,
        method: 'QR'     as const
      };

      const marked = await this.dataService.addAttendance(attendanceRecord);
      if (!marked) {
        this.lastScan.set({ sessionId, timestamp: new Date(), status: 'duplicate' });
        this.stopCamera();
        await Swal.fire({
          title: 'Already Marked',
          text: 'You have already marked attendance for this subject today.',
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
          timer: 3000,
          showConfirmButton: true
        });
        return;
      }

      this.scannedSessions().add(sessionId);
      this.lastScan.set({ sessionId, timestamp: new Date(), status: 'success' });
      this.stopCamera();
      await Swal.fire({
        title: 'Attendance Marked!',
        text: `You are marked Present for ${subject.subject_name}.`,
        icon: 'success',
        confirmButtonColor: '#10b981',
        timer: 3000,
        showConfirmButton: true
      });

    } catch (error: any) {
      console.error('QR processing error:', error);
      this.lastScan.set({ sessionId: '', timestamp: new Date(), status: 'error' });
      const msg = error?.message || error?.code || 'Unknown error';
      await Swal.fire('Error', `Failed to mark attendance: ${msg}`, 'error');
    }
  }

  getScanStatusClasses(status: string): string {
    switch (status) {
      case 'success':   return 'bg-green-50 border-green-300';
      case 'duplicate': return 'bg-yellow-50 border-yellow-300';
      case 'error':     return 'bg-red-50 border-red-300';
      default:          return 'bg-slate-50 border-slate-300';
    }
  }
}
