import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  dataService = inject(DataService);
  
  filterSubject = '';
  dateRange = '30';

  subjects = this.dataService.subjects;

  filteredRecords = computed(() => {
    let records = this.dataService.attendance();
    
    if (this.filterSubject) {
      records = records.filter(r => r.subject_id === this.filterSubject);
    }

    const daysAgo = parseInt(this.dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    records = records.filter(r => new Date(r.date) >= cutoffDate);

    return records;
  });

  statusStats = computed(() => {
    const records = this.filteredRecords();
    const total = records.length || 1;

    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const excused = records.filter(r => r.status === 'Excused').length;

    return [
      { label: 'Present', value: present, percentage: Math.round((present / total) * 100), color: '#10b981' },
      { label: 'Late', value: late, percentage: Math.round((late / total) * 100), color: '#f59e0b' },
      { label: 'Absent', value: absent, percentage: Math.round((absent / total) * 100), color: '#ef4444' },
      { label: 'Excused', value: excused, percentage: Math.round((excused / total) * 100), color: '#3b82f6' }
    ];
  });
}
