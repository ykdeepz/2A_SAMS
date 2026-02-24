// src/app/core/models/grade.model.ts

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  assignmentName: string;
  score: number;
  totalScore: number;
  percentage: number;
  dueDate: Date;
  submittedDate?: Date;
}

export interface GradeStats {
  subjectId: string;
  subjectName: string;
  currentScore: number;
  totalScore: number;
  average: number;
  letterGrade: string;
}
