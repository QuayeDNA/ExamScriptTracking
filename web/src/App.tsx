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
import { MobileLayout } from "@/layouts/MobileLayout";
import { UsersPage } from "@/pages/dashboard/UsersPage";
import AuditLogsPage from "@/pages/dashboard/AuditLogsPage";
import AnalyticsDashboardPage from "@/pages/dashboard/AnalyticsDashboardPage";
import ClassAttendancePage from "@/pages/dashboard/ClassAttendancePage";
import QRRegistrationPage from "@/pages/dashboard/QRRegistrationPage";
import DashboardStatsPage from "@/pages/dashboard/DashboardStatsPage";
import StudentsPage from "@/pages/dashboard/StudentsPage";
import ExamSessionsPage from "@/pages/dashboard/ExamSessionsPage";
import BatchDetailsPage from "@/pages/dashboard/BatchDetailsPage";
import BatchTrackingPage from "@/pages/dashboard/BatchTrackingPage";
import IncidentsPage from "@/pages/dashboard/IncidentsPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import {
  ProtectedRoute,
  MobileProtectedRoute,
} from "@/components/ProtectedRoute";
import { Role } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import DesignSystemDemo from "@/pages/DesignSystemDemo";
import { MobileDetectionWrapper } from "@/components/MobileDetectionWrapper";
import StudentQRLookup from "@/pages/StudentQRLookup";
import BiometricEnrollmentPage from "@/pages/BiometricEnrollmentPage";

// Mobile pages
import { MobileHomePage } from "@/pages/mobile/MobileHomePage";
import { MobileCustodyPage } from "@/pages/mobile/MobileCustodyPage";
import { MobileIncidentsPage } from "@/pages/mobile/MobileIncidentsPage";
import { MobileScannerPage } from "@/pages/mobile/MobileScannerPage";
import { MobileProfilePage } from "@/pages/mobile/MobileProfilePage";
import { MobileAttendancePage } from "@/pages/mobile/MobileAttendancePage";
import { MobileBatchDetailsPage } from "@/pages/mobile/MobileBatchDetailsPage";
import { MobileReportIncidentPage } from "@/pages/mobile/MobileReportIncidentPage";
import { MobileIncidentDetailsPage } from "@/pages/mobile/MobileIncidentDetailsPage";
import { MobileRecentActivityPage } from "@/pages/mobile/MobileRecentActivityPage";
import { MobileInitiateTransferPage } from "@/pages/mobile/MobileInitiateTransferPage";
import { MobileConfirmTransferPage } from "@/pages/mobile/MobileConfirmTransferPage";
import { MobileLoginPage } from "@/pages/mobile/MobileLoginPage";
import { MobileQRRegistrationPage } from "@/pages/mobile/MobileQRRegistrationPage";
import { MobileChangePasswordPage } from "@/pages/mobile/MobileChangePasswordPage";

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
    <MobileDetectionWrapper>
      <ThemeProvider defaultTheme="system" storageKey="exam-script-theme">
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route
                  path="/design-system-demo"
                  element={<DesignSystemDemo />}
                />
                <Route path="/student-qr" element={<StudentQRLookup />} />
                <Route path="/enroll-biometric" element={<BiometricEnrollmentPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

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

                {/* Mobile Auth routes - shared AuthLayout */}
                <Route path="/mobile" element={<AuthLayout />}>
                  <Route path="login" element={<MobileLoginPage />} />
                  <Route
                    path="qr-registration"
                    element={<MobileQRRegistrationPage />}
                  />
                  <Route
                    path="change-password"
                    element={<MobileChangePasswordPage />}
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
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route
                      path="class-attendance"
                      element={<ClassAttendancePage />}
                    />
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

                {/* Mobile Protected routes - MobileLayout */}
                <Route element={<MobileProtectedRoute />}>
                  <Route path="/mobile" element={<MobileLayout />}>
                    <Route index element={<MobileHomePage />} />
                    <Route path="custody" element={<MobileCustodyPage />} />
                    <Route path="incidents" element={<MobileIncidentsPage />} />
                    <Route path="scanner" element={<MobileScannerPage />} />
                    <Route path="profile" element={<MobileProfilePage />} />
                    <Route
                      path="attendance"
                      element={<MobileAttendancePage />}
                    />
                    <Route
                      path="batch-details/:batchId"
                      element={<MobileBatchDetailsPage />}
                    />
                    <Route
                      path="report-incident"
                      element={<MobileReportIncidentPage />}
                    />
                    <Route
                      path="incident-details/:id"
                      element={<MobileIncidentDetailsPage />}
                    />
                    <Route
                      path="recent-activity"
                      element={<MobileRecentActivityPage />}
                    />
                    <Route
                      path="initiate-transfer"
                      element={<MobileInitiateTransferPage />}
                    />
                    <Route
                      path="confirm-transfer/:transferId"
                      element={<MobileConfirmTransferPage />}
                    />
                  </Route>
                </Route>

                {/* Default redirects */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="*" element={<ConditionalNotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </QueryClientProvider>
      </ThemeProvider>
    </MobileDetectionWrapper>
  );
}

export default App;
