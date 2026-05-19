import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

const PUBLIC_KEY  = '7pqWFo1iKMfA4WlwZ';
const SERVICE_ID  = 'service_bww4jxk';
const TEMPLATE_ID = 'template_auu8plr';

@Injectable({ providedIn: 'root' })
export class EmailService {

  constructor() {
    emailjs.init(PUBLIC_KEY);
  }

  async sendApprovalEmail(params: {
    to_email:  string;
    full_name: string;
    email:     string;
    password:  string;
    role:      string;
    login_url: string;
  }): Promise<void> {
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
      console.log(`Approval email sent to ${params.to_email}`);
    } catch (err) {
      // Log but don't throw — a failed email should not block account creation
      console.error('Failed to send approval email:', err);
    }
  }
}
