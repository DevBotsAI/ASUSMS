# Design Guidelines: АСУ-Оповещение (SMS Notification System)

## Design Approach

**Selected System:** Material Design 3
**Justification:** Enterprise-grade administrative dashboard requiring robust data table patterns, form components, and clear operational states. Material Design provides comprehensive guidance for data-dense interfaces with strong accessibility foundations.

**Core Principles:**
- Operational clarity over aesthetic appeal
- Efficient information density
- Clear visual hierarchy for quick scanning
- Consistent, predictable interactions

---

## Typography System

**Font Family:** 
- Primary: Inter (Google Fonts) - exceptional readability for Cyrillic text
- Monospace: JetBrains Mono - for phone numbers and timestamps

**Type Scale:**
- Page Titles: text-2xl font-semibold (штаб names, page headers)
- Section Headers: text-lg font-medium
- Table Headers: text-sm font-medium uppercase tracking-wide
- Body Text: text-base font-normal
- Labels: text-sm font-medium
- Secondary Info: text-sm font-normal
- Caption/Timestamps: text-xs font-normal

**Line Heights:**
- Headers: leading-tight
- Body: leading-normal
- Dense tables: leading-snug

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (between related elements): space-2, gap-2
- Component internal: p-4, gap-4
- Section padding: p-6, py-8
- Major separation: space-12, mb-16

**Application Structure:**

```
┌─────────────────────────────────────────────────┐
│ Top Navigation Bar (h-16)                       │
├──────────┬──────────────────────┬────────────────┤
│          │                      │                │
│ Sidebar  │   Main Content       │  Info Panel    │
│ (w-64)   │   (flex-1)           │  (w-80)        │
│          │                      │                │
│ fixed    │   overflow-y-auto    │  sticky top-16 │
│          │                      │                │
└──────────┴──────────────────────┴────────────────┘
```

**Container Strategy:**
- Sidebar: Fixed width w-64, full viewport height
- Main content: Flexible width with max-w-none, px-8 py-6
- Info panel: Fixed width w-80, sticky positioning
- Form modals: max-w-2xl centered
- Tables: Full width within container

---

## Component Library

### Navigation Components

**Top Bar:**
- Height: h-16, px-8
- Logo/title on left
- User info/settings on right
- Elevated appearance (shadow-sm)

**Sidebar:**
- Штаб list items: px-4 py-3, rounded-lg transitions
- Active state: visual weight increase
- Add button: w-full, outlined style
- Badge for participant count: right-aligned, rounded-full px-2 py-1 text-xs

### Data Display

**Participant Table:**
- Header: sticky top-0, elevated background
- Row height: py-4
- Cell padding: px-4
- Checkbox column: w-12
- Action buttons column: w-32, right-aligned
- Zebra striping for rows (subtle)
- Hover state: entire row background change

**Table Columns:**
1. Checkbox (w-12)
2. ФИО (min-w-48)
3. Телефон (w-40, monospace font)
4. Статус (w-32, with status pill)
5. Последнее уведомление (w-48, text-sm)
6. Действия (w-32)

**Status Indicators:**
- Pill shape: rounded-full px-3 py-1 text-xs font-medium
- Icon + text combination
- Positioned in table cell or as standalone badges

### Forms & Inputs

**Input Fields:**
- Height: h-12
- Padding: px-4
- Border: border-2 with focus states
- Labels: mb-2 text-sm font-medium
- Required indicator: asterisk
- Helper text: text-xs mt-1

**Text Areas:**
- Min height: h-32
- Max height: h-64 with overflow-y-auto
- Character counter: bottom-right, text-xs

**Buttons:**
- Primary: h-11 px-6 rounded-lg font-medium
- Secondary: h-11 px-6 rounded-lg outlined
- Icon buttons: w-10 h-10 rounded-lg
- Destructive actions: use semantic indicators

**Date/Time Picker:**
- Inline calendar: max-w-sm
- Time input: grouped with date
- Quick presets: list on left side

### Modal Dialogs

**Mass SMS Modal:**
- Width: max-w-3xl
- Sections clearly separated: p-6 with dividers
- Recipient preview: max-h-40 overflow-y-auto border rounded p-4
- Message input: prominent, h-40
- Actions footer: sticky bottom, elevated, px-6 py-4

**Individual SMS Modal:**
- Width: max-w-xl
- Participant info card at top: p-4 rounded-lg
- Message composer: flex-1
- Schedule toggle: clear visual state change

### Info Panel Components

**System Status Card:**
- Fixed at top: p-4 rounded-lg
- Icon + text layout
- Pulse animation for active states
- Updates without disrupting layout

**Recent Activity Log:**
- Compact list: space-y-2
- Entry format: time (text-xs) + message (text-sm)
- Max height: h-96 overflow-y-auto
- Infinite scroll or pagination

**Statistics Cards:**
- Grid layout: grid-cols-2 gap-4
- Metric display: large number (text-3xl font-bold) + label (text-sm)
- Icon indicators for metric type
- Padding: p-4

---

## Specialized Patterns

### Excel Import Flow
- Drag-and-drop zone: border-2 border-dashed, p-12, text-center
- File preview table: max-h-96 overflow-y-auto
- Validation errors: inline with row highlighting
- Mapping interface: two-column layout for field mapping

### Bulk Selection Interface
- Select all checkbox in table header
- Bulk action toolbar: appears when items selected, sticky top position
- Selected count indicator
- Quick actions: mass SMS, schedule, delete

### Event Log Table
- Dense variant: py-2 rows instead of py-4
- Expandable rows for full details
- Filter bar: sticky top, p-4, flex gap-4
- Date range picker, status filters, search
- Export button: top-right

---

## Responsive Behavior

**Breakpoints:**
- Desktop primary (>1280px): Full three-column layout
- Tablet (768-1279px): Hide info panel, collapsible sidebar
- Mobile (<768px): Single column, hamburger menu, bottom tabs

**Mobile Adaptations:**
- Tables: horizontal scroll with fixed first column
- Modals: full-screen on mobile
- Forms: stacked layout, full-width inputs

---

## Animation Guidelines

**Use Sparingly:**
- Status transitions: 200ms ease
- Modal enter/exit: 300ms ease-out
- Sidebar expand/collapse: 250ms ease-in-out
- Row hover: 150ms ease
- Loading states: subtle pulse, no spinners on every element

**Auto-refresh Updates:**
- Smooth status pill transitions
- No full table re-renders
- Update only changed cells with brief highlight

---

## Accessibility Requirements

- All interactive elements: min h-11 touch target
- Form inputs: associated labels, error messages with aria-describedby
- Status colors: never convey information through color alone (use icons + text)
- Keyboard navigation: visible focus states, logical tab order
- Screen reader: proper ARIA labels for all dynamic content
- Cyrillic text: ensure sufficient contrast and sizing

---

## Images

**No hero images required** - this is a functional dashboard application.

**Icon Library:** Material Symbols (via CDN)
- Navigation icons: 24px
- Table action icons: 20px
- Status icons: 16px paired with text

**Logo Placement:** Top-left of navigation bar, ministry emblem if provided