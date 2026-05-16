# Skwela SAMS — Important Code Snippets

Explains how key parts of the system work, with the actual code and a plain-language breakdown of each.

---

## 1. How Routing Works

**File:** `src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',         canActivate: [roleGuard(['admin', 'instructor', 'student', 'parent'])] },
      { path: 'accounts',          canActivate: [roleGuard(['admin'])] },
      { path: 'account-requests',  canActivate: [roleGuard(['admin'])] },
      { path: 'take-attendance',   canActivate: [roleGuard(['instructor', 'student'])] },
      { path: 'reports',           canActivate: [roleGuard(['admin', 'instructor'])] },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
```

**How it works:**
- All protected pages are children of `LayoutComponent` (the shell with the sidebar)
- `authGuard` runs first — if the user is not logged in, they are redirected to `/login`
- `roleGuard(['admin'])` runs second — if the user's role is not in the allowed list, they are redirected
- The wildcard `**` catches any unknown URL and sends it to `/login`
- The empty path `''` immediately redirects to `/dashboard`

---

## 2. How the Auth Guard Works

**File:** `src/app/guards/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.hasRole(roles)) return true;
  return router.createUrlTree(['/dashboard']);
};
```

**How it works:**
- `authGuard` checks `currentUser() !== null` — if no user, redirect to login
- `roleGuard` is a factory function — it takes an array of allowed roles and returns a guard function
- `hasRole(roles)` checks if the current user's role is in the allowed array
- If the role check fails, the user is sent to `/dashboard` instead of being logged out

---

## 3. How Login and Session Restore Works

**File:** `src/app/services/auth.service.ts`

```typescript
constructor(private router: Router) {
  // Restore session instantly from localStorage — prevents flash on reload
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    this.currentUser.set(JSON.parse(stored));
  }

  // Firebase confirms or clears the session asynchronously
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await this.loadProfile(firebaseUser.uid);
      if (profile) {
        this.currentUser.set(profile);
        localStorage.setItem('currentUser', JSON.stringify(profile));
      }
    } else {
      this.currentUser.set(null);
      localStorage.removeItem('currentUser');
    }
  });
}
```

**How it works:**
- On app start, `localStorage` is read immediately so the UI doesn't flash to the login page while Firebase initializes
- `onAuthStateChanged` fires once Firebase Auth has restored the session from browser storage
- If Firebase confirms a user, `loadProfile()` queries Firestore for the full user document (role, name, etc.)
- If Firebase says no user, the signal and localStorage are cleared

---

## 4. How loadProfile Queries Firestore

**File:** `src/app/services/auth.service.ts`

```typescript
private async loadProfile(uid: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('user_id', '==', uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data() as User;
  const { password: _, ...profile } = data as any;
  return profile as User;
}
```

**How it works:**
- Queries the `users` collection for a document where `user_id` equals the Firebase Auth UID
- This works regardless of what the Firestore document ID is (handles both old random IDs and new UID-based IDs)
- Strips the `password` field before returning — passwords are never stored in the session signal
- Returns `null` if no document is found, which causes the login to fail gracefully

---

## 5. How Angular Signals Power the UI

**File:** `src/app/services/data.service.ts`

```typescript
students    = signal<Student[]>([]);
subjects    = signal<Subject[]>([]);
attendance  = signal<Attendance[]>([]);
enrollments = signal<SubjectEnrollment[]>([]);
```

**File:** `src/app/pages/take-attendance/take-attendance.component.ts`

```typescript
enrolledStudents = computed(() => {
  if (!this.selectedSubjectId) return [];
  const enrollments = this.dataService.enrollments()
    .filter(e => e.subject_id === this.selectedSubjectId);
  return this.dataService.students()
    .filter(s => enrollments.some(e => e.student_id === s.student_id));
});
```

**How it works:**
- `signal()` creates a reactive value — when it changes, any `computed()` or template that reads it automatically re-evaluates
- `computed()` is a derived signal — it recalculates whenever any signal it reads changes
- No `subscribe()`, no `async` pipe, no manual change detection needed
- When `dataService.enrollments()` or `dataService.students()` updates, `enrolledStudents` recomputes and the template updates automatically

---

## 6. How the Duplicate Account Creation Problem is Solved

**File:** `src/app/firebase.config.ts`

```typescript
export const app         = initializeApp(firebaseConfig);
export const auth        = getAuth(app);           // primary — holds admin session

export const secondaryApp  = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp); // isolated — used only for creating accounts
```

**File:** `src/app/pages/create-account/create-account.component.ts`

```typescript
const credential = await createUserWithEmailAndPassword(
  secondaryAuth,   // ← secondary, not primary
  req.email,
  'instructor123'
);
const userId = credential.user.uid;
await signOut(secondaryAuth); // clean up immediately
```

**How it works:**
- `createUserWithEmailAndPassword` on the primary `auth` would sign in as the new user, replacing the admin's session
- By using `secondaryAuth` (a completely separate Firebase app instance with its own auth state), the admin's session on `auth` is never touched
- `signOut(secondaryAuth)` is called right after getting the UID to keep the secondary app clean for the next approval

---

## 7. How the Rollback Works on Failed Approval

**File:** `src/app/pages/create-account/create-account.component.ts`

```typescript
let userId: string | null = null;
try {
  const credential = await createUserWithEmailAndPassword(secondaryAuth, req.email, 'instructor123');
  userId = credential.user.uid;
  await signOut(secondaryAuth);

  await this.dataService.addUser({ user_id: userId, ... });
  await this.dataService.addInstructor({ ... });

} catch (error) {
  // If Firestore writes failed, delete the Auth account so no orphan is left
  if (userId && secondaryAuth.currentUser?.uid === userId) {
    await secondaryAuth.currentUser.delete();
  }
  await signOut(secondaryAuth).catch(() => {});
  throw error;
}
```

**How it works:**
- `userId` is captured the moment the Auth account is created
- If any subsequent Firestore write throws, the `catch` block checks if the secondary app still has that user signed in
- If yes, it deletes the Auth account — no orphaned account is left behind
- The error is re-thrown so the UI can show the failure message

---

## 8. How the Real-Time Registration Requests Listener Works

**File:** `src/app/services/data.service.ts`

```typescript
private startRegistrationRequestsListener() {
  this.stopRegistrationRequestsListener();
  this.unsubscribeRequests = onSnapshot(
    collection(db, 'registration_requests'),
    (snap) => {
      const records = snap.docs.map(d => ({ ...d.data(), _docId: d.id }) as RegistrationRequest);
      this.registrationRequests.set(records);
    },
    (err) => {
      if ((err as any)?.code !== 'permission-denied') {
        console.error('Registration requests listener error:', err);
      }
    }
  );
}
```

**How it works:**
- `onSnapshot` opens a persistent WebSocket connection to Firestore
- Every time any document in `registration_requests` is created, updated, or deleted, Firestore pushes the full snapshot to the client
- The signal is updated with the new data — the admin's pending requests list updates instantly without any page reload
- `permission-denied` errors are silently ignored — non-admin users can't read this collection, and that's expected
- `unsubscribeRequests()` closes the listener when the user signs out

---

## 9. How the QR Code is Generated

**File:** `src/app/pages/take-attendance/qr-code-generator.component.ts`

```typescript
async generateQRCode() {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + Number(this.sessionDuration));

  const QRCode = (await import('qrcode')).default;
  const qrData = `ATTEND:${this.subjectId}:${expiryTime.getTime()}`;

  const dataUrl = await QRCode.toDataURL(qrData, {
    width: 400, margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  });
  this.qrCodeImage.set(dataUrl);
}
```

**How it works:**
- `expiryTime` is calculated as now + the selected session duration in minutes
- The QR data string encodes three pieces: the `ATTEND:` prefix, the subject ID, and the expiry as a Unix millisecond timestamp
- `QRCode.toDataURL()` converts that string into a base64 PNG image
- The image is stored in a signal and rendered directly in the template via `<img [src]="qrCodeImage()">`

---

## 10. How the QR Upload Scan Works

**File:** `src/app/pages/take-attendance/qr-code-scanner.component.ts`

```typescript
async onFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);

  if (!code) {
    await Swal.fire('Invalid Image', 'Could not find a valid QR code.', 'error');
    return;
  }
  await this.processQRCode(code.data);
}
```

**How it works:**
- `createImageBitmap(file)` decodes the image file into a bitmap in memory
- The bitmap is drawn onto an offscreen `<canvas>` element
- `getImageData()` extracts the raw RGBA pixel array from the canvas
- `jsQR()` scans the pixel data and returns the decoded QR string if found
- The decoded string is passed to `processQRCode()` — the same function used by the camera path

---

## 11. How the Duplicate Attendance Guard Works

**File:** `src/app/services/data.service.ts`

```typescript
async addAttendance(record: Attendance) {
  const exists = this.attendance().some(a =>
    a.student_id === record.student_id &&
    a.subject_id === record.subject_id &&
    new Date(a.date).toDateString() === new Date(record.date).toDateString()
  );
  if (exists) return false;

  const recordToSave = {
    ...record,
    date: record.date instanceof Date
      ? record.date.toISOString()
      : new Date(record.date).toISOString()
  };

  const saved = await this.addDoc_('attendance', recordToSave);
  const fixedSaved = { ...saved, date: new Date(saved.date as any) };
  this.attendance.update(a => [...a, fixedSaved]);
  return true;
}
```

**How it works:**
- Before writing to Firestore, the in-memory `attendance` signal is checked for a record with the same student, subject, and calendar day
- `toDateString()` compares only the date part (e.g. "Sat May 17 2025"), ignoring the time
- If a duplicate is found, `false` is returned immediately — no Firestore write happens
- If no duplicate, the date is converted to an ISO string before saving (Firestore stores it consistently this way)
- After saving, the date is converted back to a `Date` object for the in-memory signal
- Returns `true` on success so the caller knows the write happened

---

## 12. How the Cascade Delete Works

**File:** `src/app/services/data.service.ts`

```typescript
async deleteStudent(studentId: string) {
  // Step 1: Collect BEFORE updating signals
  const enrollmentsToDelete = this.enrollments().filter(e => e.student_id === studentId);
  const attendanceToDelete  = this.attendance().filter(a => a.student_id === studentId);
  const parentsToDelete     = this.parents().filter(p => p.student_id === studentId);

  // Step 2: Delete from Firestore, then update signal
  for (const enrollment of enrollmentsToDelete) {
    await this.deleteDoc_('enrollments', enrollment._docId);
  }
  this.enrollments.update(e => e.filter(x => x.student_id !== studentId));

  for (const record of attendanceToDelete) {
    await this.deleteDoc_('attendance', record._docId);
  }
  this.attendance.update(a => a.filter(x => x.student_id !== studentId));

  for (const parent of parentsToDelete) {
    await this.deleteParent(parent.parent_id);
  }

  // Step 3: Delete the student itself
  const docId = this.findDocId(this.students(), 'student_id', studentId);
  await this.deleteDoc_('students', docId);
  this.students.update(s => s.filter(x => x.student_id !== studentId));
}
```

**How it works:**
- Records to delete are collected **first**, before any signal is updated
- This is critical — if the signal were updated first, the filter would return an empty array and nothing would be deleted from Firestore
- Each Firestore document is deleted using its `_docId` (the actual Firestore document ID stored alongside the data)
- After Firestore deletes succeed, the in-memory signal is updated
- The student document itself is deleted last

---

## 13. How Firestore Security Rules Enforce Roles

**Firebase Console — Firestore Rules**

```javascript
function callerProfile() {
  return isAuth()
    ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data
    : null;
}

function hasRole(role) {
  return callerProfile() != null && callerProfile().role == role;
}

function isAdmin()      { return isAuth() && hasRole('admin'); }
function isInstructor() { return isAuth() && hasRole('instructor'); }
function isStudent()    { return isAuth() && hasRole('student'); }

match /attendance/{attendanceId} {
  allow read:   if isAuth();
  allow create: if isAdminOrInstructor() || isStudent();
  allow update, delete: if isAdminOrInstructor();
}
```

**How it works:**
- Every Firestore read or write triggers rule evaluation on Google's servers — the client cannot bypass this
- `callerProfile()` looks up the caller's user document using their Firebase Auth UID as the document ID
- `hasRole()` reads the `role` field from that document
- Rules are evaluated per operation — a student can create attendance records but cannot update or delete them
- If a rule returns `false`, Firestore rejects the operation with `permission-denied` before any data is read or written

---

## 14. How the Excel Export Works

**File:** `src/app/pages/reports/reports.component.ts`

```typescript
// Get unique class days from ALL records (not per-student)
const allClassDays = [...new Set(attendanceRecords.map(r => {
  return new Date(r.date).toISOString().split('T')[0];
}))].sort();
const totalClassDays = allClassDays.length;

for (const student of students) {
  const studentRecords = attendanceRecords.filter(r => r.student_id === student.student_id);
  const daysAttended = studentRecords.filter(r =>
    r.status === 'Present' || r.status === 'Late'
  ).length;
  const percentage = ((daysAttended / totalClassDays) * 100).toFixed(2) + '%';

  excelData.push([student.full_name, totalClassDays, daysAttended, percentage]);
}

const wb = new Workbook();
const ws = wb.addWorksheet('Attendance Report');
const buffer = await wb.xlsx.writeBuffer();
const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
```

**How it works:**
- `allClassDays` is derived from the full record set — not per student. A student who was absent has no record for that day, so counting per-student would give them a lower `daysConducted` and inflate their percentage
- `daysAttended` counts `Present` and `Late` — both mean the student was physically there
- `ExcelJS` builds the workbook in memory as a buffer
- A `Blob` is created from the buffer, a temporary object URL is generated, and a hidden `<a>` element is clicked to trigger the browser download — no server needed

---

## 15. How the Student-Parent Link is Used at Runtime

**File:** `src/app/pages/attendance-records/attendance-records.component.ts`

```typescript
filteredRecords = computed(() => {
  let records = this.dataService.attendance();
  const user = this.authService.currentUser();

  if (user?.role === 'parent') {
    const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
    if (parent) {
      records = records.filter(r => r.student_id === parent.student_id);
    }
  }
  // ... apply additional filters
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});
```

**How it works:**
- The parent's `user_id` (Firebase Auth UID) is used to find their `parents` document
- The `parents` document contains `student_id` — the ID of their linked child
- All attendance records are filtered to only those where `student_id` matches the child's ID
- The parent can never see another student's records — the filter is enforced in the computed signal, and Firestore rules enforce it at the database level too
