import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  Building,
  Shield,
  LogOut,
  Activity,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

export const MobileProfilePage = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      clearAuth();
      toast.success("Logged out successfully");
      navigate("/login");
    },
    onError: (error) => {
      toast.error("Logout failed", {
        description:
          (error as { error?: string })?.error || "An error occurred",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "INVIGILATOR":
        return "Invigilator";
      case "LECTURER":
        return "Lecturer";
      case "DEPARTMENT_HEAD":
        return "Department Head";
      case "FACULTY_OFFICER":
        return "Faculty Officer";
      case "CLASS_REP":
        return "Class Representative";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 border-red-200";
      case "INVIGILATOR":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LECTURER":
        return "bg-green-100 text-green-800 border-green-200";
      case "DEPARTMENT_HEAD":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "FACULTY_OFFICER":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CLASS_REP":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const quickActions = [
    {
      title: "Recent Activity",
      description: "View your activity log",
      icon: <Activity className="w-5 h-5" />,
      onClick: () => navigate("/mobile/recent-activity"),
    },
    {
      title: "Change Password",
      description: "Update your password",
      icon: <Shield className="w-5 h-5" />,
      onClick: () => navigate("/change-password-required"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">Profile</h1>
          <p className="text-blue-100 text-sm">Your account information</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* User Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{user?.name}</h2>
                    <Badge
                      variant="outline"
                      className={getRoleColor(user?.role || "")}
                    >
                      {getRoleDisplayName(user?.role || "")}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium">
                        {user?.department || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">
                          {user?.isActive ? "Active" : "Inactive"}
                        </p>
                        {user?.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {user?.isSuperAdmin && (
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-yellow-700">
                          Super Administrator
                        </p>
                        <p className="text-xs text-yellow-600">
                          Full system access and control
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={action.onClick}
                    >
                      <div className="flex items-center space-x-3">
                        {action.icon}
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!user?.passwordChanged && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You need to change your temporary password before you
                        can use the system.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Password Changed:</span>
                      <span
                        className={
                          user?.passwordChanged
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {user?.passwordChanged ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Active:</span>
                      <span
                        className={
                          user?.isActive ? "text-green-600" : "text-red-600"
                        }
                      >
                        {user?.isActive ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Super Admin:</span>
                      <span
                        className={
                          user?.isSuperAdmin
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }
                      >
                        {user?.isSuperAdmin ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logout Button */}
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowLogoutDialog(true)}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out? You will need to log in again
                to access your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
                disabled={logoutMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
