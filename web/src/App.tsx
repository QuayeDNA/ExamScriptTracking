import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ChangePasswordRequiredPage } from "@/pages/auth/ChangePasswordRequiredPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import DashboardStatsPage from "@/pages/dashboard/DashboardStatsPage";
import { UsersPage } from "@/pages/dashboard/UsersPage";
import AuditLogsPage from "@/pages/dashboard/AuditLogsPage";
import StudentsPage from "@/pages/dashboard/StudentsPage";
import ExamSessionsPage from "@/pages/dashboard/ExamSessionsPage";
import BatchDetailsPage from "@/pages/dashboard/BatchDetailsPage";
import BatchTrackingPage from "@/pages/dashboard/BatchTrackingPage";
import AnalyticsDashboardPage from "@/pages/dashboard/AnalyticsDashboardPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import AttendanceSessionsPage from "@/pages/dashboard/AttendanceSessionsPage";
import ClassAttendancePage from "@/pages/dashboard/ClassAttendancePage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Role } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import DesignSystemDemo from "@/pages/DesignSystemDemo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Initialize socket connection
  useSocket();
  return (
    <ThemeProvider defaultTheme="system" storageKey="exam-script-theme">
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              {/* Auth routes with AuthLayout */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/change-password-required"
                  element={<ChangePasswordRequiredPage />}
                />
              </Route>

              {/* Design system demo (standalone) */}
              <Route
                path="/design-system-demo"
                element={<DesignSystemDemo />}
              />

              {/* Error pages (standalone) */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected dashboard routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardStatsPage />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="exam-sessions" element={<ExamSessionsPage />} />
                  <Route
                    path="exam-sessions/:id"
                    element={<BatchDetailsPage />}
                  />
                  <Route
                    path="batch-tracking"
                    element={<BatchTrackingPage />}
                  />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route path="users" element={<UsersPage />} />
                  <Route
                    path="attendance-sessions"
                    element={<AttendanceSessionsPage />}
                  />
                  <Route
                    path="class-attendance"
                    element={<ClassAttendancePage />}
                  />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                  <Route
                    path="analytics"
                    element={<AnalyticsDashboardPage />}
                  />
                </Route>
              </Route>

              {/* Default and 404 routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
