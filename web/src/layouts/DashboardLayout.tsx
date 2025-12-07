import { Outlet, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";
import { useLogout } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";

export const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">
                Exam Script Tracking
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Logged in as: </span>
                <span className="font-medium text-foreground">
                  {user?.name}
                </span>
                <span className="ml-2 text-xs text-muted-foreground uppercase">
                  {user?.role.replace("_", " ")}
                </span>
              </div>

              <ThemeToggle />

              <NotificationCenter />

              <button
                onClick={() => logout()}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/dashboard/sessions")}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
            >
              My Sessions
            </button>
            <button
              onClick={() => navigate("/dashboard/students")}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
            >
              Students
            </button>
            <button
              onClick={() => navigate("/dashboard/exam-sessions")}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
            >
              Exam Sessions
            </button>
            <button
              onClick={() => navigate("/dashboard/batch-tracking")}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
            >
              Batch Tracking
            </button>
            <button
              onClick={() => navigate("/dashboard/settings")}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
            >
              Settings
            </button>
            {(user?.isSuperAdmin || user?.role === "ADMIN") && (
              <>
                <button
                  onClick={() => navigate("/dashboard/users")}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
                >
                  User Management
                </button>
                <button
                  onClick={() => navigate("/dashboard/analytics")}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate("/dashboard/audit-logs")}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors-fast"
                >
                  Audit Logs
                </button>
              </>
            )}
          </nav>
        </div>

        <Outlet />
      </div>
    </div>
  );
};
