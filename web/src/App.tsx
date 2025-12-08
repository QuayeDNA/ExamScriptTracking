import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LoginPage } from "@/pages/LoginPage";
import { ChangePasswordRequiredPage } from "@/pages/ChangePasswordRequiredPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import DashboardStatsPage from "@/pages/DashboardStatsPage";
import { UsersPage } from "@/pages/UsersPage";
import SessionsPage from "@/pages/SessionsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
import StudentsPage from "@/pages/StudentsPage";
import ExamSessionsPage from "@/pages/ExamSessionsPage";
import BatchDetailsPage from "@/pages/BatchDetailsPage";
import BatchTrackingPage from "@/pages/BatchTrackingPage";
import AnalyticsDashboardPage from "@/pages/AnalyticsDashboardPage";
import SettingsPage from "@/pages/SettingsPage";
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
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/design-system-demo" element={<DesignSystemDemo />} />
            <Route
              path="/change-password-required"
              element={<ChangePasswordRequiredPage />}
            />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardStatsPage />} />
                <Route path="sessions" element={<SessionsPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="exam-sessions" element={<ExamSessionsPage />} />
                <Route
                  path="exam-sessions/:id"
                  element={<BatchDetailsPage />}
                />
                <Route path="batch-tracking" element={<BatchTrackingPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route path="users" element={<UsersPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="analytics" element={<AnalyticsDashboardPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
