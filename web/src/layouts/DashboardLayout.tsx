import { Outlet, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";
import { useLogout } from "@/hooks/useAuth";

export const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Exam Script Tracking
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">Logged in as: </span>
                <span className="font-medium text-gray-900">{user?.name}</span>
                <span className="ml-2 text-xs text-gray-500 uppercase">
                  {user?.role.replace("_", " ")}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
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
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/dashboard/sessions")}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              My Sessions
            </button>
            <button
              onClick={() => navigate("/dashboard/students")}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Students
            </button>
            <button
              onClick={() => navigate("/dashboard/exam-sessions")}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Exam Sessions
            </button>
            <button
              onClick={() => navigate("/dashboard/batch-tracking")}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Batch Tracking
            </button>
            {(user?.isSuperAdmin || user?.role === "ADMIN") && (
              <>
                <button
                  onClick={() => navigate("/dashboard/users")}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  User Management
                </button>
                <button
                  onClick={() => navigate("/dashboard/audit-logs")}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
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
