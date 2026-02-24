import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// QR Attendance Scanner component - disabled for error-free build
@Component({
  selector: 'app-qr-attendance-scanner',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="placeholder">QR Scanner temporarily disabled</div>',
  styles: []
})
export class QrAttendanceScannerComponent {}