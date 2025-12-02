import { useState } from "react";
import {
  useUsers,
  useCreateUser,
  useDeactivateUser,
  useReactivateUser,
} from "@/hooks/useUsers";
import {
  useUnlockAccount,
  useAdminResetPassword,
  useForceLogoutUser,
  useBulkCreateUsers,
  useBulkDeactivateUsers,
} from "@/hooks/useAdminActions";
import { usersApi } from "@/api/users";
import { Role, type BulkUserCreate } from "@/types";

export const UsersPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | "">("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userAction, setUserAction] = useState<{
    type: "unlock" | "reset" | "logout";
    userId: string;
  } | null>(null);

  const filters = {
    ...(roleFilter && { role: roleFilter }),
    ...(isActiveFilter !== "" && { isActive: isActiveFilter }),
    ...(searchFilter && { search: searchFilter }),
  };

  const { data: usersData, isLoading, error } = useUsers(filters);
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: deactivateUser } = useDeactivateUser();
  const { mutate: reactivateUser } = useReactivateUser();
  const { mutate: unlockAccount } = useUnlockAccount();
  const { mutate: adminResetPassword } = useAdminResetPassword();
  const { mutate: forceLogoutUser } = useForceLogoutUser();
  const { mutate: bulkCreateUsers, isPending: isBulkCreating } =
    useBulkCreateUsers();
  const { mutate: bulkDeactivateUsers, isPending: isBulkDeactivating } =
    useBulkDeactivateUsers();

  const [tempCredentials, setTempCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [bulkResults, setBulkResults] = useState<{
    success: Array<{ email: string; temporaryPassword: string }>;
    failed: Array<{ email: string; error: string }>;
  } | null>(null);

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createUser(
      {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as Role,
        department: formData.get("department") as string,
      },
      {
        onSuccess: (data) => {
          setTempCredentials({
            email: data.email,
            password: data.temporaryPassword,
          });
          setShowCreateModal(false);
          e.currentTarget.reset();
        },
      }
    );
  };

  const handleBulkImport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const csvData = formData.get("csvData") as string;

    // Parse CSV
    const lines = csvData.trim().split("\n");
    const users: BulkUserCreate[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const [email, role, name, department] = lines[i]
        .split(",")
        .map((s) => s.trim());
      if (email && role && name && department) {
        users.push({ email, role: role as Role, name, department });
      }
    }

    if (users.length === 0) {
      alert("No valid users found in CSV");
      return;
    }

    bulkCreateUsers(users, {
      onSuccess: (data) => {
        setBulkResults(data);
        setShowBulkImportModal(false);
        e.currentTarget.reset();
      },
      onError: (err: any) => {
        alert(err.response?.data?.error || "Failed to create users");
      },
    });
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.size === 0) {
      alert("No users selected");
      return;
    }

    if (
      confirm(
        `Are you sure you want to deactivate ${selectedUsers.size} user(s)?`
      )
    ) {
      bulkDeactivateUsers(
        { userIds: Array.from(selectedUsers) },
        {
          onSuccess: () => {
            alert("Users deactivated successfully");
            setSelectedUsers(new Set());
          },
          onError: (err: any) => {
            alert(err.response?.data?.error || "Failed to deactivate users");
          },
        }
      );
    }
  };

  const handleUserAction = (
    type: "unlock" | "reset" | "logout",
    userId: string
  ) => {
    setUserAction({ type, userId });
  };

  const confirmUserAction = () => {
    if (!userAction) return;

    const { type, userId } = userAction;

    switch (type) {
      case "unlock":
        unlockAccount(userId, {
          onSuccess: () => {
            alert("Account unlocked successfully");
            setUserAction(null);
          },
          onError: (err: any) => {
            alert(err.response?.data?.error || "Failed to unlock account");
          },
        });
        break;
      case "reset":
        adminResetPassword(userId, {
          onSuccess: (data) => {
            setTempCredentials({
              email: usersData?.users.find((u) => u.id === userId)?.email || "",
              password: data.temporaryPassword,
            });
            setUserAction(null);
          },
          onError: (err: any) => {
            alert(err.response?.data?.error || "Failed to reset password");
          },
        });
        break;
      case "logout":
        forceLogoutUser(userId, {
          onSuccess: (data) => {
            alert(`Logged out ${data.count} session(s)`);
            setUserAction(null);
          },
          onError: (err: any) => {
            alert(err.response?.data?.error || "Failed to force logout");
          },
        });
        break;
    }
  };

  const handleExportUsers = () => {
    const exportFilters = {
      ...(roleFilter && { role: roleFilter }),
      ...(isActiveFilter !== "" && { isActive: isActiveFilter }),
      ...(searchFilter && { search: searchFilter }),
      ...(dateFromFilter && { dateFrom: dateFromFilter }),
      ...(dateToFilter && { dateTo: dateToFilter }),
    };

    const exportUrl = usersApi.exportUsers(exportFilters);

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = exportUrl;
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === usersData?.users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(
        new Set(usersData?.users.map((u) => u.id).filter((id) => id))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportUsers}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
          >
            Export to CSV
          </button>
          {selectedUsers.size > 0 && (
            <button
              onClick={handleBulkDeactivate}
              disabled={isBulkDeactivating}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
            >
              Deactivate Selected ({selectedUsers.size})
            </button>
          )}
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Bulk Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="INVIGILATOR">Invigilator</option>
              <option value="LECTURER">Lecturer</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
              <option value="FACULTY_OFFICER">Faculty Officer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={
                isActiveFilter === "" ? "" : isActiveFilter ? "true" : "false"
              }
              onChange={(e) =>
                setIsActiveFilter(
                  e.target.value === "" ? "" : e.target.value === "true"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created From
            </label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created To
            </label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {(roleFilter ||
          isActiveFilter !== "" ||
          searchFilter ||
          dateFromFilter ||
          dateToFilter) && (
          <button
            onClick={() => {
              setRoleFilter("");
              setIsActiveFilter("");
              setSearchFilter("");
              setDateFromFilter("");
              setDateToFilter("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Temporary Credentials Modal */}
      {tempCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              User Created Successfully
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ Save these credentials - they will not be shown again!
              </p>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-600">Email:</span>
                  <p className="font-mono text-sm font-medium">
                    {tempCredentials.email}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">
                    Temporary Password:
                  </span>
                  <p className="font-mono text-sm font-medium">
                    {tempCredentials.password}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Share these credentials with the user securely. They will be
              required to change their password on first login.
            </p>
            <button
              onClick={() => setTempCredentials(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bulk Results Modal */}
      {bulkResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Bulk Import Results
            </h3>

            {bulkResults.success.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-green-700 mb-2">
                  Successfully Created ({bulkResults.success.length})
                </h4>
                <div className="bg-green-50 border border-green-200 p-4 rounded-md max-h-60 overflow-y-auto">
                  {bulkResults.success.map((user, idx) => (
                    <div
                      key={idx}
                      className="mb-3 pb-3 border-b border-green-200 last:border-0"
                    >
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-gray-600">
                        Password:{" "}
                        <span className="font-mono">
                          {user.temporaryPassword}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkResults.failed.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-700 mb-2">
                  Failed ({bulkResults.failed.length})
                </h4>
                <div className="bg-red-50 border border-red-200 p-4 rounded-md max-h-40 overflow-y-auto">
                  {bulkResults.failed.map((user, idx) => (
                    <div key={idx} className="mb-2 text-sm">
                      <span className="font-medium">{user.email}</span>:{" "}
                      {user.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setBulkResults(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* User Action Confirmation Modal */}
      {userAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {userAction.type === "unlock" && "Unlock Account"}
              {userAction.type === "reset" && "Reset Password"}
              {userAction.type === "logout" && "Force Logout"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {userAction.type === "unlock" &&
                "Are you sure you want to unlock this account? This will reset the failed login attempts counter."}
              {userAction.type === "reset" &&
                "Are you sure you want to reset this user's password? They will need to change it on next login."}
              {userAction.type === "logout" &&
                "Are you sure you want to force logout this user from all sessions?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUserAction(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmUserAction}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Bulk Import Users (CSV)
            </h3>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Format: email, role, name, department
                </label>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono mb-2">
                  <div>email,role,name,department</div>
                  <div>john@example.com,LECTURER,John Doe,Computer Science</div>
                  <div>jane@example.com,INVIGILATOR,Jane Smith,Mathematics</div>
                </div>
                <textarea
                  name="csvData"
                  required
                  rows={10}
                  placeholder="Paste CSV data here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  disabled={isBulkCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkCreating}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {isBulkCreating ? "Importing..." : "Import Users"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Create New User
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="INVIGILATOR">Invigilator</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="FACULTY_OFFICER">Faculty Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-gray-600">Loading users...</div>
        )}

        {error && (
          <div className="p-8 text-center text-red-600">
            Error loading users:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}

        {usersData && (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {usersData.users.length} user
                {usersData.users.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === usersData.users.length}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          disabled={user.isSuperAdmin}
                          className="rounded disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        {user.isSuperAdmin && (
                          <span className="text-xs text-blue-600 font-medium">
                            Super Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium uppercase text-gray-700">
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!user.isSuperAdmin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                user.isActive
                                  ? deactivateUser(user.id)
                                  : reactivateUser(user.id)
                              }
                              className={`font-medium ${
                                user.isActive
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-green-600 hover:text-green-800"
                              }`}
                            >
                              {user.isActive ? "Deactivate" : "Reactivate"}
                            </button>
                            <button
                              onClick={() =>
                                handleUserAction("unlock", user.id)
                              }
                              className="font-medium text-blue-600 hover:text-blue-800"
                              title="Unlock account"
                            >
                              Unlock
                            </button>
                            <button
                              onClick={() => handleUserAction("reset", user.id)}
                              className="font-medium text-purple-600 hover:text-purple-800"
                              title="Reset password"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() =>
                                handleUserAction("logout", user.id)
                              }
                              className="font-medium text-orange-600 hover:text-orange-800"
                              title="Force logout"
                            >
                              Logout
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
