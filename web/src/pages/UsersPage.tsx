import { useState } from "react";
import {
  useUsers,
  useCreateUser,
  useDeactivateUser,
  useReactivateUser,
} from "@/hooks/useUsers";
import { Role } from "@/types";

export const UsersPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | "">("");

  const filters = {
    ...(roleFilter && { role: roleFilter }),
    ...(isActiveFilter !== "" && { isActive: isActiveFilter }),
  };

  const { data: usersData, isLoading, error } = useUsers(filters);
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: deactivateUser } = useDeactivateUser();
  const { mutate: reactivateUser } = useReactivateUser();

  const [tempCredentials, setTempCredentials] = useState<{
    email: string;
    password: string;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
