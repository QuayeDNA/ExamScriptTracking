import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import { analyticsApi } from "@/api/analytics";
import { useAuthStore } from "@/store/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle,
  XCircle,
  Lock,
  LogIn,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Clock,
  FileText,
  BarChart3,
  PackageSearch,
  Calendar,
  Target,
} from "lucide-react";

export default function DashboardStatsPage() {
  const { user } = useAuthStore();

  const { data: userStats, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["userStatistics"],
    queryFn: () => usersApi.getStatistics(),
    enabled: user?.role === "ADMIN" || user?.isSuperAdmin,
  });

  const { data: analyticsOverview, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: () => analyticsApi.getOverview(),
    enabled: user?.role === "ADMIN" || user?.isSuperAdmin,
  });

  const { data: examStats, isLoading: isLoadingExamStats } = useQuery({
    queryKey: ["examStats"],
    queryFn: () => analyticsApi.getExamStats(),
    enabled: user?.role === "ADMIN" || user?.isSuperAdmin,
  });

  const { data: discrepancyData, isLoading: isLoadingDiscrepancies } = useQuery(
    {
      queryKey: ["discrepancies"],
      queryFn: () => analyticsApi.getDiscrepancies(),
      enabled: user?.role === "ADMIN" || user?.isSuperAdmin,
    }
  );

  const { data: handlerPerformance, isLoading: isLoadingHandlers } = useQuery({
    queryKey: ["handlerPerformance"],
    queryFn: () => analyticsApi.getHandlerPerformance(),
    enabled: user?.role === "ADMIN" || user?.isSuperAdmin,
  });

  if (!user) return null;

  const isLoading =
    isLoadingUsers ||
    isLoadingAnalytics ||
    isLoadingExamStats ||
    isLoadingDiscrepancies ||
    isLoadingHandlers;

  // Role-specific dashboard content
  const renderRoleSpecificContent = () => {
    switch (user.role) {
      case "ADMIN":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive system analytics and metrics
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Key Metrics Row 1: Exam System Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Exam System Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Exams */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Total Exams
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                              {analyticsOverview?.overview.totalExams || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {analyticsOverview?.overview.examsThisMonth || 0}{" "}
                              this month
                            </p>
                          </div>
                          <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full">
                            <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Active Batches */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Active Batches
                            </p>
                            <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                              {analyticsOverview?.overview.activeBatches || 0}
                            </p>
                            <Badge variant="warning" size="sm" className="mt-2">
                              In Progress
                            </Badge>
                          </div>
                          <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-full">
                            <PackageSearch className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Completion Rate */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Completion Rate
                            </p>
                            <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
                              {examStats?.summary.completionRate.toFixed(1) ||
                                0}
                              %
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {examStats?.summary.completedExams || 0} completed
                            </p>
                          </div>
                          <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-full">
                            <Target className="w-6 h-6 text-success-600 dark:text-success-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Avg Processing Time */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Avg Processing Time
                            </p>
                            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                              {examStats?.summary.avgProcessingTimeDays.toFixed(
                                1
                              ) || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              days
                            </p>
                          </div>
                          <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full">
                            <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Key Metrics Row 2: Transfer & Quality Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Transfer & Quality Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Handlers */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Total Handlers
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                              {analyticsOverview?.overview.totalHandlers || 0}
                            </p>
                            <Badge variant="info" size="sm" className="mt-2">
                              Active
                            </Badge>
                          </div>
                          <div className="p-3 bg-info-100 dark:bg-info-900/20 rounded-full">
                            <Users className="w-6 h-6 text-info-600 dark:text-info-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Avg Transfer Time */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Avg Transfer Time
                            </p>
                            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                              {analyticsOverview?.overview.avgTransferTimeHours.toFixed(
                                1
                              ) || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              hours
                            </p>
                          </div>
                          <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full">
                            <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Discrepancies */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Discrepancies
                            </p>
                            <p className="text-3xl font-bold text-error-600 dark:text-error-400 mt-1">
                              {discrepancyData?.summary.total || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {discrepancyData?.summary.unresolved || 0}{" "}
                              unresolved
                            </p>
                          </div>
                          <div className="p-3 bg-error-100 dark:bg-error-900/20 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Discrepancy Rate */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Discrepancy Rate
                            </p>
                            <p className="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                              {analyticsOverview?.overview.discrepancyRate.toFixed(
                                1
                              ) || 0}
                              %
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {discrepancyData?.summary.resolutionRate.toFixed(
                                0
                              ) || 0}
                              % resolved
                            </p>
                          </div>
                          <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-full">
                            <BarChart3 className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* User Management Stats */}
                {userStats && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                      User Management
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      {/* Total Users */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Users
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {userStats.totalUsers}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Active Users */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Active Users
                          </p>
                          <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                            {userStats.activeUsers}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Inactive Users */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <XCircle className="w-5 h-5 text-error-600 dark:text-error-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Inactive Users
                          </p>
                          <p className="text-2xl font-bold text-error-600 dark:text-error-400 mt-1">
                            {userStats.inactiveUsers}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Recent Logins */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <LogIn className="w-5 h-5 text-info-600 dark:text-info-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Recent Logins
                          </p>
                          <p className="text-2xl font-bold text-info-600 dark:text-info-400 mt-1">
                            {userStats.recentLogins}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Last 7 days
                          </p>
                        </CardContent>
                      </Card>

                      {/* Locked Accounts */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <Lock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Locked Accounts
                          </p>
                          <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                            {userStats.lockedAccounts}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Exam Status Breakdown */}
                {examStats && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Exam Status Breakdown</CardTitle>
                        <CardDescription>
                          Distribution of exams across workflow stages
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(examStats.breakdown.byStatus).map(
                            ([status, count]) => (
                              <div
                                key={status}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    variant={
                                      status === "COMPLETED"
                                        ? "completed"
                                        : status === "GRADED"
                                        ? "graded"
                                        : status === "UNDER_GRADING"
                                        ? "under-grading"
                                        : status === "WITH_LECTURER"
                                        ? "with-lecturer"
                                        : status === "IN_TRANSIT"
                                        ? "in-transit"
                                        : status === "SUBMITTED"
                                        ? "submitted"
                                        : status === "IN_PROGRESS"
                                        ? "in-progress"
                                        : "not-started"
                                    }
                                    size="sm"
                                  >
                                    {status.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {count}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Department Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Exams by Department</CardTitle>
                        <CardDescription>
                          Top departments by exam volume
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(examStats.breakdown.byDepartment)
                            .sort(
                              ([, a], [, b]) => (b as number) - (a as number)
                            )
                            .slice(0, 8)
                            .map(([dept, count]) => (
                              <div
                                key={dept}
                                className="flex items-center justify-between"
                              >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {dept}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full"
                                      style={{
                                        width: `${
                                          (Number(count) /
                                            Math.max(
                                              ...Object.values(
                                                examStats.breakdown.byDepartment
                                              ).map(Number)
                                            )) *
                                          100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">
                                    {count}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Handler Performance */}
                {handlerPerformance && handlerPerformance.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Handler Performance</CardTitle>
                      <CardDescription>
                        Most active handlers by total transfers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-gray-200 dark:border-gray-700">
                            <tr>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                Handler
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                Role
                              </th>
                              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                Total Transfers
                              </th>
                              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                Avg Response
                              </th>
                              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                Discrepancies
                              </th>
                              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                Current Custody
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {handlerPerformance.slice(0, 10).map((handler) => (
                              <tr
                                key={handler.handler.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {handler.handler.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {handler.handler.email}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" size="sm">
                                    {handler.handler.role.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {handler.metrics.totalTransfers}
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    ↓{handler.metrics.transfersReceived} ↑
                                    {handler.metrics.transfersInitiated}
                                  </p>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {handler.metrics.avgResponseTimeHours.toFixed(
                                      1
                                    )}
                                    h
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {handler.metrics.discrepancies}
                                    </span>
                                    <Badge
                                      variant={
                                        handler.metrics.discrepancyRate === 0
                                          ? "success"
                                          : handler.metrics.discrepancyRate < 5
                                          ? "warning"
                                          : "error"
                                      }
                                      size="sm"
                                      className="mt-1"
                                    >
                                      {handler.metrics.discrepancyRate.toFixed(
                                        1
                                      )}
                                      %
                                    </Badge>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                    {handler.metrics.currentCustody}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Users by Role */}
                {userStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Users by Role</CardTitle>
                      <CardDescription>
                        Distribution of users across system roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {userStats.usersByRole.map((roleData) => (
                          <div
                            key={roleData.role}
                            className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                              {roleData.role.replace("_", " ")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                              {roleData._count}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col items-start text-left"
                        onClick={() =>
                          (window.location.href = "/dashboard/users")
                        }
                      >
                        <Users className="w-5 h-5 mb-2" />
                        <h4 className="font-semibold text-sm">Manage Users</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Create, edit, and manage user accounts
                        </p>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col items-start text-left"
                        onClick={() =>
                          (window.location.href = "/dashboard/audit-logs")
                        }
                      >
                        <FileText className="w-5 h-5 mb-2" />
                        <h4 className="font-semibold text-sm">
                          View Audit Logs
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Monitor system activity and security events
                        </p>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col items-start text-left"
                        onClick={() =>
                          (window.location.href = "/dashboard/exam-sessions")
                        }
                      >
                        <BookOpen className="w-5 h-5 mb-2" />
                        <h4 className="font-semibold text-sm">Exam Sessions</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          View and manage all exam sessions
                        </p>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      case "LECTURER":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Lecturer Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user.name}!
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Dashboard</CardTitle>
                <CardDescription>
                  Track your exam sessions and script transfers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Exam Sessions
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View and manage exam sessions assigned to you
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <PackageSearch className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Script Transfers
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track incoming and outgoing script transfers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Grading Progress
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monitor your grading progress and completion status
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "DEPARTMENT_HEAD":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Department Head Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user.name}!
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Department Management</CardTitle>
                <CardDescription>
                  Oversee departmental exam operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Department Statistics
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View comprehensive exam statistics for your department
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Lecturer Monitoring
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monitor all lecturers and their exam activities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <PackageSearch className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Script Tracking
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track exam script status across your department
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Reports
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Generate and download department reports
                      </p>
                    </div>
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
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.role.replace("_", " ")} Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user.name}!
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mobile App Required</CardTitle>
                <CardDescription>
                  Use the mobile app for your primary functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Student Attendance
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Scan student QR codes and record exam attendance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <PackageSearch className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Script Transfers
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Initiate and confirm script transfers between handlers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Batch Management
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Handle batch management and script verification
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Welcome to Exam Script Tracking System
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return <div className="p-4 lg:p-6">{renderRoleSpecificContent()}</div>;
}
