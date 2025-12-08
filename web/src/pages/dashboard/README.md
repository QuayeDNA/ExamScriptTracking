# Dashboard Pages

This folder contains all dashboard-related pages for the Exam Script Tracking system.

## Layout Structure

The dashboard uses a **Sidebar + TopBar** layout defined in `DashboardLayout.tsx`:

```
┌─────────────────────────────────────────┐
│         TopBar (Search, User, Notif)    │ ← 64px height
├──────┬──────────────────────────────────┤
│      │                                  │
│ Side │      Main Content Area           │
│ bar  │      (Scrollable)                │
│ 256px│                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```

## Components

### Layout Components

- **Sidebar** (`components/Sidebar.tsx`)

  - Logo and branding
  - Navigation menu with icons
  - Role-based menu items (admin section)
  - Active state highlighting
  - User info footer

- **TopBar** (`components/TopBar.tsx`)
  - Search bar for global search
  - Theme toggle (light/dark mode)
  - Notification center
  - User dropdown menu
  - Logout functionality

### Dashboard Pages

#### Main Pages

**DashboardStatsPage.tsx** (Default view)

- Overview statistics cards
- Quick metrics for admins
- Role-specific dashboards
- Recent activity summary

**SessionsPage.tsx** (My Sessions)

- User's exam sessions
- Session management
- Attendance tracking

**StudentsPage.tsx**

- Student list and management
- Import/export functionality
- Student search and filtering

**ExamSessionsPage.tsx**

- All exam sessions overview
- Batch creation and management
- Session status tracking

**BatchTrackingPage.tsx**

- Track batch movement through workflow
- Transfer requests and confirmations
- Status visualization

**BatchDetailsPage.tsx**

- Detailed view of specific batch
- Scripts within batch
- Status history and audit trail

**SettingsPage.tsx**

- User profile settings
- Notification preferences
- Password management

#### Admin Pages

**UsersPage.tsx** (Admin only)

- User management interface
- Create/deactivate users
- Role assignment
- Bulk operations

**AnalyticsDashboardPage.tsx** (Admin only)

- System-wide analytics
- Charts and visualizations
- Performance metrics

**AuditLogsPage.tsx** (Admin only)

- System audit trail
- User activity logs
- Security monitoring

## Design System Implementation

All dashboard pages follow these design system guidelines:

### Layout Pattern

```tsx
export default function PageName() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Page Title</h1>
          <p className="text-muted-foreground">Page description</p>
        </div>
        <div className="flex gap-2">{/* Action buttons */}</div>
      </div>

      {/* Stats Cards (optional) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>...</Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Section Title</CardTitle>
        </CardHeader>
        <CardContent>{/* Content */}</CardContent>
      </Card>
    </div>
  );
}
```

### Component Usage

- **Cards**: Use `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- **Buttons**: Use `Button` with variants (default, secondary, outline, ghost, destructive)
- **Forms**: Use `Input`, `Label`, `Select`, `Checkbox`, `Switch`
- **Feedback**: Use `Alert` for messages, `toast()` for notifications
- **Tables**: Use semantic table components with proper styling
- **Badges**: Use `Badge` with status colors
- **Icons**: Use Lucide React icons consistently

### Color Usage

```tsx
// ✅ CORRECT - Use semantic tokens
className = "bg-card text-card-foreground border-border";
className = "bg-primary text-primary-foreground";
className = "bg-destructive text-destructive-foreground";

// ❌ WRONG - Don't use hardcoded colors
className = "bg-white text-gray-900 border-gray-200";
className = "bg-blue-500 text-white";
```

### Responsive Design

```tsx
// Use responsive grid layouts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

// Use responsive flex layouts
<div className="flex flex-col md:flex-row gap-4">

// Hide elements on mobile
<div className="hidden md:block">
```

## Navigation

Dashboard routes are organized under `/dashboard`:

- `/dashboard` → DashboardStatsPage (default)
- `/dashboard/sessions` → SessionsPage
- `/dashboard/students` → StudentsPage
- `/dashboard/exam-sessions` → ExamSessionsPage
- `/dashboard/exam-sessions/:id` → BatchDetailsPage
- `/dashboard/batch-tracking` → BatchTrackingPage
- `/dashboard/settings` → SettingsPage

### Admin Routes (protected)

- `/dashboard/users` → UsersPage
- `/dashboard/analytics` → AnalyticsDashboardPage
- `/dashboard/audit-logs` → AuditLogsPage

## State Management

- **Auth State**: `useAuthStore()` for user info
- **Queries**: `@tanstack/react-query` for data fetching
- **Notifications**: `useNotificationStore()` for real-time updates
- **Socket**: `useSocket()` for real-time connections

## Best Practices

1. **Always wrap content in proper Cards** for consistent styling
2. **Use semantic color tokens** never hardcoded colors
3. **Include loading and error states** for all data operations
4. **Implement proper form validation** with clear error messages
5. **Add keyboard shortcuts** for common actions where appropriate
6. **Ensure responsive design** works on mobile, tablet, desktop
7. **Follow accessibility guidelines** (ARIA labels, keyboard navigation)
8. **Use consistent spacing** following the 4px base unit system

## Imports

Use the index file for convenient imports:

```tsx
import { DashboardStatsPage, UsersPage, SessionsPage } from "@/pages/dashboard";
```
