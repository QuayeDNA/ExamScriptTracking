import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth";
import { Role } from "@/types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

interface MobileProtectedRouteProps {
  allowedRoles?: Role[];
}

export const MobileProtectedRoute = ({}: MobileProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/mobile/login" state={{ from: location }} replace />;
  }

  // For mobile routes, allow all authenticated users except redirect CLASS_REP to attendance
  if (user && user.role === Role.CLASS_REP) {
    return <Navigate to="/mobile/attendance" replace />;
  }

  // Check if user needs to change password
  if (user && !user.passwordChanged) {
    return <Navigate to="/mobile/change-password" replace />;
  }

  return <Outlet />;
};
