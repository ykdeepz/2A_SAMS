// src/app/core/services/grade.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Grade, GradeStats } from '../models/grade.model';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private grades = new BehaviorSubject<Grade[]>([]);
  public grades$ = this.grades.asObservable();

  constructor(private mockDataService: MockDataService) {
    this.grades.next(this.mockDataService.mockGrades);
  }

  // Get all grades
  getAllGrades(): Observable<Grade[]> {
    return of(this.grades.value).pipe(delay(300));
  }

  // Get grades by student
  getGradesByStudent(studentId: string): Observable<Grade[]> {
    const grades = this.mockDataService.getGradesByStudent(studentId);
    return of(grades).pipe(delay(300));
  }

  // Get grades by subject
  getGradesBySubject(subjectId: string): Observable<Grade[]> {
    const grades = this.mockDataService.getGradesBySubject(subjectId);
    return of(grades).pipe(delay(300));
  }

  // Get student grades in specific subject
  getGradesInSubject(studentId: string, subjectId: string): Observable<Grade[]> {
    const grades = this.mockDataService.getStudentGradesInSubject(studentId, subjectId);
    return of(grades).pipe(delay(300));
  }

  // Get grade statistics for student in subject
  getGradeStats(studentId: string, subjectId: string): Observable<GradeStats | null> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const grades = this.mockDataService.getStudentGradesInSubject(studentId, subjectId);
        if (grades.length === 0) return null;

        const subject = this.mockDataService.mockSubjects.find(s => s.id === subjectId);
        const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
        const maxScore = grades.reduce((sum, g) => sum + g.totalScore, 0);
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        const letterGrade = this.calculateLetterGrade(percentage);

        return {
          subjectId,
          subjectName: subject?.name || 'Unknown',
          currentScore: totalScore,
          totalScore: maxScore,
          average: Math.round(percentage),
          letterGrade
        };
      })
    );
  }

  // Get all grade statistics for a student
  getAllGradeStats(studentId: string): Observable<GradeStats[]> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const subjects = this.mockDataService.mockSubjects.filter(s =>
          s.enrolledStudents.includes(studentId)
        );

        return subjects.map(subject => {
          const grades = this.mockDataService.getStudentGradesInSubject(studentId, subject.id);
          const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
          const maxScore = grades.reduce((sum, g) => sum + g.totalScore, 0);
          const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

          return {
            subjectId: subject.id,
            subjectName: subject.name,
            currentScore: totalScore,
            totalScore: maxScore,
            average: Math.round(percentage),
            letterGrade: this.calculateLetterGrade(percentage)
          };
        });
      })
    );
  }

  // Add grade
  addGrade(grade: Grade): Observable<Grade> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentGrades = this.grades.value;
        currentGrades.push(grade);
        this.grades.next([...currentGrades]);
        return grade;
      })
    );
  }

  // Update grade
  updateGrade(gradeId: string, updates: Partial<Grade>): Observable<Grade | null> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentGrades = this.grades.value;
        const index = currentGrades.findIndex(g => g.id === gradeId);
        
        if (index !== -1) {
          currentGrades[index] = { ...currentGrades[index], ...updates };
          this.grades.next([...currentGrades]);
          return currentGrades[index];
        }
        return null;
      })
    );
  }

  // Delete grade
  deleteGrade(gradeId: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentGrades = this.grades.value;
        const index = currentGrades.findIndex(g => g.id === gradeId);
        
        if (index !== -1) {
          currentGrades.splice(index, 1);
          this.grades.next([...currentGrades]);
          return true;
        }
        return false;
      })
    );
  }

  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}
