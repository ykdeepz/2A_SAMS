# Skwela — Student Attendance System

Angular 21 + Firebase web app for managing student attendance via QR code or manual entry.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signals) |
| Backend / DB | Firebase Firestore |
| Auth | Firebase Authentication |
| UI | Tailwind CSS, Lucide Angular |
| QR | qrcode (generate), @zxing/library (scan) |
| Export | ExcelJS |
| Alerts | SweetAlert2 |

---

## Roles

| Role | Description |
|---|---|
| `admin` | Full access. Approves registration requests, manages all accounts, subjects, and data. |
| `instructor` | Manages their own subjects, enrolls students, takes attendance (manual or QR). |
| `student` | Views their own subjects and attendance records. Scans QR codes to mark themselves present. |
| `parent` | Views their linked child's attendance records. |

---

## Project Structure

```
src/app/
├── firebase.config.ts          # Firebase app + secondaryApp for account creation
├── models/user.model.ts        # All TypeScript interfaces
├── services/
│   ├── auth.service.ts         # Firebase Auth login/logout/session restore
│   ├── data.service.ts         # All Firestore reads/writes, in-memory signals
│   └── role.service.ts         # Role-based computed helpers (isAdmin, isInstructor, etc.)
├── guards/
│   └── auth.guard.ts           # authGuard + roleGuard
├── pages/
│   ├── login/                  # Login + registration request form
│   ├── dashboard/              # Summary stats
│   ├── subjects/               # Subject list + create
│   ├── subject-detail/         # Enrolled students + attendance records per subject
│   ├── take-attendance/        # Manual entry + QR generator (instructor) / QR scanner (student)
│   │   ├── qr-code-generator.component.ts
│   │   └── qr-code-scanner.component.ts
│   ├── attendance-records/     # Filterable attendance history (role-scoped)
│   ├── reports/                # Attendance stats + Excel export
│   ├── accounts/               # Admin: view/edit/delete all user accounts
│   ├── create-account/         # Admin: approve/deny registration requests
│   └── settings/               # User profile / password change
└── layout/                     # Shell with sidebar nav
```

---

## Data Models

### User
```ts
{
  user_id: string;       // = Firebase Auth UID (used as Firestore doc ID)
  email: string;
  role: 'admin' | 'instructor' | 'student' | 'parent';
  first_name, middle_name?, last_name, full_name: string;
  created_at: string;
}
```

### Student
```ts
{
  student_id: string;
  full_name: string;
  email: string;
  grade_level: string;
  section: string;
  qr_code_data: string;
  instructor_id: string;
  user_id: string;        // links to User
  created_at: string;
}
```

### Instructor
```ts
{
  instructor_id: string;
  full_name: string;
  email, phone, department: string;
  user_id: string;
  created_at: string;
}
```

### Parent
```ts
{
  parent_id: string;
  full_name: string;
  email, phone: string;
  student_id: string;     // linked child
  user_id: string;
  created_at: string;
}
```

### Subject
```ts
{
  subject_id: string;
  subject_name: string;
  subject_code: string;
  instructor_id: string;
  grade_level: string;
  section: string;
  schedule: string;
}
```

### SubjectEnrollment
```ts
{
  enrollment_id: string;
  subject_id: string;
  student_id: string;
  enrolled_date: Date;    // stored as ISO string in Firestore
}
```

### Attendance
```ts
{
  attendance_id: string;
  student_id: string;
  student_name: string;
  instructor_id: string;
  subject_id: string;
  subject_name: string;
  date: Date;             // stored as ISO string in Firestore
  time: string;
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  method: 'QR' | 'Manual';
}
```

### RegistrationRequest
```ts
{
  request_id: string;
  type: 'instructor' | 'student';
  status: 'pending' | 'approved' | 'denied';
  submitted_at: string;
  // instructor fields: instructor_id, department, phone
  // student fields: student_id, grade_level, section
  // parent fields: parent_first_name, parent_email, parent_phone, etc.
}
```

---

## Key Flows

### Registration & Account Approval

1. Anyone can submit a registration request from the login page (no auth required).
2. The request is written to `registration_requests` with `status: 'pending'`.
3. Admin logs in, goes to **Account Requests**, and approves or denies.
4. On approval, a Firebase Auth account is created via `secondaryAuth` (isolated from the admin's session — see [Secondary App](#secondary-firebase-app)), then Firestore documents are written for `users`, `instructors`/`students`/`parents`.
5. On failure mid-way, the Auth account is deleted (rollback) so no orphaned accounts are left.
6. Default passwords: `instructor123`, `student123`, `parent123`. Users should change these on first login.

### Secondary Firebase App

`firebase.config.ts` exports two Firebase app instances:

- `app` / `auth` — primary, used for the logged-in session
- `secondaryApp` / `secondaryAuth` — used exclusively for `createUserWithEmailAndPassword` during account approval

This prevents `createUserWithEmailAndPassword` from replacing the admin's active session. After grabbing the new UID, `signOut(secondaryAuth)` is called immediately.

### Taking Attendance

**Instructor flow:**
1. Select a subject from the grid.
2. Choose **Manual Entry** or **Generate QR**.
3. Manual: mark each enrolled student's status from a dropdown, or type a student ID.
4. QR: click Generate — a QR code is produced encoding `ATTEND:<subjectId>:<expiryTimestamp>`. Students scan it within the session window.

**Student flow:**
1. Navigate to Take Attendance — goes straight to the QR scanner.
2. Use camera or upload a QR image.
3. Scanner validates the `ATTEND:` prefix and expiry timestamp, then calls `addAttendance()`.
4. `addAttendance()` returns `false` if already marked today (duplicate guard) — shown as "Already Marked" instead of success.

### QR Code Format

```
ATTEND:<subjectId>:<expiryTimestamp>
```

Example: `ATTEND:SUB001:1746789600000`

The expiry timestamp is a Unix millisecond value. The scanner checks `Date.now() > expiryTs` and rejects expired codes.

### Reports & Excel Export

- Filterable by subject, date range, and status.
- Summary stats: Present / Late / Absent / Excused counts and percentages.
- Excel export via ExcelJS — one row per student per subject, with columns: Student, Subject, Days Conducted, Present, Late, Absent, Excused, Attendance %.
- `daysConducted` is derived from the full class record set (not per-student), so absent students get the correct denominator.
- Export respects the active subject filter.

---

## Firestore Rules Summary

```
users              read: own doc (by UID or user_id field) or admin
                   create: any authenticated user
                   update: own doc or admin
                   delete: admin only

departments        read: public
                   write: admin only

registration_requests
                   create: public (unauthenticated allowed)
                   read/update/delete: admin only

instructors        read: any authenticated
students           read: any authenticated
parents            read: any authenticated
                   create: any authenticated
                   update/delete: admin only

subjects           read: any authenticated
                   create: admin or instructor
                   update/delete: admin, or instructor who owns the subject

enrollments        read: any authenticated
                   create: admin or instructor
                   delete: admin, instructor, or the enrolled student
                   update: admin or instructor

attendance         read: any authenticated
                   create: admin, instructor, or student (own records only)
                   update/delete: admin or instructor
```

> `callerProfile()` in rules uses `get(/databases/.../users/$(request.auth.uid))` — this works because all new accounts use `setDoc` with the Auth UID as the Firestore document ID.

---

## DataService Notes

- All Firestore collections are loaded into Angular signals after auth is confirmed (`onAuthStateChanged`).
- `departments` loads immediately (public read). Everything else waits for a signed-in user.
- `registration_requests` loads only for admins — permission-denied errors for other roles are silently ignored.
- Dates (`date`, `enrolled_date`) are stored as ISO strings in Firestore and converted back to `Date` objects on load using `.toDate()` for Firestore Timestamps or `new Date()` for ISO strings.
- `addUser` uses `setDoc` with the Auth UID as the document ID so Firestore rules can look up the caller's profile by doc ID.
- One-time migration (`migrateUserDocIds`) runs on first admin login to fix any legacy user docs that were created with random `addDoc` IDs. Guarded by a `localStorage` flag so it only runs once per browser.

---

## Bug Fixes Log

### Session 1

| # | File | Issue | Fix |
|---|---|---|---|
| 1 | data.service.ts | `deleteStudent` updated signal before collecting docs — Firestore enrollment/attendance records never deleted | Collect docs first, delete from Firestore, then update signal |
| 2 | data.service.ts | `deleteInstructor` same signal-before-collect bug | Same fix |
| 3 | accounts.component.ts | Double-delete crash: manual `deleteParent` + `deleteUser` called before `deleteStudent`, which already cascades | Removed redundant manual parent deletion |
| 4 | app.routes.ts | `/account-requests` allowed `['admin', 'instructor']` — instructors could approve accounts | Restricted to `['admin']` only |
| 5 | create-account.component.ts | No rollback if Firestore write failed after Auth account created — orphaned Auth accounts | Added try/catch rollback that deletes the Auth account on failure |
| 6 | firebase.config.ts + create-account.component.ts | `createUserWithEmailAndPassword` on primary auth replaced admin's session — all subsequent Firestore writes rejected | Introduced `secondaryApp`/`secondaryAuth` for account creation |
| 7 | data.service.ts | `loadAllData()` called in constructor before auth restored — all reads fired unauthenticated | Moved to `onAuthStateChanged` callback |
| 8 | data.service.ts | `registration_requests` still loaded unauthenticated on startup | Moved into auth-gated `loadAllData()` |
| 9 | data.service.ts | Any permission-denied set `loadError = true` — "Failed to connect" shown to all non-admin users | Permission-denied errors silently ignored; only network/config failures set `loadError` |
| 10 | layout.component.ts | "Account Requests" sidebar item still visible to instructors | Restricted to admin role |
| 11 | data.service.ts + Firestore rules | Non-admin users couldn't read their own profile — `addDoc` random doc ID never matched Auth UID in rules | `addUser` switched to `setDoc` with Auth UID as doc ID; rules updated with `user_id` field fallback |
| 12 | data.service.ts | Existing accounts had random Firestore doc IDs — `callerProfile()` in rules returned null | One-time `migrateUserDocIds()` migration on admin login; guarded by `localStorage` flag |
| 13 | subjects.component.ts | "Failed to create subject" for instructors — same root cause as #11 | Resolved by migration (#12) + updated rules; improved error surfacing |
| 14 | take-attendance.component.ts | `clearAllMarks` only cleared memory, not Firestore — marks reappeared on reload | Changed to use `dataService.clearAttendanceForDay()` |
| 15 | take-attendance.component.ts | `instructorSubjects` fell back to all subjects if instructor profile not yet loaded | Returns `[]` instead of all subjects |
| 16 | subject-detail.component.ts | `enrollStudent` had no `await` — success toast fired even on Firestore failure | Added proper async/await + error handling |
| 17 | subject-detail.component.ts | `unenroll` had no `await` — same issue | Same fix |
| 18 | reports.component.ts | Excel export: `daysConducted` counted per-student records — absent students showed inflated attendance % | Derived `daysConducted` from full class record set |
| 19 | reports.component.ts | Excel export ignored active subject filter | Applied subject filter to export |
| 20 | reports.component.ts | `statusStats` divide-by-zero guard was unclear | Replaced with explicit early return when `total === 0` |

### Session 2

| # | File | Issue | Fix |
|---|---|---|---|
| 21 | data.service.ts | `loadEnrollments` didn't convert Firestore Timestamps — `enrolled_date` showed "Invalid Date" | Added `.toDate()` conversion on load, mirroring `loadAttendance` |
| 22 | data.service.ts | `enrollStudent` saved raw `Date` — came back as unconverted Timestamp on reload | Save as ISO string, convert back to `Date` in memory |
| 23 | qr-code-scanner.component.ts | Upload QR ignored `addAttendance` return value — duplicates showed as success | Check return value; set `status: 'duplicate'` and return early if `false` |

---

## Running Locally

```bash
npm install
npm run start
```

App runs at `http://localhost:4200`.

Requires a Firebase project with Firestore and Authentication (Email/Password) enabled. Firebase config is in `src/app/firebase.config.ts`.
