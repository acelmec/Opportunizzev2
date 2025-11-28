# Design Guidelines: Insurance Broker Socio-Economic Registration System

## Design Approach

**System:** Hybrid approach combining **Fluent Design** (Microsoft) principles for productivity workflows with **Material Design** data visualization patterns

**Rationale:** This is a data-intensive, professional CRM/enterprise application requiring exceptional clarity, efficient data entry, and robust information architecture. The design prioritizes usability, scanability, and reducing cognitive load during complex multi-step workflows.

---

## Core Design Elements

### A. Typography

**Font Family:** Inter (primary), Roboto Mono (data/numbers)

**Hierarchy:**
- Page Titles: 2xl (1.5rem), semibold
- Section Headers: xl (1.25rem), semibold  
- Card/Component Titles: lg (1.125rem), medium
- Body Text: base (1rem), regular
- Helper Text/Labels: sm (0.875rem), medium
- Data/Metrics: Roboto Mono, base, medium

### B. Layout System

**Spacing Units:** Tailwind units of 2, 3, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Page margins: px-6 py-8 (mobile), px-8 py-12 (desktop)

**Grid Structure:**
- Dashboard: 12-column responsive grid
- Forms: Single column on mobile, 2-column on tablet+, 3-column for compact fields (CPF, date)
- Data tables: Full-width with horizontal scroll on mobile

### C. Component Library

**Navigation:**
- Sidebar navigation (collapsible on mobile) with icon + label
- Breadcrumbs for deep navigation contexts
- Top bar: search, notifications, user profile dropdown

**Forms:**
- Wizard stepper: Horizontal progress indicator with numbered steps
- Input fields: Outlined style with floating labels
- Validation: Inline error messages below field, red border
- Real-time validation indicators (checkmark for valid)
- Auto-save status indicator: "Saving..." / "Saved" with timestamp
- Conditional fields: Smooth slide-in animation (150ms)
- Required field indicator: Red asterisk

**Data Display:**
- Client cards: Compact cards with avatar/logo, key metrics, status badge
- Data tables: Striped rows, sortable columns, fixed header on scroll, row actions menu
- Stat cards: Large number + label + trend indicator (up/down arrow)
- Tabs: Underlined active state for section navigation (Profile, Assets, Finance, Risks, History)
- Score indicators: Progress bars or radial charts with color coding (green = high opportunity, yellow = medium, gray = low)

**Interactive Elements:**
- Primary buttons: Solid, rounded-lg
- Secondary buttons: Outlined
- Icon buttons: Ghost style for tables/cards
- Badges: Rounded-full for status (Active, Pending, Completed)
- Dropdowns: Material-style with shadow
- Modals: Centered overlay with backdrop blur
- Quick capture modal: Compact, 4-5 essential fields only

**Dashboards:**
- KPI summary cards: Grid layout (2-col mobile, 4-col desktop)
- Charts: Bar charts for lead distribution, line charts for trends, funnel for conversion
- Filters: Collapsible filter panel (left sidebar) with multi-select chips

**Search/Leadboard:**
- Search bar: Prominent, top of page with instant search
- Filter chips: Active filters shown as dismissible chips below search
- Results: Card or table view toggle

### D. Information Architecture

**Layout Patterns:**
- List views: Left panel (filters) + main content area (results)
- Detail views: Header (name, key info) + tabbed content sections
- Wizard forms: Centered single panel, max-width of 2xl
- Dashboards: Full-width with responsive grid

**Spacing & Density:**
- High density for data tables (compact row height)
- Medium density for forms (breathing room between fields)
- Low density for landing/dashboard areas (clear visual hierarchy)

### E. Animations

**Minimal, purposeful only:**
- Page transitions: None
- Modal open/close: 200ms fade
- Dropdown expand: 150ms slide
- Form field validation: Instant (no animation)
- Loading states: Subtle spinner for async operations

---

## LGPD Compliance UI

- Consent checkboxes: Explicitly separated, clear language
- Consent log viewer: Read-only table with timestamp, scope, action
- Data request forms: Simple, accessible forms for titular rights (access, deletion, portability)

---

## Images

**No hero images.** This is a professional data management application.

**Avatar/Logo placeholders:**
- Client profile: Circular avatar (initials if no photo), 64px
- Company profile: Square logo placeholder, 64px
- Empty states: Subtle illustrations for "No data yet" states (simple line art)

---

## Responsive Behavior

- Mobile: Single-column forms, collapsed sidebar, bottom tab navigation
- Tablet: 2-column forms, collapsible sidebar
- Desktop: Full sidebar visible, 3-column form grids where appropriate, expanded data tables