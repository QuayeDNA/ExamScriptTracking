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
import {
  ProtectedRoute,
  MobileProtectedRoute,
} from "@/components/ProtectedRoute";
import { Role } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import DesignSystemDemo from "@/pages/DesignSystemDemo";
import { MobileDetectionWrapper } from "@/components/MobileDetectionWrapper";
import StudentQRLookup from "@/pages/StudentQRLookup";

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
import { MobileStudentAttendancePage } from "@/pages/mobile/MobileStudentAttendancePage";
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

function App() {
  // Initialize socket connection
  useSocket();

  const ConditionalNotFound = () => {
    const location = useLocation();

    // Don't show 404 for static files or mobile app routes
    if (
      location.pathname.startsWith("/_") ||
      location.pathname.startsWith("/mobile/")
    ) {
      return null; // Let the server handle static files
    }

    return <NotFoundPage />;
  };

  return (
    <MobileDetectionWrapper>
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
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
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

                {/* Student QR lookup (public) */}
                <Route path="/student-qr" element={<StudentQRLookup />} />

                {/* Error pages (standalone) */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Mobile routes - replicate mobile app functionality */}
                <Route element={<MobileLayout />}>
                  {/* Mobile Auth Routes */}
                  <Route path="/mobile/login" element={<MobileLoginPage />} />
                  <Route
                    path="/mobile/qr-registration"
                    element={<MobileQRRegistrationPage />}
                  />
                  <Route
                    path="/mobile/change-password"
                    element={<MobileChangePasswordPage />}
                  />

                  {/* Mobile Dashboard Routes */}
                  <Route element={<MobileProtectedRoute />}>
                    <Route path="/mobile" element={<MobileHomePage />} />
                    <Route
                      path="/mobile/custody"
                      element={<MobileCustodyPage />}
                    />
                    <Route
                      path="/mobile/incidents"
                      element={<MobileIncidentsPage />}
                    />
                    <Route
                      path="/mobile/scanner"
                      element={<MobileScannerPage />}
                    />
                    <Route
                      path="/mobile/profile"
                      element={<MobileProfilePage />}
                    />
                    <Route
                      path="/mobile/attendance"
                      element={<MobileAttendancePage />}
                    />
                    <Route
                      path="/mobile/batch-details/:batchId"
                      element={<MobileBatchDetailsPage />}
                    />
                    <Route
                      path="/mobile/report-incident"
                      element={<MobileReportIncidentPage />}
                    />
                    <Route
                      path="/mobile/incident-details/:id"
                      element={<MobileIncidentDetailsPage />}
                    />
                    <Route
                      path="/mobile/student-attendance"
                      element={<MobileStudentAttendancePage />}
                    />
                    <Route
                      path="/mobile/recent-activity"
                      element={<MobileRecentActivityPage />}
                    />
                    <Route
                      path="/mobile/initiate-transfer"
                      element={<MobileInitiateTransferPage />}
                    />
                    <Route
                      path="/mobile/confirm-transfer/:transferId"
                      element={<MobileConfirmTransferPage />}
                    />
                  </Route>
                </Route>

                {/* Admin-only routes */}
                <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
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

                {/* Default and 404 routes */}
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
