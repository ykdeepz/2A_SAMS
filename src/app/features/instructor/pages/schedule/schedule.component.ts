import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { SubjectService } from '../../../../core/services/subject.service';
import { User } from '../../../../core/models/user.model';
import { Subject } from '../../../../core/models/subject.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  currentUser: User | null = null;
  subjects: Subject[] = [];
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  scheduleGrid: Map<string, Subject[]> = new Map();

  constructor(
    private authService: AuthService,
    private subjectService: SubjectService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSubjectsAndBuildSchedule();
  }

  loadSubjectsAndBuildSchedule(): void {
    if (this.currentUser) {
      this.subjectService.getInstructorSubjects(this.currentUser.id).subscribe(
        (subjects: Subject[]) => {
          this.subjects = subjects;
          this.buildScheduleGrid();
        },
        (error: any) => console.error('Error loading subjects:', error)
      );
    }
  }

  buildScheduleGrid(): void {
    this.weekDays.forEach(day => {
      const daySubjects = this.subjects.filter(s => s.schedule.includes(day));
      this.scheduleGrid.set(day, daySubjects);
    });
  }

  getSubjectsForDay(day: string): Subject[] {
    return this.scheduleGrid.get(day) || [];
  }

  extractTime(schedule: string): string {
    const match = schedule.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    return match ? match[1] : 'Time TBA';
  }

  getSubjectColor(subject: Subject): string {
    const colors: { [key: string]: string } = {
      'blue': '#3b82f6',
      'purple': '#8b5cf6',
      'green': '#10b981',
      'red': '#ef4444',
      'yellow': '#f59e0b'
    };
    return colors[subject.color] || '#667eea';
  }

  goBack(): void {
    this.location.back();
  }
}
