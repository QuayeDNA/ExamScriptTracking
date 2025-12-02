import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/store/auth";

export default function DashboardStatsPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["userStatistics"],
    queryFn: () => usersApi.getStatistics(),
    enabled: user?.role === "ADMIN" || user?.isSuperAdmin,
  });

  if (!user) return null;

  // Role-specific dashboard content
  const renderRoleSpecificContent = () => {
    switch (user.role) {
      case "ADMIN":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>

            {isLoading ? (
              <p>Loading statistics...</p>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Users */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.totalUsers}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Active Users */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Users
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {stats.activeUsers}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Inactive Users */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Inactive Users
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {stats.inactiveUsers}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Recent Logins */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Recent Logins (7 days)
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {stats.recentLogins}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Locked Accounts */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Locked Accounts
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {stats.lockedAccounts}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <svg
                        className="w-6 h-6 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Users by Role */}
                <div className="bg-white p-6 rounded-lg shadow md:col-span-2 lg:col-span-3">
                  <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.usersByRole.map((roleData) => (
                      <div
                        key={roleData.role}
                        className="text-center p-4 bg-gray-50 rounded"
                      >
                        <p className="text-xs font-medium text-gray-600 uppercase">
                          {roleData.role.replace("_", " ")}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {roleData._count}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/dashboard/users"
                  className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <h4 className="font-medium text-blue-900">Manage Users</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Create, edit, and manage user accounts
                  </p>
                </a>
                <a
                  href="/dashboard/audit-logs"
                  className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <h4 className="font-medium text-purple-900">
                    View Audit Logs
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Monitor system activity and security events
                  </p>
                </a>
                <a
                  href="/dashboard/sessions"
                  className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <h4 className="font-medium text-green-900">
                    Active Sessions
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    View and manage your active sessions
                  </p>
                </a>
              </div>
            </div>
          </div>
        );

      case "LECTURER":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Lecturer Dashboard</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Welcome, {user.name}!</p>
              <p className="text-sm text-gray-500 mt-2">
                Your lecturer-specific features will appear here.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm">• View exam sessions assigned to you</p>
                <p className="text-sm">• Track script transfers</p>
                <p className="text-sm">• Monitor grading progress</p>
              </div>
            </div>
          </div>
        );

      case "DEPARTMENT_HEAD":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Department Head Dashboard</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Welcome, {user.name}!</p>
              <p className="text-sm text-gray-500 mt-2">
                Your department management features will appear here.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm">• View departmental exam statistics</p>
                <p className="text-sm">• Monitor all department lecturers</p>
                <p className="text-sm">• Track exam script status</p>
                <p className="text-sm">• Generate department reports</p>
              </div>
            </div>
          </div>
        );

      case "INVIGILATOR":
      case "FACULTY_OFFICER":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">
              {user.role.replace("_", " ")} Dashboard
            </h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Welcome, {user.name}!</p>
              <p className="text-sm text-gray-500 mt-2">
                Use the mobile app for your primary functions.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm">• Scan student QR codes</p>
                <p className="text-sm">• Record exam attendance</p>
                <p className="text-sm">• Transfer exam scripts</p>
                <p className="text-sm">• Handle batch management</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">
              Welcome to Exam Script Tracking System
            </p>
          </div>
        );
    }
  };

  return <div className="p-6">{renderRoleSpecificContent()}</div>;
}
