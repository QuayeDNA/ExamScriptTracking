import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "@/pages/LoginPage";
import { ChangePasswordRequiredPage } from "@/pages/ChangePasswordRequiredPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { UsersPage } from "@/pages/UsersPage";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
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
          <Route
            path="/change-password-required"
            element={<ChangePasswordRequiredPage />}
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
