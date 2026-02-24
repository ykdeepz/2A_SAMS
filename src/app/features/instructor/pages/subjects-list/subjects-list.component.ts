import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { SubjectService } from '../../../../core/services/subject.service';
import { StudentService } from '../../../../core/services/student.service';
import { User } from '../../../../core/models/user.model';
import { Subject } from '../../../../core/models/subject.model';
import { Student } from '../../../../core/models/student.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-subjects-list',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './subjects-list.component.html',
  styleUrls: ['./subjects-list.component.css']
})
export class SubjectsListComponent implements OnInit {
  currentUser: User | null = null;
  subjects: Subject[] = [];
  allStudents: Student[] = [];

  constructor(
    private authService: AuthService,
    private subjectService: SubjectService,
    private studentService: StudentService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSubjects();
    this.loadAllStudents();
  }

  loadSubjects(): void {
    if (this.currentUser) {
      this.subjectService.getInstructorSubjects(this.currentUser.id).subscribe(
        (subjects: Subject[]) => {
          this.subjects = subjects;
        },
        (error: any) => console.error('Error loading subjects:', error)
      );
    }
  }

  loadAllStudents(): void {
    this.studentService.getAllStudents().subscribe(
      (students: Student[]) => {
        this.allStudents = students;
      },
      (error: any) => console.error('Error loading students:', error)
    );
  }

  getStudentName(studentId: string): string {
    const student = this.allStudents.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  }

  getSubjectColor(index: number): string {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[index % colors.length];
  }

  goBack(): void {
    this.location.back();
  }
}
