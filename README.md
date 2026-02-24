# SAMS - Student Attendance Management System

A complete, modern Angular-based Educational Management System with role-based authentication and comprehensive dashboards for Instructors, Students, Parents, and Admins.

## 🎯 Overview

SAMS is a fully functional educational management platform built with Angular 18, featuring:

- **Role-Based Authentication**: Instructor, Student, Parent, and Admin roles
- **Responsive Design**: Mobile-friendly UI for all devices
- **Modern UI Components**: Clean, intuitive interface using Tailwind CSS and custom components
- **Complete Dashboard System**: Role-specific dashboards with statistics and features
- **Mock Data**: Pre-populated with sample data for testing

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v18)

### Installation

```bash
# Navigate to project directory
cd c:\Users\DELL\Desktop\SAMS-PROJECT\SAMS

# Install dependencies (already done)
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

## 📝 Demo Credentials

### Login Roles Available
- **Instructor**
- **Student**
- **Parent**
- **Admin**

### Test Accounts

#### Instructor
- Email: `sarah.wilson@university.edu`
- Password: `instructor123`
- Name: Dr. Sarah Wilson
- Department: Computer Science

#### Student
- Email: `alice.johnson@university.edu`
- Password: `student123`
- Name: Alice Johnson
- Student ID: 2024-001

#### Parent
- Email: `parent1@email.com`
- Password: `parent123`
- Name: Mary Johnson
- Child: Alice Johnson (2024-001)

#### Admin
- Email: `admin@university.edu`
- Password: `admin123`
- Name: System Administrator

**Note**: Click "Fill Demo Credentials" button on login page to auto-fill any role's credentials.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── student.model.ts
│   │   │   ├── subject.model.ts
│   │   │   ├── attendance.model.ts
│   │   │   └── grade.model.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── student.service.ts
│   │   │   ├── subject.service.ts
│   │   │   ├── attendance.service.ts
│   │   │   ├── grade.service.ts
│   │   │   └── mock-data.service.ts
│   │   └── guards/
│   │       └── auth.guard.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── instructor/
│   │   │   ├── dashboard/
│   │   │   ├── subjects/
│   │   │   ├── subject-detail/
│   │   │   ├── schedule/
│   │   │   └── settings/
│   │   ├── student/
│   │   │   ├── dashboard/
│   │   │   ├── subjects/
│   │   │   ├── attendance/
│   │   │   └── grades/
│   │   ├── parent/
│   │   │   ├── dashboard/
│   │   │   ├── child-attendance/
│   │   │   └── child-grades/
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── users/
│   │       ├── subjects/
│   │       └── reports/
│   └── shared/
│       └── components/
│           └── sidebar/
├── styles.css
└── index.html
```

## 🎨 Features by Role

### Instructor Dashboard
- **Statistics Dashboard**
  - Total Subjects
  - Total Students
  - Average Class Size
  - Active Semester

- **My Subjects**
  - View all assigned subjects
  - Subject codes, names, and schedules
  - Enrolled student count
  - Quick navigation to subject details

- **Recent Attendance Activity**
  - Latest 10 attendance records
  - Student information
  - Status (Present, Late, Absent)
  - Timestamp

- **Navigation Sidebar**
  - Dashboard
  - My Subjects
  - Schedule
  - Settings
  - Logout

### Student Dashboard
- **My Subjects**
  - List of enrolled subjects
  - Subject schedules and information

- **Navigation Options**
  - Dashboard
  - My Subjects
  - Attendance
  - Grades
  - Logout

### Parent Dashboard
- **Child Information**
  - Child's profile
  - Enrolled subjects
  - Academic progress

- **Navigation**
  - Dashboard
  - Child's Attendance
  - Child's Grades
  - Logout

### Admin Dashboard
- **System Management**
  - User management
  - Subject management
  - System reports
  - Dashboard overview

## 🔐 Authentication System

### Login Features
- **Role Selection**: Choose role before login
- **Email/Password Authentication**: Standard login flow
- **Remember Me**: Save email for future logins
- **Demo Credentials**: Quick-fill button for testing
- **Form Validation**: Real-time validation feedback
- **Error Handling**: Clear error messages

### Signup Features
- **Role Selection**: Instructor, Student, or Parent
- **Email Validation**: Unique email checking
- **Password Confirmation**: Verify matching passwords
- **Department Field**: For instructors
- **Terms Agreement**: Checkbox for terms and conditions

### Security
- **Auth Guard**: Protected routes
- **Session Management**: Local storage-based sessions
- **Token Management**: Mock JWT tokens
- **Role-Based Routing**: Redirect based on user role

## 📊 Services

### AuthService
```typescript
- login(credentials): Observable<AuthResponse>
- signup(data): Observable<AuthResponse>
- logout(): void
- getCurrentUser(): User
- isAuthenticated$: Observable<boolean>
```

### SubjectService
```typescript
- getAllSubjects(): Observable<Subject[]>
- getSubjectById(id): Observable<Subject>
- getSubjectsByInstructor(id): Observable<Subject[]>
- getSubjectsByStudent(id): Observable<Subject[]>
- addStudentToSubject(subjectId, studentId): Observable<boolean>
- removeStudentFromSubject(subjectId, studentId): Observable<boolean>
```

### StudentService
```typescript
- getAllStudents(): Observable<Student[]>
- getStudentById(id): Observable<Student>
- getStudentByStudentId(studentId): Observable<Student>
- searchStudents(query): Observable<Student[]>
```

### AttendanceService
```typescript
- markAttendance(studentId, subjectId, status, notes): Observable<AttendanceRecord>
- getAttendanceByStudent(studentId): Observable<AttendanceRecord[]>
- getAttendanceBySubject(subjectId, date): Observable<AttendanceRecord[]>
- checkIfAlreadyMarked(studentId, subjectId, date): Observable<boolean>
- getAttendanceStats(studentId, subjectId): Observable<AttendanceStats>
- getRecentAttendance(limit): Observable<AttendanceRecord[]>
```

### GradeService
```typescript
- getAllGrades(): Observable<Grade[]>
- getGradesByStudent(studentId): Observable<Grade[]>
- getGradesBySubject(subjectId): Observable<Grade[]>
- getGradeStats(studentId, subjectId): Observable<GradeStats>
- getAllGradeStats(studentId): Observable<GradeStats[]>
```

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#3B82F6`
- **Primary Purple**: `#667eea`
- **Secondary Purple**: `#764ba2`
- **Success Green**: `#10B981`
- **Warning Orange**: `#F59E0B`
- **Error Red**: `#EF4444`
- **Neutral Grey**: `#718096`

### Typography
- **Font Family**: System fonts with fallbacks
- **Headings**: Bold (700) weight
- **Body**: Regular (400) weight
- **UI Text**: Medium (600) weight

### Components
- **Cards**: White background, subtle shadows
- **Buttons**: Gradient backgrounds, hover effects
- **Tables**: Responsive grid layout
- **Forms**: Inline validation, clear error messages
- **Sidebar**: Collapsible navigation with icons

## 🌐 Responsive Design

- **Desktop**: Full sidebar + content layout
- **Tablet**: Optimized grid layouts
- **Mobile**: Single column, hamburger menu (sidebar collapsible)

## 📦 Dependencies

Key packages included:
- `@angular/core` - Angular framework
- `@angular/router` - Routing
- `@angular/forms` - Reactive forms
- `@angular/platform-browser` - Browser APIs
- `rxjs` - Reactive programming

## 🔄 State Management

- **RxJS BehaviorSubjects**: For reactive state
- **Observable Streams**: For data flow
- **Services**: Centralized business logic
- **Local Storage**: Session persistence

## 🚀 Available Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Watch mode
npm run watch

# Lint code
npm run lint
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔮 Future Enhancements

- QR Code attendance system
- Real-time notifications
- Email notifications
- Advanced analytics and reporting
- Bulk import/export functionality
- Calendar integration
- Mobile native app (Ionic/React Native)
- Third-party authentication (OAuth)
- Database integration
- API backend connection

## 🤝 Mock Data

The system includes 40+ mock data records:
- 2 Instructors
- 10 Students
- 2 Parents
- 1 Admin
- 4 Subjects
- 100+ Attendance records
- 30+ Grade records

## ⚙️ Configuration

- **Development Server Port**: 4200
- **API Timeout**: 5000ms
- **Session Storage**: localStorage
- **Language**: English (en-US)

## 🎓 Educational Features

- **Subject Management**: Create and manage courses
- **Student Enrollment**: Assign students to courses
- **Attendance Tracking**: Mark and track attendance
- **Grade Management**: Record and view grades
- **Progress Monitoring**: Track academic performance
- **Role-Based Access**: Different features per role

## 📄 License

This project is created for educational purposes.

## 📞 Support

For issues or questions:
1. Check the demo credentials
2. Review component documentation
3. Check browser console for errors
4. Verify all dependencies are installed

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Built with**: Angular 18 + TypeScript + RxJS
