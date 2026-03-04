# Subject Detail Component - Visual Guide

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Mathematics                          [Take Attendance]     │
│  MATH101                                                     │
│  👨‍🏫 John Smith • Grade 11 - Section A                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════╗  ┌─────────────────────────┐ │
│  ║ 👥 Enrolled Students (5)  ║  │ 📋 Attendance Records   │ │
│  ╚═══════════════════════════╝  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              + Enroll Student                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Jane Doe                              [Unenroll]    │  │
│  │  Enrolled: 3/1/2026                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  John Smith                            [Unenroll]    │  │
│  │  Enrolled: 3/1/2026                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Attendance Tab View

```
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────┐  ╔═══════════════════════════╗  │
│  │ 👥 Enrolled Students  │  ║ 📋 Attendance Records (8) ║  │
│  └───────────────────────┘  ╚═══════════════════════════╝  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Jane Doe                              ⬤ Present     │  │
│  │  3/4/2026 at 9:00 AM                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  John Smith                            ⬤ Late        │  │
│  │  3/4/2026 at 9:15 AM                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Bob Johnson                           ⬤ Absent      │  │
│  │  3/4/2026 at 9:00 AM                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Enrollment Modal

```
        ┌─────────────────────────────────────┐
        │  Enroll Student                     │
        ├─────────────────────────────────────┤
        │                                     │
        │  ┌───────────────────────────────┐ │
        │  │  Sarah Williams               │ │
        │  │  ID: S001 • Grade 11 - Sec A  │ │
        │  └───────────────────────────────┘ │
        │                                     │
        │  ┌───────────────────────────────┐ │
        │  │  Mike Davis                   │ │
        │  │  ID: S002 • Grade 11 - Sec A  │ │
        │  └───────────────────────────────┘ │
        │                                     │
        │  ┌───────────────────────────────┐ │
        │  │  Lisa Brown                   │ │
        │  │  ID: S003 • Grade 11 - Sec A  │ │
        │  └───────────────────────────────┘ │
        │                                     │
        ├─────────────────────────────────────┤
        │            Close                    │
        └─────────────────────────────────────┘
```

## Empty States

### No Students Enrolled
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                          👥                                  │
│                                                              │
│              No students enrolled                            │
│                                                              │
│      Click "Enroll Student" to add students to this subject │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### No Attendance Records
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                          📋                                  │
│                                                              │
│              No attendance records                           │
│                                                              │
│  Attendance records will appear here once you start taking   │
│                      attendance                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### No Available Students (Modal)
```
        ┌─────────────────────────────────────┐
        │  Enroll Student                     │
        ├─────────────────────────────────────┤
        │                                     │
        │              👥                     │
        │                                     │
        │      No available students          │
        │                                     │
        │  All eligible students are already  │
        │   enrolled in this subject          │
        │                                     │
        ├─────────────────────────────────────┤
        │            Close                    │
        └─────────────────────────────────────┘
```

## Component States

### Tab States
```
Active Tab:
┌─────────────────────────┐
│ 👥 Enrolled Students    │  ← Indigo text, bottom border
└─────────────────────────┘

Inactive Tab:
┌─────────────────────────┐
│ 📋 Attendance Records   │  ← Slate text, no border
└─────────────────────────┘

Hover (Inactive):
┌─────────────────────────┐
│ 📋 Attendance Records   │  ← Darker text, light background
└─────────────────────────┘
```

### Button States

#### Take Attendance Button
```
Normal:
┌─────────────────────┐
│ Take Attendance     │  ← Gradient (indigo → purple)
└─────────────────────┘

Hover:
┌─────────────────────┐
│ Take Attendance     │  ← Darker gradient + shadow
└─────────────────────┘
```

#### Enroll Button
```
Normal:
┌──────────────────────────────────────┐
│        + Enroll Student              │  ← Full width gradient
└──────────────────────────────────────┘

Hover:
┌──────────────────────────────────────┐
│        + Enroll Student              │  ← Darker gradient + shadow
└──────────────────────────────────────┘
```

#### Unenroll Button
```
Normal:
┌─────────────┐
│  Unenroll   │  ← White bg, red border
└─────────────┘

Hover:
┌─────────────┐
│  Unenroll   │  ← Light red bg, red border
└─────────────┘
```

### List Item States

```
Normal:
┌──────────────────────────────────────────────────────┐
│  Jane Doe                          [Unenroll]        │
│  Enrolled: 3/1/2026                                  │
└──────────────────────────────────────────────────────┘

Hover:
┌──────────────────────────────────────────────────────┐
│  Jane Doe                          [Unenroll]        │  ← Light bg
│  Enrolled: 3/1/2026                                  │
└──────────────────────────────────────────────────────┘
```

## Status Badge Colors

```
Present:  ⬤ Present   (Green: #d1fae5 / #065f46)
Late:     ⬤ Late      (Yellow: #fef3c7 / #92400e)
Absent:   ⬤ Absent    (Red: #fee2e2 / #991b1b)
Excused:  ⬤ Excused   (Blue: #dbeafe / #1e40af)
```

## Responsive Behavior

### Desktop (>768px)
```
┌─────────────────────────────────────────────────────────────┐
│  Mathematics                          [Take Attendance]     │
│  MATH101                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Tab 1]  [Tab 2]                                           │
├─────────────────────────────────────────────────────────────┤
│  Content                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌───────────────────────────┐
│  Mathematics              │
│  MATH101                  │
│                           │
│  ┌─────────────────────┐ │
│  │ Take Attendance     │ │  ← Full width
│  └─────────────────────┘ │
└───────────────────────────┘

┌───────────────────────────┐
│ ║ Tab 1                  │  ← Vertical tabs
│ │ Tab 2                  │  ← Left border for active
├───────────────────────────┤
│  Content                  │
└───────────────────────────┘

┌───────────────────────────┐
│  Jane Doe                 │
│  Enrolled: 3/1/2026       │
│                           │
│  ┌─────────────────────┐ │
│  │    Unenroll         │ │  ← Full width
│  └─────────────────────┘ │
└───────────────────────────┘
```

## Animations

### Modal Animations
```
Open:
0ms   → Overlay fades in (0 → 1 opacity)
0ms   → Modal slides up (20px → 0) + fades in
300ms → Animation complete

Close:
0ms   → Reverse animation
200ms → Complete
```

### Tab Switch
```
0ms   → Tab clicked
0ms   → Border color changes
200ms → Transition complete
```

### Hover Effects
```
0ms   → Mouse enters
200ms → Background/shadow transition complete
```

## Interaction Flow

### Enrolling a Student
```
1. Click "Enroll Student" button
   ↓
2. Modal opens with available students
   ↓
3. Click on a student
   ↓
4. Student is enrolled
   ↓
5. Modal closes
   ↓
6. Student appears in list
```

### Unenrolling a Student
```
1. Click "Unenroll" button
   ↓
2. Confirmation dialog appears
   ↓
3. Confirm action
   ↓
4. Student is removed from list
```

### Viewing Attendance
```
1. Click "Attendance Records" tab
   ↓
2. Tab switches with animation
   ↓
3. Attendance records display
   ↓
4. Status badges show color-coded
```

## CSS Class Reference

### Layout
- `.space-y-6` - Vertical spacing (1.5rem)
- `.space-y-4` - Vertical spacing (1rem)
- `.space-y-2` - Vertical spacing (0.5rem)

### Components
- `.header` - Subject header card
- `.tabs-card` - Tabbed interface container
- `.tabs-header` - Tab buttons container
- `.tab-button` - Individual tab
- `.tab-content` - Tab content area
- `.list-item` - Student/attendance item
- `.modal-overlay` - Modal backdrop
- `.modal-content` - Modal container

### Buttons
- `.take-attendance-button` - Gradient button
- `.enroll-button` - Full width gradient
- `.unenroll-button` - Red bordered button
- `.modal-close-button` - Modal close

### Text
- `.student-name` - Bold student name
- `.student-details` - Gray details text
- `.subject-code` - Indigo subject code
- `.empty-state` - Empty state message

### Status Badges
- `.rounded-full` - Pill shape
- `.bg-green-100` - Green background
- `.text-green-800` - Green text
- (Similar for yellow, red, blue)
