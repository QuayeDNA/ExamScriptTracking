import { useState } from "react";
import {
  useSessions,
  useRevokeSession,
  useLogoutAllSessions,
} from "@/hooks/useSessions";

export default function SessionsPage() {
  const { data, isLoading, error } = useSessions();
  const revokeSession = useRevokeSession();
  const logoutAll = useLogoutAllSessions();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  const handleRevokeSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to revoke this session?")) {
      try {
        await revokeSession.mutateAsync(sessionId);
        alert("Session revoked successfully");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        alert(error.response?.data?.error || "Failed to revoke session");
      }
    }
  };

  const handleLogoutAll = async () => {
    try {
      const result = await logoutAll.mutateAsync();
      alert(`Logged out from ${result.count} sessions`);
      setConfirmLogoutAll(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "Failed to logout all sessions");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p>Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error loading sessions</p>
      </div>
    );
  }

  const sessions = data?.sessions || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Active Sessions</h1>
        {sessions.length > 0 && (
          <button
            onClick={() => setConfirmLogoutAll(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout All Sessions
          </button>
        )}
      </div>

      {confirmLogoutAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Confirm Logout All</h2>
            <p className="mb-6">
              Are you sure you want to logout from all sessions? You will need
              to log in again on all devices.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmLogoutAll(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAll}
                disabled={logoutAll.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {logoutAll.isPending ? "Logging out..." : "Logout All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="text-gray-600">No active sessions found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {session.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(session.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(session.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokeSession.isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
