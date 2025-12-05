# Phase 2: Real-time Features Implementation Guide

## Status: Web Implementation Complete! ✅

### Completed ✅

1. **Dependencies Installed**

   - Backend: `socket.io` and `@types/socket.io`
   - Web: `socket.io-client`, `@radix-ui/react-scroll-area`
   - Mobile: `socket.io-client`

2. **Backend Socket Infrastructure**

   - ✅ `src/socket/socketServer.ts` - Socket.io server with JWT authentication
   - ✅ `src/socket/handlers/transferEvents.ts` - Transfer event emitters
   - ✅ `src/socket/handlers/batchEvents.ts` - Batch status event emitters
   - ✅ `src/socket/handlers/attendanceEvents.ts` - Attendance event emitters
   - ✅ `src/server.ts` - Integrated Socket.io with Express on single port

3. **Backend Controller Emissions - COMPLETE** ✅

   - ✅ `batchTransferController.ts` - All transfer events (request, confirm, reject)
   - ✅ `examSessionController.ts` - Batch creation and status updates
   - ✅ `attendanceController.ts` - Attendance recording events

4. **Web Real-time Features - COMPLETE** ✅
   - ✅ `lib/socket.ts` - Socket.io client service with auto-reconnection
   - ✅ `store/notifications.ts` - Zustand store for notification management
   - ✅ `hooks/useSocket.ts` - React hook for socket connection and event handling
   - ✅ `components/NotificationCenter.tsx` - Notification UI with badge, popover, and list
   - ✅ `components/ui/scroll-area.tsx` - Radix UI scroll area component
   - ✅ `App.tsx` - Socket initialization on app mount
   - ✅ `layouts/DashboardLayout.tsx` - NotificationCenter integrated in header

### Web Implementation Features

The web dashboard now includes:

- **Real-time Socket Connection**

  - JWT-authenticated connection to backend
  - Automatic reconnection on disconnect
  - Health check pings every 30 seconds
  - Connection status tracking

- **Notification System**

  - Toast notifications for immediate feedback
  - Notification center with unread count badge
  - Persistent notification history
  - Mark as read/Mark all as read functionality
  - Clear all notifications
  - Timestamp display for each notification
  - Type-based icons (✅ ✍️ 📤 📦 ❌)

- **Event Handling**
  - Transfer requested notifications
  - Transfer confirmed notifications
  - Transfer rejected notifications
  - Transfer updated notifications
  - Batch status updated notifications
  - Batch created notifications
  - Attendance recorded notifications
  - Dashboard auto-refresh on stats update

### Testing the Web Implementation

1. **Start the backend server**:

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the web development server**:

   ```bash
   cd web
   npm run dev
   ```

3. **Test scenarios**:
   - Login with a user account
   - Check the bell icon in the header (NotificationCenter)
   - Create a transfer request → Should see toast + notification
   - Confirm/reject a transfer → Should see real-time updates
   - Create an exam session → Admins should see notification
   - Record attendance → Admins should see notification
   - Check notification unread count updates
   - Test mark as read functionality
   - Test mark all as read
   - Test clear all notifications

### Remaining: Mobile Implementation

**batchTransferController.ts:**

```typescript
// In rejectTransfer function (after rejection):
emitTransferRejected(io, {
  id: transfer.id,
  fromHandlerId: transfer.fromHandlerId,
  toHandlerId: transfer.toHandlerId,
  examSession: {
    courseCode: transfer.examSession.courseCode,
    courseName: transfer.examSession.courseName,
  },
  rejectionReason: reason,
});
```

**examSessionController.ts:**

```typescript
import { io } from "../server";
import {
  emitBatchStatusUpdated,
  emitBatchCreated,
} from "../socket/handlers/batchEvents";

// In createExamSession (after creation):
emitBatchCreated(io, {
  id: examSession.id,
  batchQrCode: examSession.batchQrCode,
  courseCode: examSession.courseCode,
  courseName: examSession.courseName,
  department: examSession.department,
  faculty: examSession.faculty,
  examDate: examSession.examDate,
});

// In updateExamSessionStatus (after status update):
emitBatchStatusUpdated(io, {
  id: examSession.id,
  batchQrCode: examSession.batchQrCode,
  courseCode: examSession.courseCode,
  courseName: examSession.courseName,
  status: examSession.status,
  department: examSession.department,
  faculty: examSession.faculty,
});
```

**attendanceController.ts:**

```typescript
import { io } from "../server";
import { emitAttendanceRecorded } from "../socket/handlers/attendanceEvents";

// In recordAttendance (after recording):
emitAttendanceRecorded(io, {
  id: attendance.id,
  studentId: attendance.studentId,
  examSessionId: attendance.examSessionId,
  status: attendance.status,
  student: {
    indexNumber: student.indexNumber,
    firstName: student.firstName,
    lastName: student.lastName,
  },
  examSession: {
    courseCode: examSession.courseCode,
    courseName: examSession.courseName,
  },
});
```

---

### Web Dashboard Implementation

#### 1. Create Socket Client Service

**File: `web/src/lib/socket.ts`**

```typescript
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const token = useAuthStore.getState().token;

    if (!token) {
      console.warn("No auth token available for socket connection");
      return;
    }

    this.socket = io("http://localhost:3000", {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    // Health check
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");
      }
    }, 30000); // Every 30 seconds
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
```

#### 2. Create Notification Store

**File: `web/src/store/notifications.ts`**

```typescript
import { create } from "zustand";

export interface Notification {
  id: string;
  type:
    | "transfer_requested"
    | "transfer_confirmed"
    | "transfer_rejected"
    | "batch_status"
    | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
```

#### 3. Create Socket Hook

**File: `web/src/hooks/useSocket.ts`**

```typescript
import { useEffect } from "react";
import { socketService } from "@/lib/socket";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { toast } from "sonner";

export function useSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    // Connect socket
    socketService.connect();

    // Transfer requested
    socketService.on("transfer:requested", (data) => {
      addNotification({
        type: "transfer_requested",
        title: "New Transfer Request",
        message: `Transfer request for ${data.courseCode} - ${data.courseName}`,
        data,
      });
      toast.info(`New transfer request: ${data.courseCode}`);
    });

    // Transfer confirmed
    socketService.on("transfer:confirmed", (data) => {
      addNotification({
        type: "transfer_confirmed",
        title: "Transfer Confirmed",
        message: `Transfer for ${data.courseCode} has been confirmed`,
        data,
      });
      toast.success(`Transfer confirmed: ${data.courseCode}`);
    });

    // Transfer rejected
    socketService.on("transfer:rejected", (data) => {
      addNotification({
        type: "transfer_rejected",
        title: "Transfer Rejected",
        message: `Transfer for ${data.courseCode} was rejected`,
        data,
      });
      toast.error(`Transfer rejected: ${data.courseCode}`);
    });

    // Batch status updated
    socketService.on("batch:status_updated", (data) => {
      addNotification({
        type: "batch_status",
        title: "Batch Status Updated",
        message: `${data.courseCode} status: ${data.status}`,
        data,
      });
    });

    // Dashboard stats updated
    socketService.on("dashboard:stats_updated", (data) => {
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
    });

    // Cleanup
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, addNotification]);

  return {
    isConnected: socketService.isConnected(),
    emit: socketService.emit.bind(socketService),
  };
}
```

#### 4. Update App.tsx to Initialize Socket

**File: `web/src/App.tsx`**

```typescript
import { useSocket } from "@/hooks/useSocket";

function App() {
  useSocket(); // Initialize socket connection

  // ... rest of your App component
}
```

#### 5. Create Notification Center Component

**File: `web/src/components/NotificationCenter.tsx`**

```typescript
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { useNotificationStore } from "@/store/notifications";
import { format } from "date-fns";

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notifications
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read ? "bg-background" : "bg-muted"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(notification.timestamp, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

#### 6. Add NotificationCenter to Dashboard Layout

Add `<NotificationCenter />` to your main navigation/header component.

---

### Mobile App Implementation

#### 1. Install Expo Notifications

```bash
cd mobile
npx expo install expo-notifications
```

#### 2. Configure app.json

**File: `mobile/app.json`**

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#ffffff"
    }
  }
}
```

#### 3. Create Mobile Socket Service

**File: `mobile/lib/socket.ts`**

```typescript
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import * as Notifications from "expo-notifications";

class MobileSocketService {
  private socket: Socket | null = null;

  connect() {
    const token = useAuthStore.getState().token;

    if (!token) return;

    this.socket = io("http://192.168.43.153:3000", {
      auth: { token },
      reconnection: true,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");
    });

    // Listen for transfer requests
    this.socket.on("transfer:requested", async (data) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "New Transfer Request",
          body: `Transfer request for ${data.courseCode}`,
          data: { type: "transfer_requested", ...data },
        },
        trigger: null, // Show immediately
      });
    });

    // Listen for transfer confirmations
    this.socket.on("transfer:confirmed", async (data) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Transfer Confirmed",
          body: `Your transfer for ${data.courseCode} was confirmed`,
          data: { type: "transfer_confirmed", ...data },
        },
        trigger: null,
      });
    });

    // Listen for batch status updates
    this.socket.on("batch:status_updated", async (data) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Batch Status Updated",
          body: `${data.courseCode} status: ${data.status}`,
          data: { type: "batch_status", ...data },
        },
        trigger: null,
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const mobileSocketService = new MobileSocketService();
```

#### 4. Request Notification Permissions

**File: `mobile/utils/notifications.ts`**

```typescript
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Failed to get push notification permissions!");
    return;
  }

  return token;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

#### 5. Initialize in App Layout

**File: `mobile/app/_layout.tsx`**

```typescript
import { useEffect } from "react";
import { mobileSocketService } from "@/lib/socket";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { useAuthStore } from "@/store/auth";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Request notification permissions
    registerForPushNotificationsAsync();

    // Connect socket if authenticated
    if (isAuthenticated) {
      mobileSocketService.connect();
    }

    return () => {
      mobileSocketService.disconnect();
    };
  }, [isAuthenticated]);

  // ... rest of layout
}
```

---

### Testing Checklist

#### Backend

- [ ] Socket.io server starts successfully
- [ ] JWT authentication works for socket connections
- [ ] Users join correct rooms (user-specific, role-specific)
- [ ] Transfer request emits notification to recipient
- [ ] Transfer confirmation emits notification to sender
- [ ] Batch status updates emit to all handlers
- [ ] Multiple clients can connect simultaneously

#### Web Dashboard

- [ ] Socket connects after login
- [ ] Socket disconnects after logout
- [ ] Notifications appear in notification center
- [ ] Toast notifications display on events
- [ ] Unread count updates correctly
- [ ] Mark as read functionality works
- [ ] Dashboard auto-refreshes on stats update

#### Mobile App

- [ ] Notification permissions requested
- [ ] Socket connects after login
- [ ] Push notifications display
- [ ] Notification tap opens relevant screen
- [ ] Notifications work when app in background
- [ ] Notifications work when app closed

---

### Environment Variables

Add to backend `.env`:

```
JWT_SECRET=your-secret-key
NODE_ENV=development
```

---

### Next Steps After Phase 2

1. **Performance Optimization**

   - Add rate limiting for socket events
   - Implement message queuing for offline clients
   - Add socket connection pooling

2. **Enhanced Features**

   - Typing indicators (who's viewing)
   - Read receipts for notifications
   - Batch notification preferences
   - Notification sound customization

3. **Monitoring**
   - Socket connection metrics
   - Event emission tracking
   - Error logging for socket failures
   - Performance monitoring

---

### Troubleshooting

**Socket won't connect:**

- Check JWT token is valid
- Verify CORS settings allow your origin
- Check server is running on correct port
- Verify network connectivity (especially for mobile)

**Notifications not appearing:**

- Check user has permission for notifications
- Verify user is in correct room (user ID/role)
- Check event names match exactly
- Verify notification handler is registered

**Multiple notifications:**

- Ensure socket only connects once
- Clean up listeners on unmount
- Check for duplicate event handlers

---

## Summary

This implementation provides:

- ✅ Authenticated WebSocket connections
- ✅ Real-time transfer notifications
- ✅ Batch status updates
- ✅ Push notifications (mobile)
- ✅ Notification center (web)
- ✅ Toast notifications
- ✅ Auto-reconnection
- ✅ Multi-device support

All core real-time features are now in place. Test thoroughly and proceed to performance optimization and monitoring.
