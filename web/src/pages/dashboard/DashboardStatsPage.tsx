import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/store/auth";
import type { UserStatistics } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Lock,
  LayoutDashboard,
  FileText,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardStatsPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<UserStatistics>({
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
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  System overview and statistics
                </p>
              </div>
              <Badge variant="default" className="h-8">
                <Shield className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
            </div>

            {isLoading ? (
              // Loading Skeletons
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* Total Users */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Users
                      </CardTitle>
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {stats.totalUsers}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registered in system
                      </p>
                    </CardContent>
                  </Card>

                  {/* Active Users */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Users
                      </CardTitle>
                      <div className="h-8 w-8 rounded-md bg-success/10 flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-success" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-success">
                        {stats.activeUsers}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently active
                      </p>
                    </CardContent>
                  </Card>

                  {/* Inactive Users */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Inactive Users
                      </CardTitle>
                      <div className="h-8 w-8 rounded-md bg-error/10 flex items-center justify-center">
                        <UserX className="h-4 w-4 text-error" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-error">
                        {stats.inactiveUsers}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Deactivated accounts
                      </p>
                    </CardContent>
                  </Card>

                  {/* Recent Logins */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Recent Logins
                      </CardTitle>
                      <div className="h-8 w-8 rounded-md bg-info/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-info" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-info">
                        {stats.recentLogins}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last 7 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Secondary Stats Row */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Locked Accounts */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Locked Accounts
                      </CardTitle>
                      <div className="h-8 w-8 rounded-md bg-warning/10 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-warning" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-warning">
                        {stats.lockedAccounts}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Require admin attention
                      </p>
                    </CardContent>
                  </Card>

                  {/* Users by Role */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Users by Role
                      </CardTitle>
                      <CardDescription>
                        Distribution across roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {stats.usersByRole.map((roleData) => (
                          <Badge
                            key={roleData.role}
                            variant="secondary"
                            className="text-xs"
                          >
                            {roleData.role.replace(/_/g, " ")}: {roleData.count}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Button
                        asChild
                        variant="outline"
                        className="h-auto flex-col items-start p-4 hover:border-primary"
                      >
                        <Link to="/dashboard/users">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Manage Users</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            Create, edit, and manage user accounts
                          </p>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="h-auto flex-col items-start p-4 hover:border-primary"
                      >
                        <Link to="/dashboard/audit-logs">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Audit Logs</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            Monitor system activity and security
                          </p>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="h-auto flex-col items-start p-4 hover:border-primary"
                      >
                        <Link to="/dashboard/analytics">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Analytics</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            View detailed system analytics
                          </p>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        );

      case "LECTURER":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Lecturer Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {user.name}
                </p>
              </div>
              <Badge variant="secondary">Lecturer</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Dashboard</CardTitle>
                <CardDescription>
                  Manage your exam sessions and track grading progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>View exam sessions assigned to you</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span>Track script transfers and status</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <LayoutDashboard className="h-4 w-4 text-info" />
                    <span>Monitor grading progress</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Button asChild variant="default">
                <Link to="/dashboard/exam-sessions">View Exam Sessions</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard/batch-tracking">Track Batches</Link>
              </Button>
            </div>
          </div>
        );

      case "DEPARTMENT_HEAD":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Department Head Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {user.name}
                </p>
              </div>
              <Badge variant="secondary">Department Head</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>
                  Manage and monitor your department's exam operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    <span>View departmental exam statistics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-info" />
                    <span>Monitor all department lecturers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-success" />
                    <span>Track exam script status</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    <span>Generate department reports</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "INVIGILATOR":
      case "FACULTY_OFFICER":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {user.role.replace(/_/g, " ")} Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {user.name}
                </p>
              </div>
              <Badge variant="secondary">{user.role.replace(/_/g, " ")}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mobile App Functions</CardTitle>
                <CardDescription>
                  Primary functions available on the mobile app
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span>Scan student QR codes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-success" />
                    <span>Record exam attendance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-info" />
                    <span>Transfer exam scripts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <LayoutDashboard className="h-4 w-4 text-warning" />
                    <span>Handle batch management</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Exam Script Tracking System</CardTitle>
              <CardDescription>
                Manage and track exam scripts efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use the navigation menu to access your available features.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return renderRoleSpecificContent();
}
