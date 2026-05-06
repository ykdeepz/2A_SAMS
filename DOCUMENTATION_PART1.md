# SAMS — Student Attendance Management System
# Documentation Part 1: Project Overview, Features, Bug Fixes & Cleanup

---

## 1. Project Overview

### What is SAMS?

SAMS (Student Attendance Management System) is a web application built to manage student attendance in a school setting. It is **role-based**, meaning every user sees a different interface and has different permissions depending on who they are. The four roles are:

| Role | What they can do |
|---|---|
| **Admin** | Full access — manage accounts, departments, subjects, attendance records, reports, and approve/deny registration requests |
| **Instructor** | Manage their own subjects, take attendance (manually or via QR code), view attendance records for their students, generate reports |
| **Student** | View their enrolled subjects, scan QR codes to mark their own attendance, view their own attendance history |
| **Parent** | View their linked child's attendance records and receive real-time notifications when attendance is marked |

The application is not just a CRUD app — it enforces these role boundaries at every level: the UI hides menu items that don't apply to a role, route guards block direct URL access, and Firestore security rules enforce the same rules on the database itself.

---

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | Angular 21 (standalone components, no NgModules) |
| **Language** | TypeScript |
| **Database** | Firebase Firestore (NoSQL, real-time capable) |
| **Authentication** | Firebase Authentication |
| **Styling** | Plain CSS with CSS custom properties (migrated away from Tailwind CSS) |
| **Icons** | Lucide Angular |
| **QR generation** | `qrcode` npm package |
| **QR scanning** | `@zxing/library` |
| **Excel export** | `exceljs` (replaced `xlsx`) |
| **Alerts/dialogs** | SweetAlert2 |
| **Calendar** | FullCalendar Angular |

---

### How Data Flows Through the App

Understanding this flow is essential for understanding every component in the project.

```
User action in component
        ↓
  Component calls DataService method (e.g., dataService.addAttendance(...))
        ↓
  DataService writes to Firebase Firestore
        ↓
  DataService updates the in-memory Angular signal immediately
        ↓
  Any component reading that signal re-renders automatically
```

**Angular Signals** are the reactive state system used throughout this project. A signal is like a variable that Angular watches — when its value changes, every template or `computed()` that reads it automatically updates. You never need to manually trigger change detection.

For example, `DataService` declares:

```typescript
attendance = signal<Attendance[]>([]);
```

When `addAttendance()` is called, it writes to Firestore and then calls:

```typescript
this.attendance.update(a => [...a, fixedSaved]);
```

Every component that reads `dataService.attendance()` in its template or in a `computed()` will instantly re-render with the new record — no subscriptions, no `detectChanges()`, no manual refresh needed.

---

## 2. Instructor's Requested Features

These are the features that were built based on direct requests from the instructor supervising the project.

---

### 2a. Dashboard — Remove Clickable Shortcuts

**What was there before:**

The dashboard had a "Quick Actions" section — a grid of clickable cards with `<a routerLink="...">` elements. There were three versions of this panel, one for each role group (admin/instructor, student, parent). Each card was a shortcut to a page like "Take Attendance" or "View Records."

**What was removed:**

All three Quick Actions panels were deleted from `dashboard.component.html`. The entire `<!-- Recent Activity -->` section was also removed — this was a panel showing the last 5 attendance records.

**Why:**

The instructor felt the dashboard was cluttered. Navigation shortcuts are already in the sidebar, so the Quick Actions panel was redundant. The recent attendance panel added noise without adding value.

**What remained:**

The dashboard now shows only two things:
1. A **stats grid** — four cards showing role-appropriate numbers (e.g., total students, attendance rate, absences today)
2. A **calendar** — showing attendance events for the current month

**Code cleanup that followed:**

When the Quick Actions panels were removed, several imports in `dashboard.component.ts` became unused and were deleted:
- `RouterModule` (no longer needed since there are no `routerLink` elements)
- `signal` (was used for the removed panels' state)
- Role-check variables that were only used to conditionally show the panels

This is good practice — dead imports slow down the compiler and confuse anyone reading the code.

---

### 2b. Account Creation Revamp — Sign Up on Login Page

**What was there before:**

Account creation was only accessible from inside the app (after logging in). There was no way for a new instructor or student to request an account on their own — an admin had to create it for them manually.

**What was built:**

A self-service registration flow directly on the login page.

**How it works — step by step:**

**Step 1: The "Request an Account" button**

The login page (`login.component.html`) now has a button at the bottom:

```html
<button (click)="showSignup()" class="signup-trigger-btn">
  <lucide-icon [img]="UserPlus" [size]="18"></lucide-icon>
  Request an Account
</button>
```

**Step 2: The `view` signal controls which card is shown**

In `login.component.ts`, a signal called `view` determines whether the login card or the signup card is rendered:

```typescript
view = signal<'login' | 'signup'>('login');
```

The template uses Angular's `@if` block:

```html
@if (view() === 'login') {
  <!-- login card -->
}
@if (view() === 'signup') {
  <!-- signup card -->
}
```

When the user clicks "Request an Account", `showSignup()` sets `view` to `'signup'`, which swaps the card. The back arrow calls `showLogin()` to swap back. This is a clean, animation-friendly approach — no routing needed, just a signal toggle.

**Step 3: The signup form**

The signup card has two tabs — "Instructor" and "Student" — controlled by a `signupTab` signal. The instructor form collects: Instructor ID, department (loaded from Firestore so the dropdown is always current), first/middle/last name, email, and phone. The student form collects student info plus a full parent/guardian section (name, email, phone).

**Step 4: Submitting the request**

When the user clicks "Submit Request", `submitSignup()` runs. It first validates that all required fields are filled. It also checks for duplicate pending requests by the same email:

```typescript
const existing = this.dataService.registrationRequests().find(
  r => r.email === this.instForm.email && r.status === 'pending'
);
if (existing) {
  this.signupError.set('A pending request with this email already exists.');
  return;
}
```

If validation passes, it builds a `RegistrationRequest` object and writes it to Firestore via `dataService.addRegistrationRequest()`. The `status` field is set to `'pending'`.

**Step 5: Admin sees the pending request**

In the "Account Requests" page (`create-account.component.ts`), there is a "Pending Approvals" tab. A `computed()` signal filters the registration requests:

```typescript
pendingRequests = computed(() =>
  this.dataService.registrationRequests().filter(r => r.status === 'pending')
);
```

Because `registrationRequests` is a signal, the badge count on the tab updates automatically whenever a new request is submitted — no page refresh needed.

**Step 6: Admin approves or denies**

- **Approve:** `approveRequest()` calls `createUserWithEmailAndPassword()` from Firebase Auth to create the actual login account, then writes the profile to Firestore (without a password), then updates the request's `status` to `'approved'`. For student requests, it also creates the parent's Firebase Auth account and Firestore profile.
- **Deny:** `denyRequest()` simply updates the request's `status` to `'denied'`. No account is created.

**The `RegistrationRequest` model** (in `user.model.ts`) holds all the fields needed for both instructor and student requests in one interface, using optional fields for the parts that only apply to one type:

```typescript
export interface RegistrationRequest {
  request_id: string;
  type: 'instructor' | 'student';
  status: 'pending' | 'approved' | 'denied';
  submitted_at: string;
  reviewed_at?: string;
  // Instructor fields
  instructor_id?: string;
  phone?: string;
  department?: string;
  // Student fields
  student_id?: string;
  grade_level?: string;
  section?: string;
  // Parent fields (for student requests)
  parent_first_name?: string;
  parent_email?: string;
  parent_phone?: string;
  // ... shared fields: first_name, last_name, email, full_name
}
```

---

### 2c. Departments — Click Card to See Instructors

**What was there before:**

The Departments page showed a grid of department cards. Each card had an Edit button and a Delete button. That was it — you could manage departments but had no way to see which instructors belonged to each one.

**What was added:**

Clicking anywhere on a department card opens a modal panel showing all instructors assigned to that department.

**How it works:**

Two signals were added to `departments.component.ts`:

```typescript
selectedDepartment = signal<Department | null>(null);

departmentInstructors = computed(() => {
  const dept = this.selectedDepartment();
  if (!dept) return [];
  return this.dataService.instructors().filter(i => i.department === dept.name);
});
```

`selectedDepartment` holds whichever department was clicked. `departmentInstructors` is a `computed()` — it automatically recalculates whenever `selectedDepartment` or `dataService.instructors()` changes. It filters the full instructors list to only those whose `department` field matches the selected department's name.

The card's click handler:

```typescript
openDepartmentDetail(dept: Department) {
  this.selectedDepartment.set(dept);
}
```

**The Edit and Delete buttons use `event.stopPropagation()`:**

This is a critical detail. Without it, clicking Edit or Delete would also trigger the card's click handler and open the modal. `stopPropagation()` prevents the click event from "bubbling up" to the parent card element:

```typescript
openEditModal(dept: Department, event: Event) {
  event.stopPropagation(); // Don't open the detail modal
  this.departmentName.set(dept.name);
  this.editingDepartment.set(dept);
  this.showAddModal.set(true);
}

async deleteDepartment(dept: Department, event: Event) {
  event.stopPropagation(); // Don't open the detail modal
  // ... confirmation and delete logic
}
```

**The modal** shows each instructor as a card with their initials avatar (generated from their name), full name, email, phone number, and instructor ID. The initials avatar is a simple CSS trick — a circle with a gradient background and the first letter of the name as text.

---

## 3. Bug Fixes

---

### 3a. Calendar Blank After Navigation

**The symptom:**

When a user navigated away from the Dashboard and then came back, the calendar section would render completely blank — no grid, no events, just empty space.

**The root cause:**

Angular's router, by default, reuses component instances when you navigate away and back to the same route. This means `DashboardComponent` was never destroyed — it stayed alive in memory. The `CalendarComponent` inside it was also never destroyed and re-initialized. The FullCalendar library inside `CalendarComponent` relies on its `ngOnInit` lifecycle hook to set up the calendar grid. Since `ngOnInit` only runs once (when the component is first created), it never ran again on the second visit, leaving the calendar blank.

**The fix:**

A `calendarVisible` signal was added to `DashboardComponent`:

```typescript
calendarVisible = signal(false);
```

In the template, the calendar is wrapped in an `@if`:

```html
@if (calendarVisible()) {
  <div class="calendar-wrapper">
    <app-calendar></app-calendar>
  </div>
}
```

When `calendarVisible` is `false`, Angular completely removes `<app-calendar>` from the DOM and destroys the component instance. When it becomes `true`, Angular creates a brand new instance and runs `ngOnInit` fresh.

The lifecycle hooks control this:

```typescript
ngOnInit() {
  // Set false first (removes old instance if any), then true after one tick
  setTimeout(() => this.calendarVisible.set(true), 0);
  this.setupDailyAutoClear();
}

ngOnDestroy() {
  this.calendarVisible.set(false);
}
```

The `setTimeout(..., 0)` is important. It defers setting `calendarVisible` to `true` by one JavaScript event loop tick. This gives Angular time to process the `false` state (destroying any existing calendar instance) before creating a new one. Without the timeout, Angular might try to create the new instance before fully cleaning up the old one.

**Result:** Every time you visit the dashboard, a fresh `CalendarComponent` is created, `ngOnInit` runs, and the calendar renders correctly.

---

### 3b. Password Change Always Said "Incorrect"

**The symptom:**

When a user tried to change their password in Settings, it always failed with "Incorrect password" even when the current password was typed correctly.

**The root cause (before Firebase Auth migration):**

The original login system stored passwords in plain text in Firestore. When a user logged in, the app fetched their user document and stored it in a signal (`currentUser`). However, the `login()` method deliberately stripped the password field before storing the session — a reasonable privacy measure. The problem was that `changePassword()` was comparing the entered current password against `this.currentUser()?.password`, which was `undefined` because the password had been stripped. So every comparison failed.

**The fix (after Firebase Auth migration):**

The entire password system was replaced with Firebase Authentication. The new `changePassword()` method in `auth.service.ts` works like this:

```typescript
async changePassword(currentPassword: string, newPassword: string) {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser?.email) return { success: false, error: 'Not authenticated' };

  try {
    // Step 1: Re-authenticate — Firebase verifies the current password server-side
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);

    // Step 2: Update the password
    await updatePassword(firebaseUser, newPassword);
    return { success: true };
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return { success: false, error: 'Current password is incorrect' };
    }
    // ... other error handling
  }
}
```

`reauthenticateWithCredential()` sends the current password to Firebase's servers for verification. Firebase returns an error if it's wrong — the app never touches the password directly. This is both the correct fix and the secure approach.

---

### 3c. QR Code Duplicate Scanning

**The symptom:**

A student could scan the same QR code multiple times and get multiple attendance records for the same subject on the same day. This happened even if they scanned, navigated away, and came back.

**The root cause:**

The original code used an in-memory `Set` called `scannedSessions` to track which QR codes had already been scanned:

```typescript
// OLD CODE (removed)
private scannedSessions = new Set<string>();
```

The problem: this `Set` lived inside the component instance. When the student navigated away from the scanner page, Angular destroyed the component, and the `Set` was garbage collected. When they came back, a new component instance was created with a fresh, empty `Set` — so it had no memory of previous scans.

**The fix:**

The local `Set` was removed entirely. Instead, `processQRCode()` now checks the live `attendance` signal directly before attempting to write:

```typescript
const alreadyMarked = this.dataService.attendance().some(a =>
  a.student_id === student.student_id &&
  a.subject_id === subjectId &&
  new Date(a.date).toDateString() === new Date().toDateString()
);

if (alreadyMarked) {
  this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'duplicate' });
  setTimeout(() => { if (this.cameraStarted()) this.scanning.set(true); }, 2000);
  return;
}
```

`dataService.attendance()` is the in-memory signal that persists for the entire app session (not just the component's lifetime). It always reflects the current state of all attendance records. This check survives navigation.

**Second layer of protection:**

`DataService.addAttendance()` also has a server-side duplicate guard:

```typescript
async addAttendance(record: Attendance) {
  const exists = this.attendance().some(a =>
    a.student_id === record.student_id &&
    a.subject_id === record.subject_id &&
    new Date(a.date).toDateString() === new Date(record.date).toDateString()
  );
  if (exists) return false; // Abort — don't write to Firestore
  // ... proceed with write
}
```

Even if the component-level check somehow failed, `DataService` would catch it before anything reaches Firestore.

---

## 4. Removed Features / Cleanup

These items were removed either because the instructor requested it or because they were dead code left over from an earlier version of the project.

---

### 4a. Reset Statistics Button

**What it was:**

A red "Reset Statistics" button visible to admins on the dashboard. Clicking it would call `resetAllAttendance()` in `DataService`, which deleted every single attendance record from Firestore.

**Why it was removed:**

The instructor flagged this as dangerous. Having a one-click "delete everything" button on the main dashboard — the first page every user sees — is a serious accidental-deletion risk. There is no undo for a Firestore delete.

**What was removed:**
- The button element from `dashboard.component.html`
- The `resetStatistics()` method from `dashboard.component.ts`
- The `RotateCcw` icon import (it was only used for that button)

Note: The underlying `resetAllAttendance()` method in `DataService` was kept in case it's needed for a future admin-only settings page with proper confirmation steps.

---

### 4b. Recent Attendance Section

**What it was:**

A panel on the dashboard showing the last 5 attendance records — student name, subject, status, and date.

**Why it was removed:**

Per instructor request. The dashboard should be a clean overview (stats + calendar), not a feed of raw data. The Attendance Records page already serves that purpose with full filtering.

**What was removed:**
- The entire `<!-- Recent Activity -->` HTML section from `dashboard.component.html`
- The `recentAttendance` computed signal from `dashboard.component.ts` (which sorted attendance by date and sliced the last 5)
- The `getStatusClass()` helper method (which returned CSS class strings for status badges — this was only used in the recent attendance section)

---

### 4c. `db.json` and `json-server`

**What they were:**

Early in the project's development, before Firebase was integrated, the app used a fake REST API powered by `json-server`. This tool reads a `db.json` file and automatically creates GET/POST/PUT/DELETE endpoints for it. The `db.json` file contained mock data for all collections (users, students, subjects, etc.).

**Why they were removed:**

By the time this cleanup happened, the app had been fully migrated to Firebase Firestore. `db.json` and `json-server` were completely unused — dead artifacts from a previous phase of development. Keeping them was misleading (someone reading the project might think the app still uses them) and `json-server` was contributing to the npm vulnerability count.

**What was removed:**
- `db.json` file deleted from the project root
- `json-server` uninstalled from `devDependencies`
- The `"json-server": "json-server --watch db.json --port 3000"` script removed from `package.json`

---

### 4d. Dead Code in Accounts Component

**What it was:**

The `accounts.component.ts` file still had leftover code from the `json-server` era:

```typescript
// OLD CODE (removed)
import { HttpClient } from '@angular/common/http';
private http = inject(HttpClient);
private apiUrl = 'http://localhost:3000';
```

These were never called anywhere in the component — pure dead code. But they were still imported, which meant `HttpClientModule` had to be in the imports array, adding unnecessary bundle weight.

**The filter bug that was also fixed:**

While cleaning up this component, a logic bug was found in the `allAccounts` filter. The original code excluded the admin account from the list using a hardcoded ID:

```typescript
// OLD CODE (buggy)
allAccounts = computed(() =>
  this.dataService.users().filter(u => u.user_id !== '1')
);
```

`'1'` was the hardcoded user ID from the old `json-server` mock data. In Firebase, user IDs are long random strings (UIDs), so this filter never actually excluded anyone. The fix was to exclude the currently logged-in admin dynamically:

```typescript
// FIXED
allAccounts = computed(() => {
  const currentId = this.authService.currentUser()?.user_id;
  return this.dataService.users().filter(u => u.user_id !== currentId);
});
```

This correctly hides the admin's own account from the accounts list regardless of what their UID is.

---

## 5. Renamed Features

### "Create Account" → "Account Requests"

**What changed:**

| Before | After |
|---|---|
| Page title: "Create Account" | Page title: "Account Requests" |
| Route: `/create-account` | Route: `/account-requests` |
| Sidebar label: "Create Account" | Sidebar label: "Account Requests" |

**Why:**

The page now does more than just create accounts — it also manages the pending registration requests submitted from the login page. "Account Requests" is a more accurate name for what the page actually does. It has three tabs: Instructor (direct creation), Student (direct creation), and Pending Approvals (review submitted requests).

**Where the change lives:**

- `app.routes.ts` — the route path was updated from `'create-account'` to `'account-requests'`
- `layout.component.ts` — the `menuItems()` function was updated with the new path and label
- `layout.component.ts` — the `getPageTitle()` map was updated with the new path key
- The component file itself (`create-account.component.ts`) kept its filename for consistency with the folder structure, but the displayed title in the header now reads "Account Requests"
