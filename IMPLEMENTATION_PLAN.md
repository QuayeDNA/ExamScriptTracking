# Exam Script Tracking System - Implementation Plan

**Created:** December 4, 2025  
**Updated:** December 6, 2025  
**Status:** Design System Implementation Phase  
**Current Progress:** 95% Complete (Core Features)

---

## 🎨 Current Focus: Web Dashboard Redesign

### Phase 1: Foundation ✅ COMPLETED

**Objective:** Set up design system infrastructure and theming capabilities

#### Completed Tasks (December 6, 2025)

✅ **Design System Documentation**

- Created `DESIGN_SYSTEM.md` with comprehensive design language
- Defined color palette (primary, semantic, status, neutral)
- Established typography system (Inter, JetBrains Mono fonts)
- Set spacing scale (4px base unit)
- Documented shadows, motion, and component patterns

✅ **Design Tokens Implementation**

- Created `web/src/styles/design-tokens.css` with all CSS variables
- Primary colors: Academic blue palette (50-950 scale)
- Semantic colors: Success, Warning, Error, Info
- Status colors: Mapped to 9-stage batch workflow
- Dark mode colors with reduced shadow intensity
- Spacing system: 0px to 128px with semantic tokens
- Border radius: 4px to 32px + full circles
- Shadows & elevation: 5 levels with colored variants
- Motion tokens: Duration (150ms-700ms) and easing curves

✅ **Tailwind Configuration**

- Updated `web/tailwind.config.js` with design system tokens
- Font family configuration (Inter, JetBrains Mono, Cal Sans)
- Font size scale with 1.125 ratio (Major Third)
- Letter spacing and line heights
- Extended color palette with RGB/HSL support
- Border radius using CSS variables
- Spacing scale mapped to tokens
- Box shadow extensions
- Animation duration and timing functions
- Container widths and breakpoints

✅ **Theme Provider**

- Created `web/src/components/theme-provider.tsx`
- Supports light, dark, and system themes
- LocalStorage persistence
- System theme change detection
- Context API for theme management

✅ **Theme Toggle Component**

- Created `web/src/components/ThemeToggle.tsx`
- Dropdown with Sun, Moon, Monitor icons (Lucide)
- Visual feedback for active theme
- Integrated into DashboardLayout

✅ **Application Setup**

- Updated `web/src/index.css` to import design tokens
- Wrapped App in ThemeProvider
- Updated DashboardLayout with theme-aware colors
- Applied design system classes (transition-colors-fast)

#### Files Modified

- ✅ `web/src/styles/design-tokens.css` (NEW)
- ✅ `web/tailwind.config.js` (UPDATED)
- ✅ `web/src/index.css` (UPDATED)
- ✅ `web/src/App.tsx` (UPDATED)
- ✅ `web/src/components/theme-provider.tsx` (NEW)
- ✅ `web/src/components/ThemeToggle.tsx` (NEW)
- ✅ `web/src/layouts/DashboardLayout.tsx` (UPDATED)

---

### Phase 2: Core Components (Week 2 - IN PROGRESS)

**Objective:** Create reusable, accessible components following design system

#### Planned Tasks

🔲 **Button Variants**

- [ ] Primary button (elevation-2, shadow-primary on hover)
- [ ] Secondary button (outline, muted background)
- [ ] Ghost button (transparent, muted hover)
- [ ] Destructive button (error colors)
- [ ] Icon button (square, icon-only)
- [ ] Size variants: sm, md, lg
- [ ] Loading states with spinner
- [ ] Disabled states

🔲 **Form Components**

- [ ] Text input with focus ring
- [ ] Textarea with auto-resize
- [ ] Select dropdown with search
- [ ] Checkbox with indeterminate state
- [ ] Radio button groups
- [ ] Switch toggle
- [ ] Form field wrapper with label/error
- [ ] Validation error messages

🔲 **Card Components**

- [ ] Base card (elevation-2)
- [ ] Interactive card (hover lift animation)
- [ ] Card with header/footer sections
- [ ] Stat card with icon and trend
- [ ] Gradient card for emphasis

🔲 **Badge Components**

- [ ] Status badges with workflow colors
- [ ] Dot badges for notifications
- [ ] Pill badges for counts
- [ ] Size variants: sm, md, lg

🔲 **Modal/Dialog Components**

- [ ] Base dialog with backdrop
- [ ] Confirmation dialog
- [ ] Form dialog
- [ ] Full-screen dialog
- [ ] Slide-over panel

🔲 **Toast Notifications**

- [ ] Success toast (with auto-dismiss)
- [ ] Error toast (with retry action)
- [ ] Warning toast
- [ ] Info toast
- [ ] Toast queue management
- [ ] Custom duration and position

#### Component Guidelines

- Use design tokens from `design-tokens.css`
- Follow accessibility standards (WCAG 2.1 AA)
- Include keyboard navigation
- Add proper ARIA labels
- Support dark mode
- Include loading/error states
- Add comprehensive TypeScript types

---

### Phase 3: Layout System (Week 3)

**Objective:** Build responsive layout structure

#### Planned Tasks

🔲 **Sidebar Navigation**

- [ ] Collapsible sidebar (256px → 64px)
- [ ] Active route highlighting
- [ ] Icon + text navigation items
- [ ] Role-based menu filtering
- [ ] Nested navigation groups
- [ ] Mobile drawer version

🔲 **Top Bar**

- [ ] Global search with keyboard shortcut (Cmd/Ctrl+K)
- [ ] Notification bell with count badge
- [ ] User profile dropdown
- [ ] Theme toggle (already created ✅)
- [ ] Breadcrumb navigation

🔲 **Dashboard Layout Wrapper**

- [ ] Flex layout: sidebar + content
- [ ] Responsive breakpoints
- [ ] Sticky header
- [ ] Footer component
- [ ] Loading skeleton

🔲 **Container Components**

- [ ] Page container (max-width, padding)
- [ ] Section container (with spacing)
- [ ] Grid layout utilities
- [ ] Flex layout utilities

---

### Phase 4: Authentication Flow Redesign (Week 4)

**Objective:** Redesign auth pages with new design system

#### Planned Tasks

🔲 **Login Page**

- [ ] Centered card layout (max-w-md)
- [ ] Logo and welcome message
- [ ] Email/password form with validation
- [ ] "Remember me" checkbox
- [ ] "Forgot password" link
- [ ] Loading state on submit
- [ ] Error message display
- [ ] Success transition animation
- [ ] Background gradient with subtle pattern

🔲 **Forgot Password Page**

- [ ] Email input form
- [ ] Clear instructions
- [ ] Back to login link
- [ ] Success confirmation
- [ ] Rate limit messaging

🔲 **Password Reset Page**

- [ ] Token validation
- [ ] New password input (with strength meter)
- [ ] Confirm password input
- [ ] Password requirements checklist
- [ ] Success redirect to login

🔲 **Change Password Page**

- [ ] Current password verification
- [ ] New password with strength indicator
- [ ] Password requirements
- [ ] Success toast notification

🔲 **Common Auth Features**

- [ ] Input focus states (ring effect)
- [ ] Password visibility toggle
- [ ] Form validation with inline errors
- [ ] Loading spinner on submit
- [ ] Network error handling
- [ ] Responsive design (mobile-first)
- [ ] Smooth transitions between states

---

## 📊 Previous Implementation Status

### ✅ Completed Features (95% Overall)

#### Backend API (100% Complete)

- ✅ User authentication (JWT)
- ✅ Role-based access control (RBAC)
- ✅ Exam session management
- ✅ Batch status workflow (NOT_STARTED → COMPLETED)
- ✅ Student attendance tracking
- ✅ Batch transfer system (custody chain)
- ✅ Audit logging
- ✅ Real-time notifications (Socket.io)
- ✅ Password reset functionality
- ✅ Profile picture upload
- ✅ Token blacklist for logout

#### Web Dashboard (95% Complete)

- ✅ Dashboard with statistics
- ✅ User management (Admin only)
- ✅ Exam session creation and listing
- ✅ Student management with CSV import
- ✅ Batch details with attendance
- ✅ Batch tracking with status timeline
- ✅ Real-time notification center
- ✅ Batch status flow with End Session
- ✅ Analytics dashboard with charts
- ✅ Audit logs viewer
- ✅ Settings page with profile/password management
- 🔄 **IN PROGRESS:** Design system implementation

#### Mobile App (95% Complete)

- ✅ Authentication (login, logout, change password)
- ✅ QR code scanning (batch + student)
- ✅ Student attendance recording
- ✅ Batch transfer initiation
- ✅ Transfer confirmation/rejection
- ✅ Custody tracking
- ✅ Transfer history
- ✅ End exam session functionality
- ✅ Real-time push notifications (Expo)
- ✅ Development client via EAS Build
- ✅ Drawer with batch status display

#### Infrastructure (100% Complete)

- ✅ PostgreSQL database with Prisma ORM
- ✅ Database migrations (6 total)
- ✅ Seed data for testing
- ✅ Socket.io server integration
- ✅ EAS Build configuration for mobile
- ✅ Development environment setup

---

## 🎯 Post-Design System Priorities

### After Phase 4 Completion

**P1: Apply Design System to Existing Pages**

- Dashboard stats cards
- Exam session tables
- Batch details page
- User management page
- Analytics dashboard
- Settings page

**P2: Advanced Features**

- Global search functionality
- Keyboard shortcuts
- Advanced filters
- Bulk operations
- Export functionality (PDF/Excel)

**P3: Performance Optimization**

- Code splitting
- Lazy loading
- Image optimization
- Bundle size reduction
- Caching strategies

**P4: Testing**

- Unit tests (Jest)
- Component tests (React Testing Library)
- E2E tests (Playwright)
- Accessibility testing

---

## 📝 Original Roadmap Reference

### **Phase 1: Analytics & Reports Dashboard (Weeks 1-3)** - COMPLETED ✅

- - Transfers handled per handler
- - Average response time
- - Discrepancy rate
- - Most active handlers
-
- GET /api/analytics/discrepancies
- - Total discrepancies by type
- - Trend over time
- - Most common issues
- - Resolution rate
-
- GET /api/analytics/exam-stats
- - Exams by status
- - Exams by department/faculty
- - Peak exam periods
- - Completion rates
-
- Query params: startDate, endDate, department, faculty
  \*/

````

**Task 1.2: Export Service (PDF/Excel)**

```bash
# Install dependencies
cd backend
npm install pdfkit exceljs

# Create service
# File: backend/src/services/exportService.ts
````

```typescript
/**
 * Create export service with methods:
 *
 * 1. generateBatchManifestPDF(examSessionId)
 *    - Batch details, QR code, student list
 *    - Attendance statistics
 *    - Custody chain
 *
 * 2. generateAttendanceReportPDF(examSessionId)
 *    - Student attendance list
 *    - Entry/exit/submission times
 *    - Discrepancies highlighted
 *
 * 3. generateHandlerPerformanceExcel(handlerId, dateRange)
 *    - Transfers handled
 *    - Response times
 *    - Discrepancy rate
 *
 * 4. generateDiscrepancyReportPDF(dateRange)
 *    - All discrepancies in period
 *    - Resolution status
 *    - Responsible handlers
 *
 * Add endpoint: GET /api/reports/export/:type/:id?format=pdf|excel
 */
```

**Task 1.3: Add Analytics Route**

```typescript
// File: backend/src/routes/analytics.ts
import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import * as analyticsController from "../controllers/analyticsController";

const router = Router();

// All analytics endpoints require ADMIN role
router.get(
  "/overview",
  authenticate,
  requireRole(["ADMIN"]),
  analyticsController.getOverview
);
router.get(
  "/handler-performance",
  authenticate,
  requireRole(["ADMIN"]),
  analyticsController.getHandlerPerformance
);
router.get(
  "/discrepancies",
  authenticate,
  requireRole(["ADMIN"]),
  analyticsController.getDiscrepancies
);
router.get(
  "/exam-stats",
  authenticate,
  requireRole(["ADMIN"]),
  analyticsController.getExamStats
);

export default router;
```

#### Web Frontend Tasks (Week 2-3)

**Task 2.1: Install shadcn/ui Components**

```bash
cd web

# Install Tailwind plugins and dependencies
npm install @radix-ui/react-icons recharts @tanstack/react-table
npm install date-fns

# Install shadcn/ui components
npx shadcn@latest init
npx shadcn@latest add button card table badge dialog skeleton toast tabs select calendar popover dropdown-menu
```

**Task 2.2: Configure Design Tokens**

```typescript
// File: web/tailwind.config.js
// Update with design tokens from PROJECT_STATUS.md Design System section

module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#3b82f6",
          secondary: "#8b5cf6",
          accent: "#10b981",
        },
        status: {
          progress: "#3b82f6",
          submitted: "#10b981",
          transit: "#f59e0b",
          // ... rest from PROJECT_STATUS.md
        },
        custody: {
          inCustody: "#10b981",
          pendingReceipt: "#f59e0b",
          initiated: "#8b5cf6",
          transferred: "#6b7280",
        },
      },
    },
  },
};
```

**Task 2.3: Analytics Dashboard Page**

```typescript
// File: web/src/pages/AnalyticsDashboardPage.tsx

/**
 * Structure:
 *
 * 1. Header with date range picker (last 7/30/90 days, custom)
 *
 * 2. Overview Cards (Grid 4 columns)
 *    - Total Exams (with trend ↑/↓)
 *    - Active Batches
 *    - Total Handlers
 *    - Discrepancies (with severity badge)
 *
 * 3. Charts Section (Grid 2 columns)
 *    - Exam Trends Over Time (Line Chart)
 *    - Handler Workload (Bar Chart)
 *    - Batch Status Distribution (Pie Chart)
 *    - Attendance Trends (Area Chart)
 *
 * 4. Performance Metrics Table
 *    - Handler name, transfers handled, avg response time, discrepancy rate
 *    - Sortable, filterable
 *
 * 5. Quick Actions
 *    - Generate Report button
 *    - Export Data button
 *    - View Discrepancies button
 *
 * Use shadcn/ui Card, Badge, Tabs components
 * Use Recharts for all charts
 */
```

**Task 2.4: Reports Page**

```typescript
// File: web/src/pages/ReportsPage.tsx

/**
 * Tabs:
 * 1. Discrepancy Reports
 * 2. Handler Performance
 * 3. Exam Statistics
 *
 * Each tab has:
 * - Date range picker (shadcn/ui Calendar)
 * - Filters (Department, Faculty, Status)
 * - Export buttons (PDF/Excel)
 * - Results table (TanStack Table with sorting, pagination)
 *
 * Discrepancy Reports Tab:
 * - Table: Date, Batch, Handler, Issue Type, Status, Actions
 * - Click row to view details
 *
 * Handler Performance Tab:
 * - Table: Handler, Transfers, Avg Time, Discrepancy Rate, Rating
 * - Chart: Handler comparison
 *
 * Exam Statistics Tab:
 * - Table: Exam Date, Course, Department, Students, Completion %
 * - Chart: Completion trends
 */
```

**Task 2.5: Reusable Chart Components**

```typescript
// File: web/src/components/charts/LineChart.tsx
// File: web/src/components/charts/BarChart.tsx
// File: web/src/components/charts/PieChart.tsx
// File: web/src/components/charts/AreaChart.tsx

/**
 * Create reusable chart components using Recharts
 *
 * Props:
 * - data: any[]
 * - xKey: string
 * - yKey: string
 * - title?: string
 * - color?: string (use Tailwind design tokens)
 *
 * Match design system colors:
 * - brand.primary for primary lines/bars
 * - status.* for status-based colors
 *
 * Add responsive behavior (ResponsiveContainer)
 * Add tooltips and legends
 */
```

**Task 2.6: API Client for Analytics**

```typescript
// File: web/src/api/analytics.ts

export const analyticsApi = {
  getOverview: (params?: DateRangeParams) =>
    api.get("/analytics/overview", { params }),

  getHandlerPerformance: (params?: DateRangeParams) =>
    api.get("/analytics/handler-performance", { params }),

  getDiscrepancies: (params?: DateRangeParams & FilterParams) =>
    api.get("/analytics/discrepancies", { params }),

  getExamStats: (params?: DateRangeParams & FilterParams) =>
    api.get("/analytics/exam-stats", { params }),

  exportReport: (
    type: ReportType,
    id?: string,
    format: "pdf" | "excel" = "pdf"
  ) =>
    api.get(`/reports/export/${type}/${id}`, {
      params: { format },
      responseType: "blob", // For file download
    }),
};
```

**Task 2.7: Navigation Updates**

```typescript
// File: web/src/App.tsx or layout component

/**
 * Add to sidebar navigation:
 * - Analytics (BarChart icon from lucide-react)
 * - Reports (FileText icon)
 *
 * Add routes:
 * <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboardPage /></ProtectedRoute>} />
 * <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
 *
 * Update ProtectedRoute to check ADMIN role for these routes
 */
```

---

### **Phase 2: Real-time Communication (Weeks 4-5)**

#### Goals:

- ✅ Enable instant transfer notifications
- ✅ Live batch status updates
- ✅ Real-time dashboard data
- ✅ Push notifications on mobile

#### Backend Tasks (Week 4)

**Task 3.1: Socket.io Server Setup**

```bash
cd backend
npm install socket.io
```

```typescript
// File: backend/src/server.ts

import { Server } from "socket.io";
import { authenticate as socketAuth } from "./middleware/socketAuth";

// After Express server setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Socket authentication middleware
io.use(socketAuth);

// Namespaces
const transfersNamespace = io.of("/transfers");
const batchesNamespace = io.of("/batches");
const dashboardNamespace = io.of("/dashboard");

// Transfer events
transfersNamespace.on("connection", (socket) => {
  console.log("User connected to transfers:", socket.data.userId);

  // Join handler's room
  socket.join(`handler:${socket.data.userId}`);

  socket.on("disconnect", () => {
    console.log("User disconnected from transfers");
  });
});

// Batch events
batchesNamespace.on("connection", (socket) => {
  socket.on("join:batch", (batchId) => {
    socket.join(`batch:${batchId}`);
  });

  socket.on("leave:batch", (batchId) => {
    socket.leave(`batch:${batchId}`);
  });
});

// Dashboard events (admins only)
dashboardNamespace.use((socket, next) => {
  if (socket.data.role !== "ADMIN") {
    return next(new Error("Unauthorized"));
  }
  next();
});

export { io, transfersNamespace, batchesNamespace, dashboardNamespace };
```

**Task 3.2: Socket Authentication Middleware**

```typescript
// File: backend/src/middleware/socketAuth.ts

import { Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = verifyAccessToken(token);

    // Attach user data to socket
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
};
```

**Task 3.3: Emit Events from Controllers**

```typescript
// File: backend/src/controllers/batchTransferController.ts

import { transfersNamespace } from "../server";

// In createTransfer function
export const createTransfer = async (req: Request, res: Response) => {
  // ... existing transfer creation logic

  // Emit real-time event
  transfersNamespace
    .to(`handler:${transfer.receivingHandlerId}`)
    .emit("transfer:new", {
      transferId: transfer.id,
      fromHandler: transfer.fromHandler.name,
      batchCode: transfer.examSession.batchQrCode,
      scriptCount: transfer.scriptCount,
      createdAt: transfer.createdAt,
    });

  res.json(transfer);
};

// In confirmTransfer function
export const confirmTransfer = async (req: Request, res: Response) => {
  // ... existing confirm logic

  // Emit to both handlers
  transfersNamespace
    .to(`handler:${transfer.fromHandlerId}`)
    .to(`handler:${transfer.receivingHandlerId}`)
    .emit("transfer:accepted", {
      transferId: transfer.id,
      status: transfer.status,
      confirmedAt: transfer.receivedAt,
    });

  // Emit batch status update
  batchesNamespace
    .to(`batch:${transfer.examSessionId}`)
    .emit("batch:status-update", {
      batchId: transfer.examSessionId,
      status: updatedSession.status,
      currentHandler: transfer.receivingHandler.name,
    });

  res.json(transfer);
};
```

**Task 3.4: Push Notification Schema**

```prisma
// File: backend/prisma/schema.prisma

model PushToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique // Expo push token
  platform  String   // "ios" | "android" | "web"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // "TRANSFER_NEW" | "TRANSFER_ACCEPTED" | etc.
  title     String
  body      String
  data      Json?    // Additional data
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
}

// Update User model
model User {
  // ... existing fields
  pushTokens    PushToken[]
  notifications Notification[]
}
```

**Task 3.5: Push Notification Service**

```bash
npm install expo-server-sdk
```

```typescript
// File: backend/src/services/pushNotificationService.ts

import { Expo, ExpoPushMessage } from "expo-server-sdk";
import prisma from "../prisma/client";

const expo = new Expo();

export const sendPushNotification = async (
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: any;
  }
) => {
  // Get user's push tokens
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
  });

  if (!tokens.length) return;

  // Create messages
  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token.token,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data,
  }));

  // Send notifications
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Push notification error:", error);
    }
  }

  // Save notification to database
  await prisma.notification.create({
    data: {
      userId,
      type: notification.data?.type || "GENERAL",
      title: notification.title,
      body: notification.body,
      data: notification.data,
    },
  });
};
```

#### Web Frontend Tasks (Week 4)

**Task 4.1: Socket.io Client Integration**

```bash
cd web
npm install socket.io-client
```

```typescript
// File: web/src/hooks/useSocket.ts

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";

export const useSocket = (namespace: string = "") => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    const socketInstance = io(`${import.meta.env.VITE_API_URL}${namespace}`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, namespace]);

  return { socket, connected };
};
```

**Task 4.2: Notification Provider**

```typescript
// File: web/src/providers/NotificationProvider.tsx

import { createContext, useContext, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../components/ui/use-toast";

const NotificationContext = createContext({});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { socket } = useSocket("/transfers");
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    // Listen for transfer events
    socket.on("transfer:new", (data) => {
      toast({
        title: "New Transfer Request",
        description: `${data.fromHandler} wants to transfer batch ${data.batchCode}`,
        action: (
          <Button onClick={() => navigate(`/transfers/${data.transferId}`)}>
            View
          </Button>
        ),
      });
    });

    socket.on("transfer:accepted", (data) => {
      toast({
        title: "Transfer Accepted",
        description: "Your transfer request was accepted",
        variant: "success",
      });
    });

    return () => {
      socket.off("transfer:new");
      socket.off("transfer:accepted");
    };
  }, [socket]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};
```

#### Mobile Tasks (Week 5)

**Task 5.1: Push Notifications Setup**

```bash
cd mobile
npx expo install expo-notifications
```

```json
// File: mobile/app.json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#3b82f6"
        }
      ]
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

**Task 5.2: Notification Service**

```typescript
// File: mobile/utils/notificationService.ts

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { authApi } from "../api/auth";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3b82f6",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Push token:", token);

  // Send token to backend
  await authApi.registerPushToken(token, Platform.OS);

  return token;
};

export const addNotificationListener = (
  callback: (notification: any) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

export const addNotificationResponseListener = (
  callback: (response: any) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};
```

**Task 5.3: Socket.io Mobile Integration**

```bash
cd mobile
npm install socket.io-client
```

```typescript
// File: mobile/hooks/useSocket.ts

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";
import { AppState } from "react-native";

export const useSocket = (namespace: string = "") => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    const socketInstance = io(
      `${process.env.EXPO_PUBLIC_API_URL}${namespace}`,
      {
        auth: { token },
        reconnection: true,
        transports: ["websocket"], // Force websocket for mobile
      }
    );

    socketInstance.on("connect", () => {
      setConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        socketInstance.connect();
      } else if (nextAppState === "background") {
        socketInstance.disconnect();
      }
    });

    return () => {
      socketInstance.disconnect();
      subscription.remove();
    };
  }, [token, namespace]);

  return { socket, connected };
};
```

**Task 5.4: Transfer Notifications Integration**

```typescript
// File: mobile/app/(tabs)/custody.tsx

import { useSocket } from "../../hooks/useSocket";
import { addNotificationListener } from "../../utils/notificationService";
import { Alert } from "react-native";

export default function CustodyScreen() {
  const { socket } = useSocket("/transfers");

  useEffect(() => {
    if (!socket) return;

    // Listen for transfer events
    socket.on("transfer:new", (data) => {
      Alert.alert(
        "New Transfer Request",
        `${data.fromHandler} wants to transfer batch ${data.batchCode}`,
        [
          { text: "Later", style: "cancel" },
          {
            text: "View",
            onPress: () =>
              router.push(`/confirm-transfer?id=${data.transferId}`),
          },
        ]
      );

      // Refetch custody data
      refetch();
    });

    socket.on("transfer:accepted", (data) => {
      Alert.alert("Transfer Accepted", "Your transfer request was accepted");
      refetch();
    });

    return () => {
      socket.off("transfer:new");
      socket.off("transfer:accepted");
    };
  }, [socket]);

  // ... rest of component
}
```

---

### **Phase 3: UI/UX Polish (Weeks 6-7)**

#### Goals:

- ✅ Consistent design system implementation
- ✅ Toast notifications
- ✅ Loading states and skeletons
- ✅ Confirmation dialogs
- ✅ Error boundaries

#### Web Tasks (Week 6)

**Task 6.1: Toast Notification System**

```typescript
// Already included in shadcn/ui, just implement usage

// File: web/src/components/ui/use-toast.ts (auto-generated by shadcn)
// File: web/src/components/ui/toaster.tsx

// Usage throughout app:
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

// Success
toast({
  title: "Success",
  description: "Batch created successfully",
  variant: "success",
});

// Error
toast({
  title: "Error",
  description: "Failed to create batch",
  variant: "destructive",
});
```

**Task 6.2: Loading Skeletons**

```typescript
// File: web/src/components/ui/skeleton.tsx (from shadcn)

// Create page-specific skeletons
// File: web/src/components/skeletons/TableSkeleton.tsx
export const TableSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

// File: web/src/components/skeletons/CardSkeleton.tsx
export const CardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-24 w-full" />
    </CardContent>
  </Card>
);

// Use in pages with loading states
const { data, isLoading } = useQuery(...);

if (isLoading) return <TableSkeleton />;
```

**Task 6.3: Confirmation Dialogs**

```typescript
// File: web/src/components/ui/alert-dialog.tsx (from shadcn)

// Create reusable confirmation dialog
// File: web/src/components/ConfirmDialog.tsx
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Usage:
const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Delete User"
  description="Are you sure you want to delete this user? This action cannot be undone."
  onConfirm={handleDelete}
/>;
```

**Task 6.4: Error Boundaries**

```typescript
// File: web/src/components/ErrorBoundary.tsx

import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-gray-600">{this.state.error?.message}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap app in ErrorBoundary
// File: web/src/main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>;
```

**Task 6.5: Form Validation Enhancement**

```bash
npm install zod react-hook-form @hookform/resolvers
```

```typescript
// File: web/src/lib/validations/examSession.ts

import { z } from "zod";

export const examSessionSchema = z.object({
  courseCode: z.string().min(1, "Course code is required"),
  courseName: z.string().min(1, "Course name is required"),
  examDate: z.string().min(1, "Exam date is required"),
  venue: z.string().min(1, "Venue is required"),
  lecturerName: z.string().min(1, "Lecturer name is required"),
  department: z.string().min(1, "Department is required"),
  faculty: z.string().min(1, "Faculty is required"),
});

// Usage in forms with shadcn/ui form components
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(examSessionSchema),
});
```

#### Mobile Tasks (Week 7)

**Task 7.1: Mobile Toast Component**

```bash
cd mobile
npm install react-native-toast-message
```

```typescript
// File: mobile/components/ui/Toast.tsx

import Toast from "react-native-toast-message";

export const showToast = {
  success: (message: string) => {
    Toast.show({
      type: "success",
      text1: "Success",
      text2: message,
    });
  },
  error: (message: string) => {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: message,
    });
  },
  info: (message: string) => {
    Toast.show({
      type: "info",
      text1: "Info",
      text2: message,
    });
  },
};

// Add to root layout
// File: mobile/app/_layout.tsx
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <>
      {/* ... app content */}
      <Toast />
    </>
  );
}
```

**Task 7.2: Loading States**

```typescript
// File: mobile/components/ui/LoadingSpinner.tsx

import { ActivityIndicator, View, Text } from "react-native";

export const LoadingSpinner = ({ message }: { message?: string }) => (
  <View className="flex-1 justify-center items-center">
    <ActivityIndicator size="large" color="#3b82f6" />
    {message && <Text className="mt-4 text-gray-600">{message}</Text>}
  </View>
);

// Usage in screens
if (isLoading) return <LoadingSpinner message="Loading batches..." />;
```

**Task 7.3: Confirmation Alerts**

```typescript
// File: mobile/utils/confirm.ts

import { Alert, Platform } from "react-native";

export const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: onConfirm },
    ]);
  }
};

// Usage
confirmAction(
  "Confirm Transfer",
  "Are you sure you want to transfer this batch?",
  handleTransfer
);
```

**Task 7.4: Error Handling Improvements**

```typescript
// File: mobile/hooks/useErrorHandler.ts

import { useState } from "react";
import { showToast } from "../components/ui/Toast";

export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: any) => {
    console.error("Error:", error);

    const message =
      error.response?.data?.message || error.message || "An error occurred";

    showToast.error(message);
    setError(error);
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};

// Usage in components
const { handleError } = useErrorHandler();

try {
  await createTransfer(data);
} catch (error) {
  handleError(error);
}
```

---

## 📊 Testing Plan

### Phase 1 Testing (Analytics & Reports)

- [ ] **Unit Tests**: Analytics controller endpoints
- [ ] **Integration Tests**: Export service (PDF/Excel generation)
- [ ] **E2E Tests**: Analytics dashboard data loading
- [ ] **Manual Tests**:
  - Generate various reports
  - Test date range filtering
  - Verify export downloads
  - Check chart accuracy

### Phase 2 Testing (Real-time)

- [ ] **Unit Tests**: Socket.io authentication
- [ ] **Integration Tests**: Event emission on transfer actions
- [ ] **E2E Tests**: End-to-end real-time flow
- [ ] **Manual Tests**:
  - Create transfer, verify notification received
  - Test reconnection on network loss
  - Verify push notifications on mobile
  - Test with multiple devices simultaneously

### Phase 3 Testing (UI/UX)

- [ ] **Visual Tests**: Component consistency
- [ ] **Accessibility Tests**: WCAG 2.1 AA compliance
- [ ] **Manual Tests**:
  - Toast notifications
  - Loading states
  - Error boundaries
  - Confirmation dialogs
  - Form validation

---

## 🎯 Success Criteria

### Phase 1 Success Metrics

- ✅ Analytics dashboard loads <2 seconds
- ✅ All 4 chart types render correctly
- ✅ PDF/Excel exports download successfully
- ✅ Reports page filters work properly
- ✅ Data is accurate (matches database)

### Phase 2 Success Metrics

- ✅ Push notifications received within 2 seconds
- ✅ Socket.io maintains stable connection
- ✅ Real-time updates appear instantly
- ✅ Works with 10+ concurrent users
- ✅ No message loss on reconnection

### Phase 3 Success Metrics

- ✅ All pages have loading states
- ✅ All destructive actions have confirmations
- ✅ Errors display user-friendly messages
- ✅ Consistent design across all pages
- ✅ Accessibility score >90 (Lighthouse)

---

## 🚀 Deployment Checklist

Before deploying to production:

### Backend

- [ ] Run database migrations
- [ ] Add Socket.io environment variables
- [ ] Configure CORS for Socket.io
- [ ] Set up Expo push notification credentials
- [ ] Add analytics database indexes
- [ ] Test export file generation
- [ ] Configure file storage for exports

### Web

- [ ] Update API URL for Socket.io
- [ ] Test real-time connections in production
- [ ] Verify analytics charts render
- [ ] Test export downloads
- [ ] Check mobile responsiveness
- [ ] Run Lighthouse audit (>90 score)

### Mobile

- [ ] Configure push notification credentials
- [ ] Test push notifications on iOS/Android
- [ ] Update Socket.io URL
- [ ] Test real-time features
- [ ] Submit to app stores (if ready)

---

## 📈 Post-Implementation Roadmap

### Phase 4: Offline Support (Weeks 8-10)

- Local database (WatermelonDB)
- Offline queue for scans
- Background sync
- Conflict resolution

### Phase 5: Class Attendance System (Weeks 11-17)

- See PROJECT_STATUS.md "Future Implementation" section
- 7-week implementation plan
- Device-based sessions
- Session recovery system

### Phase 6: Advanced Features (Weeks 18+)

- Dark mode
- Multi-language support (i18n)
- Two-factor authentication
- Advanced security features

---

## 🛠️ Development Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: No warnings allowed
- **Prettier**: Format on save
- **Comments**: Explain complex logic
- **Testing**: Minimum 70% coverage

### Git Workflow

- **Branch Naming**: `feature/analytics-dashboard`, `fix/socket-reconnection`
- **Commit Messages**: Conventional commits format
- **Pull Requests**: Require 1 approval (if team)
- **CI/CD**: Run tests on every commit

### Documentation

- Update API docs for new endpoints
- Add JSDoc comments to functions
- Update PROJECT_STATUS.md after each phase
- Keep IMPLEMENTATION_PLAN.md updated

---

## 📞 Support & Resources

### Documentation

- [Socket.io Docs](https://socket.io/docs/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
- [PDFKit](https://pdfkit.org/)

### Tools

- Postman for API testing
- React DevTools for debugging
- Expo Go for mobile testing
- Chrome DevTools for Socket.io debugging

---

**Plan Version:** 1.0  
**Last Updated:** December 4, 2025  
**Status:** Ready for Implementation

---

## ✅ Quick Start - Begin Implementation

To start Phase 1 implementation immediately:

```bash
# 1. Create analytics branch
git checkout -b feature/analytics-dashboard

# 2. Backend setup
cd backend
npm install pdfkit exceljs

# 3. Web setup
cd ../web
npm install recharts @tanstack/react-table date-fns
npx shadcn@latest init

# 4. Start with Task 1.1: Analytics API Endpoints
```

Ready to start? Let's begin with **Task 1.1: Backend Analytics API Endpoints**! 🚀
