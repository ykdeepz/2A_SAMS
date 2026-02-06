import { Component } from '@angular/core';
import { LoginComponent } from './components/auth/login/login';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [LoginComponent],
  template: `<app-login></app-login>`,
	styleUrls: ['./app.css']
})
export class App {
	title(): string {
		return 'SAMS';
	}
}
