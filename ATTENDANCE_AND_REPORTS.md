# Attendance & Reports Logic

---

## Attendance

### How a Record is Stored

Every attendance action — whether manual or QR — produces one `Attendance` document in Firestore:

```ts
{
  attendance_id: 'ATT' + Date.now(),   // e.g. ATT1746789600000
  student_id:    string,
  student_name:  string,
  instructor_id: string,
  subject_id:    string,
  subject_name:  string,
  date:          string,   // ISO string in Firestore, converted to Date on load
  time:          string,   // toLocaleTimeString() at moment of marking
  status:        'Present' | 'Late' | 'Absent' | 'Excused',
  method:        'QR' | 'Manual'
}
```

One record = one student, one subject, one day. The duplicate guard in `addAttendance()` enforces this:

```ts
const exists = this.attendance().some(a =>
  a.student_id === record.student_id &&
  a.subject_id === record.subject_id &&
  new Date(a.date).toDateString() === new Date(record.date).toDateString()
);
if (exists) return false;
```

If a record already exists for that student + subject + calendar day, `addAttendance` returns `false` and nothing is written.

---

### Manual Attendance (Instructor)

**Flow:**

1. Instructor opens Take Attendance and selects a subject from the grid.
   - The grid only shows subjects where `subject.instructor_id` matches the instructor's own `instructor_id`. If the instructor profile isn't loaded yet, the grid returns empty — no fallback to all subjects.

2. Two tabs appear: **Manual Entry** and **Generate QR**.

3. In Manual Entry, the enrolled students list is computed:
   ```ts
   enrolledStudents = computed(() => {
     const enrollments = dataService.enrollments()
       .filter(e => e.subject_id === this.selectedSubjectId);
     return dataService.students()
       .filter(s => enrollments.some(e => e.student_id === s.student_id));
   });
   ```
   Only students enrolled in the selected subject appear.

4. Each student row shows a status dropdown (`Present / Late / Absent / Excused`) if not yet marked today, or a "Marked" badge if they already have a record for today.

5. Selecting a status calls `markAttendance()` → `recordAttendance()` → `dataService.addAttendance()`.

6. The instructor can also type a student ID directly into the Manual ID Entry field and click "Mark Present" — this always marks `Present` via `markAttendanceManual()`.

**isMarkedToday check (UI only):**
```ts
isMarkedToday(studentId: string): boolean {
  const today = new Date().toDateString();
  return this.dataService.attendance().some(a =>
    a.student_id === studentId &&
    a.subject_id === this.selectedSubjectId &&
    new Date(a.date).toDateString() === today
  );
}
```
This is purely for the UI badge. The real duplicate guard lives in `addAttendance()` in the service.

**Clear Today's Marks:**

The "Clear Today's Marks" button calls `dataService.clearAttendanceForDay(subjectId, date)` which deletes the Firestore documents and then updates the in-memory signal. It does not just clear the signal — the deletion is permanent.

---

### QR Attendance — Generator (Instructor)

The instructor switches to the **Generate QR** tab. The `QrCodeGeneratorComponent` receives the selected `subjectId` as an `@Input`.

**Generating a code:**

```
QR data format:  ATTEND:<subjectId>:<expiryTimestamp>
Example:         ATTEND:SUB001:1746789600000
```

Steps:
1. Instructor picks a session duration (5 / 10 / 15 / 30 / 45 / 60 minutes).
2. Click Generate — the component:
   - Sets `sessionId` to `ATT_<subjectId>_<Date.now()>`
   - Calculates `expiryTime = now + sessionDuration minutes`
   - Encodes `ATTEND:<subjectId>:<expiryTime.getTime()>` into a QR image via the `qrcode` library
   - Displays the image with an active/ending-soon/expired status indicator

**Session state indicator:**

| Time remaining | Dot color | Label |
|---|---|---|
| > 5 minutes | Green | Active |
| 0–5 minutes | Yellow | Ending Soon |
| Expired | Red | Expired |

The indicator is purely visual — it does not automatically invalidate the QR. Expiry is enforced on the scanner side.

**Actions while a QR is active:**

| Button | What it does |
|---|---|
| Download | Saves the QR as a PNG file |
| Copy | Copies the QR image to clipboard |
| Regenerate | Stops the current session and generates a new QR with a fresh expiry |
| Stop | Clears the QR image and session ID |

**Live scan feed:**

`QrCodeGeneratorComponent.ngOnInit()` opens a real-time Firestore `onSnapshot` listener on the entire `attendance` collection. Every time any student scans and writes a record, the listener fires and updates `dataService.attendance` signal. The `liveScans` computed then filters to today's records for the current subject:

```ts
liveScans = computed(() => {
  const sid = this.sessionId();
  if (!sid) return [];
  return this.dataService.attendance().filter(a =>
    a.subject_id === this.subjectId &&
    new Date(a.date).toDateString() === new Date().toDateString()
  );
});
```

The instructor sees each student appear in the feed the moment they scan, without refreshing.

The `onSnapshot` listener is unsubscribed in `ngOnDestroy` to prevent memory leaks.

---

### QR Attendance — Scanner (Student)

Students navigate to Take Attendance and go straight to `QrCodeScannerComponent` — no subject selector, no manual entry.

**Two scan methods:**

| Method | How it works |
|---|---|
| Camera | `BrowserQRCodeReader.decodeFromVideoDevice()` — continuous scan loop via `@zxing/library`. Camera permission is requested explicitly before starting. |
| Upload | User picks an image file → `URL.createObjectURL()` → `BrowserQRCodeReader.decodeFromImageUrl()` → same `processQRCode()` handler. |

**processQRCode() — step by step:**

```
1. Check prefix
   QR data must start with "ATTEND:"
   → If not: show "Invalid QR Code" error, set status: 'error'

2. Parse the data
   Split "ATTEND:<subjectId>:<expiryTs>" on ":"
   subjectId = parts[0]
   expiryTs  = parseInt(parts[1])

3. Check expiry
   if (Date.now() > expiryTs)
   → Show "QR Code Expired" warning, set status: 'error'

4. Check in-memory duplicate (same browser session)
   scannedSessions is a Set<string> of full QR strings already processed this session
   if (scannedSessions.has(sessionId))
   → Set status: 'duplicate', return early (no Firestore call)

5. Look up student and subject
   student = students.find(s => s.user_id === currentUser.user_id)
   subject = subjects.find(s => s.subject_id === subjectId)
   → If either not found: throw → caught → show "Error" alert

6. Build and write the attendance record
   await dataService.addAttendance(record)
   → Returns false if already marked today (Firestore-level duplicate check)
   → If false: set status: 'duplicate', return early

7. On success
   Add sessionId to scannedSessions Set
   Set status: 'success'
   Call notifyParentAndInstructor() (currently console.log only)
   After 3 seconds, resume scanning if camera is still active
```

**Duplicate protection — two layers:**

| Layer | Where | What it catches |
|---|---|---|
| In-memory Set | `scannedSessions` in the component | Same QR scanned twice in the same browser session without a page reload |
| Firestore check | `addAttendance()` in DataService | Same student + subject + calendar day, regardless of session or device |

**Scan history panel:**

While the camera is running, a "Today's Attendance Records" panel shows all of the student's attendance records for today, pulled from the in-memory signal:

```ts
scanHistory = computed(() => {
  const student = students.find(s => s.user_id === currentUser.user_id);
  const today = new Date().toDateString();
  return attendance().filter(a =>
    a.student_id === student.student_id &&
    new Date(a.date).toDateString() === today
  );
});
```

---

### Attendance Records Page

`AttendanceRecordsComponent` is a read-only view available to all roles. What each role sees is scoped automatically:

| Role | Records shown |
|---|---|
| Admin | All records |
| Instructor | Only records where `instructor_id` matches their own |
| Student | Only their own records (`student_id` match) |
| Parent | Only their linked child's records (`parent.student_id` match) |

The subject filter dropdown is also scoped — instructors see only their subjects, students see only their enrolled subjects, parents see only their child's enrolled subjects.

**Filters available:**
- Subject (dropdown, role-scoped)
- Status (`Present / Late / Absent / Excused`)
- Name search (case-insensitive substring match on `student_name`)

Results are sorted newest-first by `date`.

**Summary stats** at the bottom count Present / Late / Absent / Excused from the currently filtered set.

---

## Reports

### Filters

The Reports page has two independent filters:

| Filter | What it does |
|---|---|
| Subject | Narrows records to one subject. Applies to both the on-screen stats and the Excel export. |
| Date range | Last 7 / 30 / 90 / 365 days. Applies to on-screen stats only — the export uses a separate month picker. |

Instructors only see their own subjects in the subject dropdown. Admins see all subjects.

---

### On-Screen Stats (statusStats)

`filteredRecords` is computed first:

```
1. Start with all attendance records
2. If instructor: filter to records where instructor_id matches
3. If filterSubject is set: filter to that subject
4. Apply date range cutoff: new Date() - N days
```

`statusStats` then counts each status from `filteredRecords`:

```ts
const total   = records.length;
const present = records.filter(r => r.status === 'Present').length;
const late    = records.filter(r => r.status === 'Late').length;
const absent  = records.filter(r => r.status === 'Absent').length;
const excused = records.filter(r => r.status === 'Excused').length;

percentage = Math.round((count / total) * 100)
```

If `total === 0`, all four stats return `0` and `0%` — no divide-by-zero.

The percentages are each independently rounded, so they may not sum to exactly 100% due to rounding (e.g. 33% + 33% + 34% = 100%, but 33% + 33% + 33% = 99%).

---

### Excel Export

The export uses a **separate month picker** (`selectedMonth`, default = current month in `YYYY-MM` format). It is independent of the date range filter used for on-screen stats.

**Step-by-step export logic:**

```
1. Parse selectedMonth → startDate (1st of month), endDate (last day of month)

2. Get all attendance records
   If instructor: filter to their instructor_id
   Filter to records within [startDate, endDate]
   If filterSubject is active: apply it here too

3. If no records found → show "No Data" alert, stop

4. Get unique student IDs from the filtered records
   Look up full Student objects for those IDs

5. Calculate daysConducted
   Collect all unique calendar dates from the filtered records:
     allClassDays = unique values of record.date.toISOString().split('T')[0]
   totalClassDays = allClassDays.length

   This is derived from the FULL record set, not per-student.
   A student who was absent on a day has no record for that day,
   so counting per-student would give them a lower daysConducted
   and inflate their attendance percentage.

6. For each student:
   studentRecords = records filtered to that student_id
   daysAttended   = studentRecords where status is 'Present' OR 'Late'
   percentage     = (daysAttended / totalClassDays * 100).toFixed(2) + '%'

7. Build Excel workbook (ExcelJS):
   Row 1: "Monthly Attendance Report - <Month Year>"
   Row 2: (empty)
   Row 3: headers — Student Name | Days Conducted | Days Attended | Percentage
   Rows 4+: one row per student

8. Write buffer → Blob → download as Attendance_Report_YYYY-MM.xlsx
```

**Why daysAttended includes Late:**

A student who arrives late was still physically present. The report counts `Present` and `Late` together as "attended" for the percentage calculation. `Absent` and `Excused` do not count toward attendance.

**Column widths:**

| Column | Width |
|---|---|
| Student Name | 30 |
| Days Conducted | 15 |
| Days Attended | 15 |
| Percentage | 12 |

---

### What the Export Does NOT Include

- No per-day breakdown (just totals per student)
- No status breakdown (Present vs Late vs Absent vs Excused) — only total attended
- No subject column (filter by subject before exporting if you need a single-subject report)
- No instructor column
- Styling is minimal — no cell colors or borders beyond default ExcelJS output
