import { Component, ViewChild, ElementRef, signal, inject, computed, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { AttendanceNotifyService } from '../../services/attendance-notify.service';
import { LucideAngularModule, Camera, CheckCircle, AlertCircle, XCircle, Upload } from 'lucide-angular';
import { BrowserQRCodeReader } from '@zxing/library';
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
  templateUrl: './qr-code-scanner.component.html',
  styleUrls: ['./qr-code-scanner.component.css']
})
export class QrCodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private notifyService = inject(AttendanceNotifyService);
  private cdr = inject(ChangeDetectorRef);

  readonly CameraIcon = Camera;
  readonly CheckIcon = CheckCircle;
  readonly AlertIcon = AlertCircle;
  readonly ErrorIcon = XCircle;
  readonly UploadIcon = Upload;

  codeReader?: BrowserQRCodeReader;
  cameraStarted = signal(false);
  scanning = signal(false);
  lastScan = signal<ScanResult | null>(null);

  currentUser = this.authService.currentUser;

  scanHistory = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const student = this.dataService.students().find(s => s.user_id === user.user_id);
    if (!student) return [];
    const today = new Date().toDateString();
    const attendance = this.dataService.attendance().filter(a => {
      return a.student_id === student.student_id && new Date(a.date).toDateString() === today;
    });
    return attendance.map(a => ({
      ...a,
      subject_name: this.dataService.subjects().find(s => s.subject_id === a.subject_id)?.subject_name || 'Unknown'
    }));
  });

  ngOnInit() {
    this.codeReader = new BrowserQRCodeReader();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.cameraStarted.set(true);
      this.scanning.set(true);
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!this.videoElement?.nativeElement || !this.codeReader) {
        throw new Error('Camera element not ready');
      }

      await navigator.mediaDevices.getUserMedia({ video: true });

      this.codeReader
        .decodeFromVideoDevice(null, this.videoElement.nativeElement, async (result, err) => {
          if (result) {
            this.scanning.set(false);
            await this.processQRCode(result.getText());
          }
        })
        .catch(err => {
          console.error('Scanner error:', err);
          this.scanning.set(false);
        });
    } catch (error: any) {
      console.error('Camera error:', error);
      this.cameraStarted.set(false);
      this.scanning.set(false);
      const msg = error?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Failed to start camera. Please check your device.';
      await Swal.fire('Camera Error', msg, 'error');
    }
  }

  async onFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(url);
      URL.revokeObjectURL(url);
      await this.processQRCode(result.getText());
    } catch {
      await Swal.fire('Invalid Image', 'Could not find a valid QR code in the uploaded image.', 'error');
    }
    (event.target as HTMLInputElement).value = '';
  }

  stopCamera() {
    try {
      if (this.codeReader) this.codeReader.reset();
      if (this.videoElement?.nativeElement) this.videoElement.nativeElement.srcObject = null;
      this.cameraStarted.set(false);
      this.scanning.set(false);
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
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
      const expiryTs = parts[1] ? parseInt(parts[1]) : null;

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

      const user = this.currentUser();
      const student = this.dataService.students().find(s => s.user_id === user?.user_id);
      if (!student) throw new Error('Student not found');

      const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
      if (!subject) throw new Error('Subject not found');

      const alreadyMarked = this.dataService.attendance().some(a =>
        a.student_id === student.student_id &&
        a.subject_id === subjectId &&
        new Date(a.date).toDateString() === new Date().toDateString()
      );

      if (alreadyMarked) {
        this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'duplicate' });
        setTimeout(() => { if (this.cameraStarted()) this.scanning.set(true); }, 2000);
        return;
      }

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

      const success = await this.dataService.addAttendance(attendanceRecord);

      if (!success) {
        this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'duplicate' });
      } else {
        this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'success' });
        await this.notifyService.notify(student.student_id, subjectId, 'Present');
      }

      setTimeout(() => { if (this.cameraStarted()) this.scanning.set(true); }, 3000);

    } catch (error) {
      console.error('QR processing error:', error);
      this.lastScan.set({ sessionId: '', timestamp: new Date(), status: 'error' });
      await Swal.fire('Error', 'Failed to mark attendance. Please try again.', 'error');
    }
  }

  onVidePlay() {
    this.scanning.set(true);
  }
}
