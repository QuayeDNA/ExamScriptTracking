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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Download,
  Upload,
  UserPlus,
  Users,
  Unlock,
  KeyRound,
  LogOut,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

interface TemporaryCredentials {
  email: string;
  password: string;
}

interface BulkResults {
  success: Array<{ email: string; temporaryPassword: string }>;
  failed: Array<{ email: string; error: string }>;
}

interface UserActionState {
  type: "unlock" | "reset" | "logout";
  userId: string;
}

export const UsersPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | "">("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userAction, setUserAction] = useState<UserActionState | null>(null);
  const [tempCredentials, setTempCredentials] =
    useState<TemporaryCredentials | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkResults | null>(null);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Get role filter based on active tab
  const getTabRoleFilter = (): Role | "" => {
    if (activeTab === "all") return "";
    if (activeTab === "admin") return "ADMIN";
    if (activeTab === "invigilator") return "INVIGILATOR";
    if (activeTab === "lecturer") return "LECTURER";
    if (activeTab === "department-head") return "DEPARTMENT_HEAD";
    if (activeTab === "faculty-officer") return "FACULTY_OFFICER";
    if (activeTab === "class-rep") return "CLASS_REP";
    return "";
  };

  const filters = {
    ...(getTabRoleFilter() && { role: getTabRoleFilter() as Role }),
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
      toast.error("No valid users found in CSV");
      return;
    }

    bulkCreateUsers(users, {
      onSuccess: (data) => {
        setBulkResults(data);
        setShowBulkImportModal(false);
        e.currentTarget.reset();
        toast.success(
          `Imported ${data.success.length} users successfully${
            data.failed.length > 0 ? `, ${data.failed.length} failed` : ""
          }`
        );
      },
      onError: (error: Error) => {
        toast.error("Failed to create users", {
          description: error.message,
        });
      },
    });
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    bulkDeactivateUsers(
      { userIds: Array.from(selectedUsers) },
      {
        onSuccess: () => {
          toast.success(`Deactivated ${selectedUsers.size} user(s)`);
          setSelectedUsers(new Set());
        },
        onError: (error: Error) => {
          toast.error("Failed to deactivate users", {
            description: error.message,
          });
        },
      }
    );
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
            toast.success("Account unlocked successfully");
            setUserAction(null);
          },
          onError: (error: Error) => {
            toast.error("Failed to unlock account", {
              description: error.message,
            });
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
            toast.success("Password reset successfully");
          },
          onError: (error: Error) => {
            toast.error("Failed to reset password", {
              description: error.message,
            });
          },
        });
        break;
      case "logout":
        forceLogoutUser(userId, {
          onSuccess: (data) => {
            toast.success(`Logged out ${data.count} session(s)`);
            setUserAction(null);
          },
          onError: (error: Error) => {
            toast.error("Failed to force logout", {
              description: error.message,
            });
          },
        });
        break;
    }
  };

  const handleExportUsers = () => {
    const exportFilters = {
      ...(getTabRoleFilter() && { role: getTabRoleFilter() }),
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
    toast.success("Export started");
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

  const clearAllFilters = () => {
    setIsActiveFilter("");
    setSearchFilter("");
    setDateFromFilter("");
    setDateToFilter("");
  };

  const hasActiveFilters =
    isActiveFilter !== "" || searchFilter || dateFromFilter || dateToFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportUsers} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              {selectedUsers.size > 0 && (
                <Button
                  onClick={handleBulkDeactivate}
                  disabled={isBulkDeactivating}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deactivate ({selectedUsers.size})
                </Button>
              )}
              <Button
                onClick={() => setShowBulkImportModal(true)}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by name or email..."
                />
              </div>

              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={
                    isActiveFilter === ""
                      ? undefined
                      : isActiveFilter
                      ? "true"
                      : "false"
                  }
                  onValueChange={(value) => setIsActiveFilter(value === "true")}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from">Created From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="date-to">Created To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button onClick={clearAllFilters} variant="ghost" size="sm">
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

       {/* User Type Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
              <TabsTrigger value="invigilator">Invigilators</TabsTrigger>
              <TabsTrigger value="lecturer">Lecturers</TabsTrigger>
              <TabsTrigger value="department-head">Dept Heads</TabsTrigger>
              <TabsTrigger value="faculty-officer">
                Faculty Officers
              </TabsTrigger>
              <TabsTrigger value="class-rep">Class Reps</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users
            {usersData && (
              <Badge variant="secondary">{usersData.users.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-12 text-center text-muted-foreground">
              Loading users...
            </div>
          )}

          {error && (
            <div className="p-12 text-center">
              <div className="inline-flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-destructive">
                    Error loading users
                  </p>
                  <p className="text-sm text-destructive">
                    {error instanceof Error ? error.message : "Unknown error"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {usersData && usersData.users.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}

          {usersData && usersData.users.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === usersData.users.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          disabled={user.isSuperAdmin}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.isSuperAdmin && (
                            <Badge variant="default" className="text-xs mt-1">
                              Super Admin
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.department}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!user.isSuperAdmin && (
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() =>
                                user.isActive
                                  ? deactivateUser(user.id)
                                  : reactivateUser(user.id)
                              }
                              variant={user.isActive ? "ghost" : "outline"}
                              size="sm"
                            >
                              {user.isActive ? (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Users className="w-4 h-4 mr-1" />
                                  Reactivate
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() =>
                                handleUserAction("unlock", user.id)
                              }
                              variant="ghost"
                              size="sm"
                              title="Unlock account"
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleUserAction("reset", user.id)}
                              variant="ghost"
                              size="sm"
                              title="Reset password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() =>
                                handleUserAction("logout", user.id)
                              }
                              variant="ghost"
                              size="sm"
                              title="Force logout"
                            >
                              <LogOut className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with a temporary password
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select name="role" required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="INVIGILATOR">Invigilator</SelectItem>
                  <SelectItem value="LECTURER">Lecturer</SelectItem>
                  <SelectItem value="DEPARTMENT_HEAD">
                    Department Head
                  </SelectItem>
                  <SelectItem value="FACULTY_OFFICER">
                    Faculty Officer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" required />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImportModal} onOpenChange={setShowBulkImportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Users (CSV)</DialogTitle>
            <DialogDescription>
              Import multiple users from CSV format
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkImport} className="space-y-4">
            <div>
              <Label>CSV Format</Label>
              <div className="bg-muted p-3 rounded-lg text-xs font-mono space-y-1 mt-2">
                <div className="font-semibold">email,role,name,department</div>
                <div className="text-muted-foreground">
                  john@example.com,LECTURER,John Doe,Computer Science
                </div>
                <div className="text-muted-foreground">
                  jane@example.com,INVIGILATOR,Jane Smith,Mathematics
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="csvData">CSV Data</Label>
              <Textarea
                id="csvData"
                name="csvData"
                required
                rows={10}
                placeholder="Paste CSV data here..."
                className="font-mono text-sm"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBulkImportModal(false)}
                disabled={isBulkCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isBulkCreating}>
                {isBulkCreating ? "Importing..." : "Import Users"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Temporary Credentials Dialog */}
      <Dialog
        open={!!tempCredentials}
        onOpenChange={() => setTempCredentials(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created Successfully</DialogTitle>
            <DialogDescription>
              Save these credentials - they will not be shown again!
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Save these credentials securely
              </p>
            </div>
            {tempCredentials && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-mono text-sm font-medium">
                    {tempCredentials.email}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Temporary Password
                  </Label>
                  <p className="font-mono text-sm font-medium">
                    {tempCredentials.password}
                  </p>
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Share these credentials with the user securely. They will be
            required to change their password on first login.
          </p>
          <DialogFooter>
            <Button onClick={() => setTempCredentials(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Results Dialog */}
      <Dialog open={!!bulkResults} onOpenChange={() => setBulkResults(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Results</DialogTitle>
            <DialogDescription>Summary of bulk user creation</DialogDescription>
          </DialogHeader>

          {bulkResults && (
            <div className="space-y-4">
              {bulkResults.success.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Successfully Created ({bulkResults.success.length})
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg max-h-60 overflow-y-auto space-y-3">
                    {bulkResults.success.map((user, idx) => (
                      <div
                        key={idx}
                        className="pb-3 border-b border-green-200 dark:border-green-800 last:border-0"
                      >
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
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
                <div>
                  <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Failed ({bulkResults.failed.length})
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg max-h-40 overflow-y-auto space-y-2">
                    {bulkResults.failed.map((user, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{user.email}</span>:{" "}
                        {user.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setBulkResults(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Action Confirmation Dialog */}
      <Dialog open={!!userAction} onOpenChange={() => setUserAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userAction?.type === "unlock" && "Unlock Account"}
              {userAction?.type === "reset" && "Reset Password"}
              {userAction?.type === "logout" && "Force Logout"}
            </DialogTitle>
            <DialogDescription>
              {userAction?.type === "unlock" &&
                "Are you sure you want to unlock this account? This will reset the failed login attempts counter."}
              {userAction?.type === "reset" &&
                "Are you sure you want to reset this user's password? They will need to change it on next login."}
              {userAction?.type === "logout" &&
                "Are you sure you want to force logout this user from all sessions?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserAction(null)}>
              Cancel
            </Button>
            <Button onClick={confirmUserAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
