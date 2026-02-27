# Quick Start Guide

## Running the Application

1. **Start the development server:**
   ```bash
   npm start
   ```
   
2. **Open your browser:**
   Navigate to `http://localhost:4200/`

3. **Login with demo accounts:**
   - **Admin**: admin@school.com (any password)
   - **Instructor**: instructor@school.com (any password)
   - **Student**: student@school.com (any password)
   - **Parent**: parent@school.com (any password)

## What You'll See

### Admin Dashboard
- Total students, subjects, attendance rate statistics
- Create new instructor/student accounts
- Manage all subjects
- View all attendance records
- Generate reports

### Instructor Dashboard
- Class statistics
- Create and manage subjects
- Take attendance (QR scan or manual)
- View attendance records for their classes
- Generate reports

### Student View
- Personal attendance records
- Enrolled subjects
- Calendar view
- Profile settings

### Parent View
- Child's attendance records
- Calendar view
- Subject information
- Profile settings

## Key Features to Try

1. **Create a Subject** (Admin/Instructor)
   - Go to Subjects → Create Subject
   - Fill in subject details

2. **Enroll Students** (Admin/Instructor)
   - Go to Subject Detail
   - Click "Enroll Student"
   - Select students from the list

3. **Take Attendance** (Instructor)
   - Go to Take Attendance
   - Select a subject
   - Mark students as Present/Late/Absent/Excused

4. **View Reports** (Admin/Instructor)
   - Go to Reports
   - Filter by subject and date range
   - View attendance statistics and charts

5. **Calendar View** (All roles)
   - Go to Calendar
   - Click on any day to see attendance records

## Project Structure

```
src/app/
├── components/          # Layout and login components
│   ├── layout/         # Main layout with sidebar
│   └── login/          # Login page
├── pages/              # All application pages
│   ├── dashboard/
│   ├── subjects/
│   ├── subject-detail/
│   ├── take-attendance/
│   ├── attendance-records/
│   ├── calendar/
│   ├── create-account/
│   ├── reports/
│   └── settings/
├── services/           # Business logic
│   ├── auth.service.ts
│   └── data.service.ts
├── guards/             # Route protection
│   └── auth.guard.ts
└── models/             # TypeScript interfaces
    └── user.model.ts
```

## Building for Production

```bash
npm run build
```

The build artifacts will be in `dist/student-attendance-system/`

## Notes

- All data is stored in-memory (resets on page refresh)
- To persist data, integrate with a backend API by updating `DataService`
- QR scanner is simulated (use manual entry for testing)
- SSR (Server-Side Rendering) is enabled by default
