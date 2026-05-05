import { Component, signal, inject, computed, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, QrCode, Copy, Download, X, Users } from 'lucide-angular';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './qr-code-generator.component.html',
  styleUrls: ['./qr-code-generator.component.css']
})
export class QrCodeGeneratorComponent implements OnInit, OnDestroy {
  @Input() subjectId = '';

  private dataService = inject(DataService);
  private authService = inject(AuthService);

  readonly QrCodeIcon = QrCode;
  readonly Copy = Copy;
  readonly Download = Download;
  readonly X = X;
  readonly UsersIcon = Users;

  sessionDuration = 5;
  qrCodeImage = signal<string | null>(null);
  sessionId = signal<string>('');
  sessionExpiryTime = signal<Date>(new Date());
  generatingQR = signal(false);
  sessionLog = { start: null as Date | null, end: null as Date | null };

  private unsubscribe?: () => void;

  subjectLabel = computed(() => {
    const subject = this.dataService.subjects().find(s => s.subject_id === this.subjectId);
    if (!subject) return '';
    return `${subject.subject_name} (${subject.subject_code}) — Grade ${subject.grade_level} ${subject.section}`;
  });

  liveScans = computed(() => {
    const sid = this.sessionId();
    if (!sid) return [];
    return this.dataService.attendance().filter(a =>
      a.subject_id === this.subjectId &&
      new Date(a.date).toDateString() === new Date().toDateString()
    );
  });

  // Returns a CSS class name (not a Tailwind class)
  sessionStateColorClass(): string {
    if (!this.qrCodeImage()) return 'dot-inactive';
    const msLeft = this.sessionExpiryTime().getTime() - Date.now();
    if (msLeft > 5 * 60 * 1000) return 'dot-active';
    if (msLeft > 0) return 'dot-ending';
    return 'dot-expired';
  }

  sessionStateLabel(): string {
    if (!this.qrCodeImage()) return 'Inactive';
    const msLeft = this.sessionExpiryTime().getTime() - Date.now();
    if (msLeft > 5 * 60 * 1000) return 'Active';
    if (msLeft > 0) return 'Ending Soon';
    return 'Expired';
  }

  async regenerateQR() {
    this.stopSession();
    await this.generateQRCode();
  }

  ngOnInit() {
    this.unsubscribe = onSnapshot(collection(db, 'attendance'), (snap) => {
      const records = snap.docs.map(d => ({ ...d.data(), _docId: d.id })) as any[];
      this.dataService.attendance.set(records);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  async generateQRCode() {
    if (!this.subjectId || !this.sessionDuration) {
      await Swal.fire('Error', 'No subject selected or session duration missing', 'error');
      return;
    }
    this.generatingQR.set(true);
    try {
      this.sessionId.set(`ATT_${this.subjectId}_${Date.now()}`);
      const now = new Date();
      const expiryTime = new Date(now);
      expiryTime.setMinutes(expiryTime.getMinutes() + Number(this.sessionDuration));
      this.sessionExpiryTime.set(expiryTime);
      this.sessionLog.start = now;
      this.sessionLog.end = expiryTime;

      // @ts-ignore
      const QRCode = (await import('qrcode')).default;
      const qrData = `ATTEND:${this.subjectId}:${expiryTime.getTime()}`;
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 400, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      this.qrCodeImage.set(dataUrl);
      await Swal.fire({ title: 'QR Code Generated!', html: 'Share this QR code with students to scan.', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (error) {
      await Swal.fire('Error', `Failed to generate QR code: ${error instanceof Error ? error.message : error}`, 'error');
    } finally {
      this.generatingQR.set(false);
    }
  }

  async downloadQR() {
    const image = this.qrCodeImage();
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `attendance-${this.subjectId}.png`;
    link.click();
    await Swal.fire({ title: 'Downloaded!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async copyQRToClipboard() {
    const image = this.qrCodeImage();
    if (!image) return;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (blob && navigator.clipboard) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          }
        });
      };
      img.src = image;
      await Swal.fire({ title: 'Copied!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  stopSession() {
    this.qrCodeImage.set(null);
    this.sessionId.set('');
  }
}
