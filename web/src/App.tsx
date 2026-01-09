import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import { UsersPage } from "@/pages/dashboard/UsersPage";
import AuditLogsPage from "@/pages/dashboard/AuditLogsPage";
import AnalyticsDashboardPage from "@/pages/dashboard/AnalyticsDashboardPage";
import QRRegistrationPage from "@/pages/dashboard/QRRegistrationPage";
import DashboardStatsPage from "@/pages/dashboard/DashboardStatsPage";
import StudentsPage from "@/pages/dashboard/StudentsPage";
import ExamSessionsPage from "@/pages/dashboard/ExamSessionsPage";
import BatchDetailsPage from "@/pages/dashboard/BatchDetailsPage";
import BatchTrackingPage from "@/pages/dashboard/BatchTrackingPage";
import IncidentsPage from "@/pages/dashboard/IncidentsPage";
import CreateIncidentPage from "@/pages/dashboard/CreateIncidentPage";
import IncidentDetailsPage from "@/pages/dashboard/IncidentDetailsPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import {
  ProtectedRoute,
} from "@/components/ProtectedRoute";
import { Role } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import DesignSystemDemo from "@/pages/DesignSystemDemo";
import { MobileDetectionWrapper } from "@/components/MobileDetectionWrapper";
import StudentQRLookup from "@/pages/StudentQRLookup";
import MarkAttendancePage from "@/pages/attend/MarkAttendancePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ConditionalNotFound() {
  const location = useLocation();

  // Don't show 404 for static files
  if (location.pathname.startsWith("/_")) {
    return null;
  }

  return <NotFoundPage />;
}

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
              <Route path="/student-qr" element={<StudentQRLookup />} />
              <Route path="/attend/:token" element={<MarkAttendancePage />} />
              <Route path="/attend" element={<MarkAttendancePage />} />
              <Route
                path="/design-system-demo"
                element={<DesignSystemDemo />}
              />
                
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Authenticated routes with mobile detection */}
              <Route element={<MobileDetectionWrapper />}>
                {/* Desktop Auth routes - shared AuthLayout */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route
                    path="/change-password-required"
                    element={<ChangePasswordRequiredPage />}
                  />
                </Route>

                {/* Desktop Protected routes - DashboardLayout */}
                <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardStatsPage />} />
                    <Route path="students" element={<StudentsPage />} />
                    <Route
                      path="exam-sessions"
                      element={<ExamSessionsPage />}
                    />
                    <Route
                      path="exam-sessions/:id"
                      element={<BatchDetailsPage />}
                    />
                    <Route
                      path="batch-tracking"
                      element={<BatchTrackingPage />}
                    />
                    <Route path="incidents" element={<IncidentsPage />} />
                    <Route path="incidents/create" element={<CreateIncidentPage />} />
                    <Route path="incidents/:id" element={<IncidentDetailsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                    <Route
                      path="analytics"
                      element={<AnalyticsDashboardPage />}
                    />
                    <Route
                      path="qr-registration"
                      element={<QRRegistrationPage />}
                    />
                  </Route>
                </Route>

                {/* Default redirects */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>

              {/* 404 - outside mobile wrapper */}
              <Route path="*" element={<ConditionalNotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
