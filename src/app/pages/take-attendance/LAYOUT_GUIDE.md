# Take Attendance - Two Column Layout Guide

## Desktop Layout (>1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Take Attendance                                                            │
│  Mark student attendance via QR code or manually                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Select Subject                                                             │
│  [Mathematics (MATH101)                                              ▼]     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬──────────────────────────────────────┐
│  👥 Enrolled Students (5)            │  📷 Scan QR Code                     │
├──────────────────────────────────────┼──────────────────────────────────────┤
│                                      │                                      │
│  ┌────────────────────────────────┐ │  ┌────────────────────────────────┐ │
│  │  Jane Doe              [Mark▼] │ │  │                                │ │
│  │  ID: S001 • Grade 11 - A       │ │  │        📹                      │ │
│  └────────────────────────────────┘ │  │                                │ │
│                                      │  │    Camera Active               │ │
│  ┌────────────────────────────────┐ │  │    Position QR code in frame   │ │
│  │  John Smith            [Mark▼] │ │  │                                │ │
│  │  ID: S002 • Grade 11 - A       │ │  │                                │ │
│  └────────────────────────────────┘ │  └────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────┐ │  ┌────────────────────────────────┐ │
│  │  Bob Johnson           [Mark▼] │ │  │ Enter Student ID...            │ │
│  │  ID: S003 • Grade 11 - A       │ │  └────────────────────────────────┘ │
│  └────────────────────────────────┘ │  [Mark Present]                      │
│                                      │                                      │
│  ┌────────────────────────────────┐ │  ┌────────────────────────────────┐ │
│  │  Sarah Williams        [Mark▼] │ │  │      Stop Camera               │ │
│  │  ID: S004 • Grade 11 - A       │ │  └────────────────────────────────┘ │
│  └────────────────────────────────┘ │                                      │
│                                      │                                      │
│  ┌────────────────────────────────┐ │                                      │
│  │  Mike Davis            [Mark▼] │ │                                      │
│  │  ID: S005 • Grade 11 - A       │ │                                      │
│  └────────────────────────────────┘ │                                      │
│                                      │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

## Key Improvements

### Before (Single Column)
```
┌─────────────────────────────────────┐
│  📷 Scan QR Code                    │
│  ┌───────────────────────────────┐ │
│  │  [Start Camera - Full Width]  │ │  ← Button stretched
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  👥 Enrolled Students               │
│  ┌───────────────────────────────┐ │
│  │  Student 1        [Mark▼]     │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### After (Two Column)
```
┌──────────────────────┬──────────────────────┐
│  👥 Students         │  📷 QR Scanner       │
│  [Compact buttons]   │  [Compact buttons]   │  ← Better proportions
└──────────────────────┴──────────────────────┘
```

## Layout Breakdown

### Left Column (60% width)
- **Purpose**: Student list with quick marking
- **Width**: 1.5fr (60% of available space)
- **Content**:
  - Section header with icon
  - Scrollable student list (max-height: 600px)
  - Each student item with dropdown
  - Marked badge for completed students

### Right Column (40% width)
- **Purpose**: QR code scanning
- **Width**: 1fr (40% of available space)
- **Content**:
  - Section header with icon
  - Camera view (4:3 aspect ratio)
  - Manual input field
  - Mark Present button
  - Stop Camera button

## Responsive Behavior

### Desktop (>1024px)
```
┌─────────────────────┬─────────────────┐
│                     │                 │
│   Students (60%)    │  Scanner (40%)  │
│                     │                 │
└─────────────────────┴─────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────────────────────────────┐
│           Scanner (100%)            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          Students (100%)            │
└─────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────────┐
│           Scanner (100%)            │
│  [Full width buttons]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          Students (100%)            │
│  [Stacked layout]                   │
└─────────────────────────────────────┘
```

## Button Sizing Comparison

### Before (Full Width)
```
┌───────────────────────────────────────────────────────┐
│              Start Camera                             │  ← Too wide
└───────────────────────────────────────────────────────┘
```

### After (Constrained Width)
```
┌─────────────────────────────┐
│      Start Camera           │  ← Perfect size
└─────────────────────────────┘
```

## Student Item Layout

### Desktop
```
┌──────────────────────────────────────────────────┐
│  Jane Doe                          [Mark... ▼]   │
│  ID: S001 • Grade 11 - A                         │
└──────────────────────────────────────────────────┘
```

### Mobile (Stacked)
```
┌──────────────────────────────────────────────────┐
│  Jane Doe                                        │
│  ID: S001 • Grade 11 - A                         │
│  ┌────────────────────────────────────────────┐ │
│  │           Mark...                      ▼   │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Scanner States

### Inactive (Start Camera)
```
┌─────────────────────────────┐
│  📷 Scan QR Code            │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐ │
│  │   📷 Start Camera     │ │
│  └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```

### Active (Camera Running)
```
┌─────────────────────────────┐
│  📷 Scan QR Code            │
├─────────────────────────────┤
│  ┌───────────────────────┐ │
│  │                       │ │
│  │    📹 Camera Active   │ │
│  │                       │ │
│  └───────────────────────┘ │
│                             │
│  [Enter Student ID...]      │
│  [Mark Present]             │
│                             │
│  [Stop Camera]              │
└─────────────────────────────┘
```

## Color Scheme

### Students Column
- Background: White (#ffffff)
- Border: Slate-200 (#e2e8f0)
- Hover: Slate-50 (#f8fafc)
- Text: Slate-800 (#1e293b)
- Details: Slate-500 (#64748b)

### Scanner Column
- Background: White (#ffffff)
- Camera: Slate-900 (#0f172a)
- Frame: Indigo-600 (#6366f1)
- Buttons: Gradient (Indigo → Purple)

### Status Badges
- Marked: Green (#d1fae5 / #065f46)
- Present: Green
- Late: Yellow
- Absent: Red
- Excused: Blue

## Advantages of Two-Column Layout

1. **Better Button Proportions**
   - Buttons no longer stretched across full width
   - More natural sizing for actions
   - Better visual hierarchy

2. **Efficient Space Usage**
   - Scanner and student list visible simultaneously
   - No need to scroll between sections
   - Faster workflow

3. **Improved Workflow**
   - Scan QR on right
   - See results on left immediately
   - Quick manual marking available

4. **Professional Appearance**
   - Balanced layout
   - Clear separation of concerns
   - Modern dashboard feel

5. **Responsive Design**
   - Stacks on mobile for usability
   - Scanner shown first on mobile
   - Full-width buttons on small screens

## Grid Configuration

```css
.two-column-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;  /* 60% / 40% split */
  gap: 1.5rem;
}

@media (max-width: 1023px) {
  .two-column-layout {
    grid-template-columns: 1fr;  /* Stack on tablet/mobile */
  }
}
```

## Scrolling Behavior

### Students List
- Max height: 600px (desktop)
- Max height: 400px (mobile)
- Overflow: auto
- Smooth scrolling

### Scanner Column
- Fixed height based on content
- No scrolling needed
- Camera maintains 4:3 aspect ratio
