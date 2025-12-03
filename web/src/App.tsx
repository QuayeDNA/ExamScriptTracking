import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Role } from "@/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="users" element={<UsersPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
