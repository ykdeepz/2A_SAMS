import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  currentDate = signal(new Date());
  selectedDay = signal<any>(null);

  constructor(private dataService: DataService) {}

  currentMonthYear = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toDateString();
      const attendanceCount = this.dataService.attendance()
        .filter(a => new Date(a.date).toDateString() === dateStr).length;

      days.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        attendanceCount
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  });

  selectedDayRecords = computed(() => {
    const day = this.selectedDay();
    if (!day) return [];
    const dateStr = day.date.toDateString();
    return this.dataService.attendance()
      .filter(a => new Date(a.date).toDateString() === dateStr);
  });

  previousMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  nextMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }

  selectDay(day: any) {
    this.selectedDay.set(day);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'Present': 'status-present',
      'Late': 'status-late',
      'Absent': 'status-absent',
      'Excused': 'status-badge status-excused'
    };
    return classes[status] || '';
  }
}
