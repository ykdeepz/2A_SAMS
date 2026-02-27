# Student Attendance Monitoring System

A comprehensive Angular-based attendance tracking system with role-based access control for Admin, Instructor, Student, and Parent roles.

## ✅ Project Structure

All components now follow proper Angular structure with separate .html, .css, and .ts files:

```
src/app/
├── components/
│   ├── layout/
│   │   ├── layout.component.html
│   │   ├── layout.component.css
│   │   └── layout.component.ts
│   └── login/
│       ├── login.component.html
│       ├── login.component.css
│       └── login.component.ts
├── pages/
│   ├── dashboard/
│   ├── subjects/
│   ├── subject-detail/
│   ├── take-attendance/
│   ├── attendance-records/
│   ├── calendar/
│   ├── create-account/
│   ├── reports/
│   └── settings/
│       (each with .html, .css, .ts files)
├── services/
│   ├── auth.service.ts
│   └── data.service.ts
├── guards/
│   └── auth.guard.ts
└── models/
    └── user.model.ts
```

## Features

- **Role-Based Access Control**: Different dashboards and permissions for Admin, Instructor, Student, and Parent
- **Subject Management**: Create, view, and manage subjects with enrollment tracking
- **QR Code Attendance**: Camera-based QR scanning with manual fallback
- **Attendance Records**: Filterable records with status tracking (Present/Late/Absent/Excused)
- **Calendar View**: Monthly calendar showing attendance events
- **Reports & Analytics**: Visual charts and statistics for attendance trends
- **Account Management**: Admin can create instructor and student accounts
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Angular 21
- **Styling**: Tailwind CSS v3
- **Animations**: Framer Motion (installed)
- **State Management**: Angular Signals

## Getting Started

### Installation

```bash
cd student-attendance-system
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`

### Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

### Demo Accounts

Use any of these emails to login (any password works):

- **Admin**: admin@school.com
- **Instructor**: instructor@school.com
- **Student**: student@school.com
- **Parent**: parent@school.com

## Key Features by Role

### Admin
- Full dashboard with statistics
- Create instructor and student accounts
- Manage all subjects
- View all attendance records
- Access reports and analytics

### Instructor
- Dashboard with class statistics
- Create and manage subjects
- Take attendance via QR or manual entry
- View attendance records for their classes
- Generate reports

### Student
- View their own attendance records
- See enrolled subjects
- Calendar view of attendance
- Profile settings

### Parent
- View their child's attendance records
- Calendar view
- Subject information
- Profile settings

## Styling

The application uses Tailwind CSS with an indigo/slate color scheme:
- Primary: Indigo-600
- Background: Slate-50
- Dark elements: Slate-800
- Status colors: Green (Present), Yellow (Late), Red (Absent), Blue (Excused)

## Data Storage

Currently uses in-memory storage with Angular signals. To persist data, integrate with a backend API by updating the `DataService`.

## License

MIT

