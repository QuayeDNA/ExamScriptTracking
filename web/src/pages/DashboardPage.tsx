import { useAuthStore } from "@/store/auth";

export const DashboardPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Active Sessions
          </h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-2">No active exam sessions</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Students
          </h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-2">Registered students</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Scripts Scanned
          </h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-2">Today</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Pending Transfers
          </h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <p className="text-gray-600 text-center py-8">No recent activity</p>
      </div>
    </div>
  );
};
