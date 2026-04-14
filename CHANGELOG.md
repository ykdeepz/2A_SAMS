# SAMS — Full Session Changelog
### Branch: `deepz-test-edit`

This document covers everything worked on, fixed, added, and improved during this development session — in chronological order.

---

## 1. Initial Setup

- Pulled the `ipolished` branch from `https://github.com/ykdeepz/2A_SAMS`
- Installed all dependencies via `npm install`
- Started JSON Server on port 3000 and Angular dev server on port 4200

---

## 2. Instructor Feedback Fixes

Based on instructor comments (originally in Cebuano):

### QR Code Flow Correction
- **Removed** the camera/scanner UI from the instructor's Manual Entry tab — instructors should not be scanning
- **Removed** the redundant "Monitor Scans" tab (it was identical to Generate QR)
- Students now go directly to the QR scanner when opening Take Attendance — no subject selector shown to them
- Instructor generates QR → Student scans QR (correct flow enforced)

### Calendar Consolidation
- Removed the standalone `/calendar` route
- Calendar is now embedded directly in the Dashboard for all roles (instructor, student, parent)
- Each role sees only their own relevant attendance data on the calendar

### Dashboard for All Roles
- Students and parents previously had no dashboard — they were redirected to attendance records
- Added proper dashboard for students and parents with role-specific stats and quick actions
- Route guard updated to allow all roles on `/dashboard`

### Redundant Data Cleanup
- Removed `instructor_name` from subjects (looked up via `instructor_id` instead)
- Removed `student_name` and `subject_name` from enrollments (looked up via IDs)
- Both fields marked as optional/deprecated in the model
- `db.json` cleaned of these redundant fields
- UI updated to use live lookups via `getInstructorName()` and `getStudentName()` helpers

---

## 3. Bug Fixes (JSON Server Era)

### Delete Not Persisting to Database
- **Root cause**: All delete and update operations were using custom string IDs (`user_id`, `student_id`, etc.) as the URL parameter — JSON Server requires the numeric `id` field
- **Fixed**: All `deleteUser`, `deleteStudent`, `deleteSubject`, `deleteInstructor`, `deleteParent`, `unenrollStudent` now use the numeric `id` field
- **Fixed**: All `updateUser`, `updateStudent`, `updateInstructor`, `updateParent` now use numeric `id` for PUT requests
- **Fixed**: Removed all silent 404-swallowing `.catch(() => {})` patterns — errors now throw properly

### Enrollment List Showing Blank Names
- Subject detail page was reading `enrollment.student_name` which was removed as redundant
- Added `getStudentName(studentId)` helper that does a live lookup from the students signal

### Settings Forms Not Saving
- Profile update and password change only showed a toast — no API calls were made
- **Fixed**: Profile update now calls `dataService.updateUser()` and refreshes the session in localStorage
- **Fixed**: Password change now verifies current password against DB, then updates via `dataService.updateUser()`

### Instructor Account Delete Failing
- Cascade delete was running in parallel — race conditions caused partial failures
- **Fixed**: Now runs sequentially: enrollments → subjects → instructor profile → user

### QR Session Expiry Not Enforced
- The expiry timer was purely cosmetic — expired QR codes still worked
- **Fixed**: Expiry timestamp now encoded directly in QR data: `ATTEND:<subjectId>:<expiryTimestamp>`
- Scanner checks `Date.now() > expiryTs` and shows a SweetAlert if expired — no attendance recorded

### Camera Not Opening
- Angular was trying to access `<video>` element before it was rendered in the DOM
- **Fixed**: `cameraStarted.set(true)` → `detectChanges()` → 100ms wait → then access element
- Added explicit `getUserMedia()` call for clean permission prompt
- Better error message for `NotAllowedError` (permission denied)

### Reports Showing All Data for Instructors
- Reports page showed all attendance regardless of role
- **Fixed**: Filtered by instructor's own subjects; subject dropdown also scoped

### Calendar Showing All Attendance
- Calendar showed counts for all users regardless of who was logged in
- **Fixed**: Calendar now filters by role — students see own, parents see child's, instructors see their subjects

### Duplicate Email Allowed
- No check before creating accounts
- **Fixed**: Email uniqueness checked against existing users before saving

### Fake 800ms Delay in Forms
- Both instructor and student forms had a `setTimeout(..., 800)` simulating an API call
- **Fixed**: Removed entirely — forms emit immediately

---

## 4. Features Added

### Show/Hide Password Toggle
- Added animated eye icon toggle on login page and all three password fields in settings
- Uses `EyeClosed` icon (not `EyeOff`) — actual closed eyelid, no slash
- Smooth crossfade animation between open/closed states using CSS transitions

### Upload QR Code Image
- Students can now upload a photo of a QR code as a fallback when camera is unavailable
- Uses `BrowserQRCodeReader.decodeFromImageUrl()` from `@zxing/library`
- Processes the same way as a camera scan — expiry check, duplicate prevention, attendance recording

### Theme System (6 Themes)
- Added `ThemeService` with 6 color themes selectable in Settings → Appearance:
  - Amber Dusk (default)
  - Ocean Breeze
  - Forest Canopy
  - Rose Garden
  - Violet Dusk
  - Midnight Slate
- Themes use CSS custom properties (`--primary`, `--accent`, `--sidebar-bg`, etc.)
- Applied via `data-theme` attribute on `<html>` element
- Persists in `localStorage` across sessions
- Affects: sidebar, buttons, tabs, subject cards, focus rings, icon badges, form inputs

### Parents Column in Accounts Page
- Accounts page previously only showed Instructors and Students columns
- Added Parents column — parents can now be viewed, edited, and deleted from the UI

### Departments in Sidebar
- Departments page existed but was only reachable by typing the URL
- Added to sidebar navigation for admin role

### Admin Can Create Subjects
- Previously only instructors could create subjects (looked up their own profile)
- Admin now gets a Swal select prompt to choose which instructor to assign the subject to

### Scan QR in Student Sidebar
- Students had no "Take Attendance" link in the sidebar
- Added "Scan QR" nav item for students pointing to `/take-attendance`

### Generate QR — Two Column Layout
- Generate QR tab now has two columns:
  - Left: QR code generator with session duration, status indicator, download/copy/regenerate/stop
  - Right: Live scan feed showing students as they scan in real time

### Glassmorphism Login Page
- Login background replaced with `backgroundpls.mp4` video (fullscreen, autoplay, muted, looped)
- Dark overlay for readability
- Login card uses glassmorphism: `backdrop-filter: blur(20px)`, semi-transparent white, white border
- Inputs styled to match glass aesthetic — transparent background, white text

### Loading State on Startup
- App previously showed empty dashboards for a second while Firestore loaded
- Added `loading` signal to `DataService`
- Layout shows a themed spinner while data loads
- If loading fails, shows error message with a Retry button

---

## 5. UI/UX Improvements

- Removed "Master Admin Account" section from login — only the note remains
- "Search Student" label in attendance records changed to "Search"
- Subjects filter in attendance records scoped by role (students/parents only see relevant subjects)
- Reports shows proper empty state instead of 0% stats when no data
- Unenroll student has a confirmation dialog
- Forms reset after successful account creation
- Page title in header correctly shows "My Child's Attendance" for parents
- `console.log` statements cleaned from accounts delete flow and create-account flow

---

## 6. Firebase Migration

### Removed
- JSON Server (`db.json`, `npm run json-server`) — no longer needed
- `HttpClient` from `app.config.ts`
- `server.js`, `render.yaml`, `vercel.json`, `.vercelignore`, `BACKEND_DEPLOYMENT.md`, `.env.example`
- `api/` folder (Vercel/Render API handlers)
- All Vercel/Render/Firebase comments from services

### Added
- `firebase` JS SDK installed (`npm install firebase`)
- `src/app/firebase.config.ts` — Firebase project config and Firestore instance
- `DataService` fully rewritten to use Firestore:
  - All `load*` methods use `getDocs(collection(db, ...))`
  - All `add*` methods use `addDoc()`
  - All `update*` methods use `updateDoc()` with `findDocId()` lookup by business ID
  - All `delete*` methods use `deleteDoc()` with `findDocId()` lookup
  - `_docId` stored on every fetched document for Firestore document reference
  - `clean()` helper strips `_docId` before writing to Firestore
- `AuthService` rewritten — login queries Firestore `users` collection directly
- `onSnapshot` real-time listener in QR generator — live scan feed updates instantly without polling
- `loadError` signal — shows user-friendly error + retry button if Firestore fails
- `Promise.allSettled` used in `loadAllData` — one failing collection doesn't block the rest

### Seeding
- `firebase.seed.ts` created to seed admin account and 5 departments on first run
- Seed removed from login component after initial run
- Seed file deleted after use

---

## 7. Branch Management

| Branch | Purpose |
|---|---|
| `ipolished` | Original branch pulled from GitHub |
| `deepz-test-edit` | Main working branch — all changes here |
| `main` | Pushed as duplicate of `deepz-test-edit` |
| `copy-for-deepz` | Created then deleted |

---

## 8. Known Remaining Items

- **Firestore security rules** expire May 14, 2026 — update in Firebase Console to remove expiry:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
- `DOCUMENTATION.md` in root covers full feature list and project structure

---

## 9. Final State

- **Zero TypeScript errors** across all 26 component/service files
- **No JSON Server dependency** — app runs with just `ng serve`
- **Firebase Firestore** as the live database
- All deletes, updates, and creates persist correctly to Firestore
- Themes, QR flow, attendance, calendar, reports all working

---

*April 14, 2026 — deepz-test-edit branch*
