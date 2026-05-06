# SAMS – Student Attendance Management System
## Consultation Documentation
### Branch: `may-check` | Changes Requested by Instructor

---

## Overview

This document covers exactly three changes requested by the instructor for the SAMS system. These changes are isolated in the `may-check` branch and do not include any other improvements.

---

## Change 1 — Dashboard: Remove Clickable Shortcuts

### What the instructor wanted

> "Dashboard shouldn't have clickable shortcuts. The hover things for status and calendar is fine."

### What was removed

The original dashboard had a **Quick Actions** panel that appeared beside the Recent Attendance section. It contained clickable cards that linked to other pages. There were three versions of this panel depending on the user's role:

- **Admin/Instructor** — links to Take Attendance, Manage Subjects, View Subjects, Attendance Records
- **Student** — links to Scan QR Code, My Attendance Records
- **Parent** — link to My Child's Records

All three panels were removed entirely. The Recent Attendance section was also removed. The dashboard now only shows the **stats grid** at the top and the **attendance calendar** below it.

### Bug also fixed: Calendar goes blank after navigating away

When a user navigated to another page and came back to the dashboard, the calendar would appear blank. This was caused by Angular keeping the `DashboardComponent` alive in memory, so the `CalendarComponent` inside it was never destroyed and re-initialized.

**The fix** uses a `calendarVisible` signal that is toggled off when the dashboard is destroyed and back on when it is initialized. This forces Angular to completely destroy and recreate the calendar component on every visit.

```typescript
// dashboard.component.ts

calendarVisible = signal(false);

ngOnInit() {
  // setTimeout(0) defers by one tick — Angular processes the @if(false)
  // first (destroying the old calendar), then sets it to true (creating a fresh one)
  setTimeout(() => this.calendarVisible.set(true), 0);
}

ngOnDestroy() {
  // When leaving the dashboard, set to false so the calendar is destroyed
  this.calendarVisible.set(false);
}
```

In the template:
```html
<!-- The @if block destroys and recreates app-calendar on every visit -->
@if (calendarVisible()) {
  <div class="calendar-wrapper">
    <app-calendar></app-calendar>
  </div>
}
```

### Files changed

| File | What changed |
|------|-------------|
| `dashboard.component.html` | Removed Quick Actions panels and Recent Attendance section |
| `dashboard.component.ts` | Added `calendarVisible` signal, `ngOnInit`, `ngOnDestroy`; removed unused imports |

---

## Change 2 — Account Creation Revamp

### What the instructor wanted

> "Sign up in the login page. To make things simple, just use what is in the Create Account page, but make it go with the sign in page. Before account gets created, admin will confirm or deny it."

### What was built

This change has three parts that work together.

---

### Part A — Sign Up Form on the Login Page

The login page was converted from a single sign-in card into a two-view system. The user sees the sign-in form by default. A **"Request an Account"** button at the bottom switches to the sign-up view.

The sign-up view has two tabs — **Instructor** and **Student** — with the same form fields as the existing Create Account page.

**How the view switching works:**

A `signal` called `view` tracks which card is currently shown. Angular's `@if` block renders the correct card based on this value.

```typescript
// login.component.ts

// Tracks which view is shown: 'login' or 'signup'
view = signal<'login' | 'signup'>('login');

showSignup() {
  this.signupError.set(''); // Clear any previous errors
  this.view.set('signup');  // Switch to signup card
}

showLogin() {
  this.signupError.set('');
  this.view.set('login');   // Switch back to login card
}
```

```html
<!-- login.component.html -->

@if (view() === 'login') {
  <div class="login-card">
    <!-- Sign in form -->
    ...
    <button (click)="showSignup()">Request an Account</button>
  </div>
}

@if (view() === 'signup') {
  <div class="login-card signup-card">
    <!-- Sign up form with Instructor / Student tabs -->
    ...
    <button (click)="showLogin()">← Back</button>
  </div>
}
```

**Instructor form fields:** Instructor ID, First Name, Middle Name, Last Name, Email, Phone, Department (dropdown from Firestore)

**Student form fields:** Student ID, First Name, Middle Name, Last Name, Email, Grade Level, Section — plus a Parent section: First Name, Middle Name, Last Name, Email, Phone

**Validation** — the Submit button is disabled until all required fields are filled. The `isInstructorFormValid()` and `isStudentFormValid()` methods check this:

```typescript
isInstructorFormValid(): boolean {
  return !!(
    this.instForm.instructor_id &&
    this.instForm.first_name &&
    this.instForm.last_name &&
    this.instForm.email &&
    this.instForm.phone &&
    this.instForm.department
  );
  // Returns true only if ALL required fields have a value
  // The !! converts the result to a boolean
}
```

---

### Part B — Registration Requests Stored in Firestore

When the user submits the sign-up form, it does **not** create an account immediately. Instead, it writes a document to a new Firestore collection called `registration_requests` with `status: 'pending'`.

**The RegistrationRequest data model** (`user.model.ts`):

```typescript
export interface RegistrationRequest {
  request_id: string;       // Unique ID, e.g. "REQ1746123456789"
  type: 'instructor' | 'student';
  status: 'pending' | 'approved' | 'denied';
  submitted_at: string;     // ISO timestamp of when it was submitted
  reviewed_at?: string;     // ISO timestamp of when admin reviewed it

  // Fields for both types
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  email: string;

  // Instructor-only fields
  instructor_id?: string;
  phone?: string;
  department?: string;

  // Student-only fields
  student_id?: string;
  grade_level?: string;
  section?: string;

  // Parent fields (only for student requests)
  parent_first_name?: string;
  parent_last_name?: string;
  parent_email?: string;
  parent_phone?: string;

  _docId?: string;  // Firestore document ID, added at runtime
}
```

**How the submission works** (`login.component.ts`):

```typescript
async submitSignup() {
  this.signupLoading.set(true);

  // Step 1: Check if a pending request with this email already exists
  // This prevents the same person from submitting multiple times
  const existing = this.dataService.registrationRequests().find(
    r => r.email === this.instForm.email && r.status === 'pending'
  );
  if (existing) {
    this.signupError.set('A pending request with this email already exists.');
    return;
  }

  // Step 2: Build the request object
  const req: RegistrationRequest = {
    request_id: 'REQ' + Date.now(), // Timestamp-based unique ID
    type: 'instructor',
    status: 'pending',              // Always starts as pending
    submitted_at: new Date().toISOString(),
    ...allFormFields
  };

  // Step 3: Write to Firestore
  await this.dataService.addRegistrationRequest(req);

  // Step 4: Show success message and return to login
  this.view.set('login');
}
```

**How DataService stores it** (`data.service.ts`):

```typescript
async addRegistrationRequest(req: RegistrationRequest) {
  // addDoc_ writes to Firestore and returns the saved object with _docId attached
  const saved = await this.addDoc_('registration_requests', req);
  // Update the in-memory signal so the UI reflects the new request immediately
  this.registrationRequests.update(r => [...r, saved]);
  return saved;
}
```

The `registrationRequests` signal is loaded at app startup along with all other data:

```typescript
// In loadAllData():
await Promise.allSettled([
  this.loadUsers(),
  this.loadStudents(),
  ...
  this.loadRegistrationRequests()  // Added to the startup load
]);
```

---

### Part C — Admin Approval in the Account Requests Page

The "Create Account" page was renamed to **"Account Requests"** (route changed from `/create-account` to `/account-requests`). A third tab called **"Pending Approvals"** was added. It shows a badge with the count of pending requests.

**How the pending count badge works:**

```typescript
// create-account.component.ts

// computed() automatically recalculates whenever registrationRequests signal changes
pendingRequests = computed(() =>
  this.dataService.registrationRequests().filter(r => r.status === 'pending')
);
```

```html
<!-- The badge only shows if there are pending requests -->
@if (pendingRequests().length > 0) {
  <span class="pending-badge">{{ pendingRequests().length }}</span>
}
```

**When admin clicks Approve:**

```typescript
async approveRequest(req: RegistrationRequest) {
  // Step 1: Show confirmation dialog
  const result = await Swal.fire({ title: 'Approve Request?', ... });
  if (!result.isConfirmed) return;

  // Step 2: Create the actual account
  if (req.type === 'instructor') {
    await this.createInstructorFromRequest(req);
  } else {
    await this.createStudentFromRequest(req);
  }

  // Step 3: Update the request status to 'approved'
  await this.dataService.updateRegistrationRequest({
    ...req,
    status: 'approved',
    reviewed_at: new Date().toISOString()
  });
}
```

**Creating the instructor account from a request:**

```typescript
private async createInstructorFromRequest(req: RegistrationRequest) {
  // Check email is not already taken
  const emailExists = this.dataService.users().some(u => u.email === req.email);
  if (emailExists) throw new Error(`Email ${req.email} already exists.`);

  // Create Firebase Auth account with a default password
  const credential = await createUserWithEmailAndPassword(auth, req.email, 'instructor123');
  const userId = credential.user.uid; // Firebase assigns the UID

  // Store the user profile in Firestore (no password stored here)
  await this.dataService.addUser({
    user_id: userId,   // Same as Firebase Auth UID
    email: req.email,
    role: 'instructor',
    first_name: req.first_name,
    last_name: req.last_name,
    full_name: req.full_name,
    created_at: new Date().toISOString()
  });

  // Create the instructor record in the instructors collection
  await this.dataService.addInstructor({
    instructor_id: req.instructor_id,
    email: req.email,
    phone: req.phone,
    department: req.department,
    user_id: userId,  // Links instructor to their user account
    ...
  });
}
```

**When admin clicks Deny:**

```typescript
async denyRequest(req: RegistrationRequest) {
  const result = await Swal.fire({ title: 'Deny Request?', ... });
  if (!result.isConfirmed) return;

  // Simply update the status — no account is created
  await this.dataService.updateRegistrationRequest({
    ...req,
    status: 'denied',
    reviewed_at: new Date().toISOString()
  });
}
```

Once a request is approved or denied, it disappears from the Pending Approvals tab because `pendingRequests` only shows `status === 'pending'`.

### Files changed

| File | What changed |
|------|-------------|
| `login.component.ts` | Added view toggle, signup form state, form validation, `submitSignup()` |
| `login.component.html` | Added signup card with Instructor/Student tabs and all form fields |
| `login.component.css` | Added styles for signup card, tabs, scrollable form area |
| `create-account.component.ts` | Added `pendingRequests` computed, `approveRequest()`, `denyRequest()`, `createInstructorFromRequest()`, `createStudentFromRequest()` |
| `create-account.component.html` | Added Pending Approvals tab with approve/deny buttons |
| `create-account.component.css` | Added styles for pending cards, approve/deny buttons |
| `user.model.ts` | Added `RegistrationRequest` interface |
| `data.service.ts` | Added `registrationRequests` signal, `loadRegistrationRequests()`, `addRegistrationRequest()`, `updateRegistrationRequest()`, `deleteRegistrationRequest()` |
| `app.routes.ts` | Changed route from `/create-account` to `/account-requests` |
| `layout.component.ts` | Updated nav label from "Create Account" to "Account Requests" and path to `/account-requests` |

---

## Change 3 — Departments: Click Card to View Instructors

### What the instructor wanted

> "In departments, when a department card is clicked, it will show the instructors in that department."

### What was built

Clicking a department card opens a modal that lists all instructors assigned to that department. Each instructor row shows their initials avatar, full name, email, phone, and instructor ID.

**How it works** (`departments.component.ts`):

```typescript
// Tracks which department was clicked (null = no modal open)
selectedDepartment = signal<Department | null>(null);

// Automatically recalculates when selectedDepartment changes
// Filters the instructors list by matching the department name
departmentInstructors = computed(() => {
  const dept = this.selectedDepartment();
  if (!dept) return []; // No department selected, return empty list
  return this.dataService.instructors().filter(i => i.department === dept.name);
});

// Called when a department card is clicked
openDepartmentDetail(dept: Department) {
  this.selectedDepartment.set(dept); // This triggers the modal to open
}

// Called when the modal is closed
closeDepartmentDetail() {
  this.selectedDepartment.set(null); // This triggers the modal to close
}
```

**Why `computed()` is used here:**

`computed()` creates a derived signal — its value is automatically recalculated whenever its dependencies change. Here, `departmentInstructors` depends on `selectedDepartment` and `dataService.instructors`. If either changes (e.g., a new instructor is added while the modal is open), the list updates automatically without any extra code.

**The card click and button conflict:**

The department card is clickable, but it also has Edit and Delete buttons inside it. Without special handling, clicking Edit would also trigger the card click. This is solved with `event.stopPropagation()`:

```typescript
openEditModal(dept: Department, event: Event) {
  event.stopPropagation(); // Stops the click from bubbling up to the card
  this.departmentName.set(dept.name);
  this.editingDepartment.set(dept);
  this.showAddModal.set(true);
}

deleteDepartment(dept: Department, event: Event) {
  event.stopPropagation(); // Same here
  ...
}
```

In the template, `$event` is passed to the method so it can call `stopPropagation()`:

```html
<div class="department-card" (click)="openDepartmentDetail(dept)">
  <div class="department-info">
    <h3>{{ dept.name }}</h3>
  </div>
  <div class="department-actions">
    <!-- $event passes the click event object to the method -->
    <button (click)="openEditModal(dept, $event)">Edit</button>
    <button (click)="deleteDepartment(dept, $event)">Delete</button>
  </div>
</div>
```

**The instructors modal** (`departments.component.html`):

```html
<!-- Modal only renders when selectedDepartment() is not null -->
@if (selectedDepartment()) {
  <div class="modal-overlay" (click)="closeDepartmentDetail()">
    <!-- stopPropagation prevents clicks inside the modal from closing it -->
    <div class="modal-content" (click)="$event.stopPropagation()">

      <div class="modal-header">
        <h2>{{ selectedDepartment()!.name }}</h2>
        <!-- The ! tells TypeScript we know this is not null here -->
      </div>

      <div class="modal-body">
        @if (departmentInstructors().length === 0) {
          <p>No instructors assigned to this department yet.</p>
        } @else {
          @for (inst of departmentInstructors(); track inst.instructor_id) {
            <div class="instructor-row">
              <!-- Avatar shows first letter of first and last name -->
              <div class="instructor-avatar">
                {{ inst.first_name.charAt(0) }}{{ inst.last_name.charAt(0) }}
              </div>
              <div class="instructor-details">
                <p>{{ inst.full_name }}</p>
                <p>{{ inst.email }}</p>
              </div>
              <span class="instructor-id-badge">{{ inst.instructor_id }}</span>
            </div>
          }
        }
      </div>

    </div>
  </div>
}
```

### Files changed

| File | What changed |
|------|-------------|
| `departments.component.ts` | Added `selectedDepartment` signal, `departmentInstructors` computed, `openDepartmentDetail()`, `closeDepartmentDetail()`; updated `openEditModal()` and `deleteDepartment()` to accept and stop the event |
| `departments.component.html` | Made cards clickable, added instructors modal |
| `departments.component.css` | Added `cursor: pointer` on cards, instructor modal styles |

---

## Summary of All Changes

| # | Change | Files Affected |
|---|--------|---------------|
| 1 | Dashboard shortcuts removed, calendar bug fixed | `dashboard.component.html`, `dashboard.component.ts` |
| 2 | Sign up on login page with admin approval workflow | `login.component.*`, `create-account.component.*`, `user.model.ts`, `data.service.ts`, `app.routes.ts`, `layout.component.ts` |
| 3 | Department cards open instructor list modal | `departments.component.*` |

---

## New Firestore Collection Added

### `registration_requests`

This collection was added to support the account request workflow. It stores all submitted registration requests regardless of their status.

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Unique ID prefixed with "REQ" |
| `type` | string | Either `'instructor'` or `'student'` |
| `status` | string | `'pending'`, `'approved'`, or `'denied'` |
| `submitted_at` | string | ISO timestamp when submitted |
| `reviewed_at` | string | ISO timestamp when admin reviewed (optional) |
| `full_name` | string | Full name of the applicant |
| `email` | string | Email of the applicant |
| *(+ role-specific fields)* | | Instructor ID, department, phone OR student ID, grade, section, parent info |

---

## How Angular Signals Work (Quick Reference)

Since this project uses Angular Signals throughout, here is a quick reference for studying:

```typescript
// signal() — holds a value, notifies dependents when changed
const count = signal(0);
count.set(5);           // Set a new value
count.update(v => v + 1); // Update based on current value
count()                 // Read the current value (call it like a function)

// computed() — derives a value from other signals, auto-updates
const doubled = computed(() => count() * 2);
doubled()               // Always returns count() * 2

// effect() — runs a side effect when dependencies change
effect(() => {
  console.log('Count changed to:', count());
  // This runs every time count() changes
});
```

In templates, signals are called with `()`:
```html
<!-- count is a signal, so we call it with () to read its value -->
<p>{{ count() }}</p>

<!-- @if also works with signals -->
@if (isLoading()) {
  <div>Loading...</div>
}
```
