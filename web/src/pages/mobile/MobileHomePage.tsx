import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  AlertTriangle,
  QrCode,
  FileText,
  ArrowRightLeft,
  User,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { UserActivity } from "@/types/mobile";

const getActivityIcon = (type: UserActivity["type"]) => {
  switch (type) {
    case "audit":
      return <User className="w-4 h-4" />;
    case "incident":
      return <AlertTriangle className="w-4 h-4" />;
    case "transfer":
      return <ArrowRightLeft className="w-4 h-4" />;
    case "attendance":
      return <Users className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};
// Mock activities for now - replace with real API when available
const mockActivities: UserActivity[] = [
  {
    id: "1",
    type: "attendance",
    title: "Attendance Recorded",
    description: "Recorded attendance for Computer Science 101",
    timestamp: new Date().toISOString(),
    status: "completed",
  },
  {
    id: "2",
    type: "transfer",
    title: "Batch Transferred",
    description: "Transferred exam scripts to Dr. Johnson",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "completed",
  },
];
const getActivityColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "resolved":
    case "confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "failed":
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const MobileHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isClassRep = user?.role === "CLASS_REP";
  const isLoading = false; // Mock loading state

  // Use mock activities for now - replace with real API when available
  const activities = mockActivities;

  // Quick actions based on user role
  const quickActions = [
    {
      title: "Scan QR Code",
      description: "Record student attendance",
      icon: <QrCode className="w-6 h-6" />,
      onClick: () => navigate("/mobile/scanner"),
      show: !isClassRep,
    },
    {
      title: "Report Incident",
      description: "Create new incident report",
      icon: <AlertTriangle className="w-6 h-6" />,
      onClick: () => navigate("/mobile/report-incident"),
      show: true,
    },
    {
      title: "View Incidents",
      description: "Check incident reports",
      icon: <FileText className="w-6 h-6" />,
      onClick: () => navigate("/mobile/incidents"),
      show: true,
    },
    {
      title: "Class Attendance",
      description: "Record class attendance",
      icon: <Users className="w-6 h-6" />,
      onClick: () => navigate("/mobile/attendance"),
      show: isClassRep,
    },
    {
      title: "My Custody",
      description: "Manage exam batches",
      icon: <FileText className="w-6 h-6" />,
      onClick: () => navigate("/mobile/custody"),
      show: !isClassRep,
    },
    {
      title: "Recent Activity",
      description: "View your activity log",
      icon: <Activity className="w-6 h-6" />,
      onClick: () => navigate("/mobile/recent-activity"),
      show: true,
    },
  ].filter((action) => action.show);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold">ELMS Mobile</h1>
          <p className="text-blue-100 mt-1">Welcome back, {user?.name}</p>
          <Badge variant="secondary" className="mt-2 bg-blue-500 text-white">
            {user?.role?.replace("_", " ")}
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={action.onClick}
                    >
                      {action.icon}
                      <div className="text-center">
                        <div className="font-medium text-sm">
                          {action.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/mobile/recent-activity")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : activities?.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity: UserActivity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getActivityColor(
                                activity.status
                              )}`}
                            >
                              {activity.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(activity.timestamp),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {activities?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {activities?.filter(
                        (a) =>
                          a.type.includes("RECORDED") ||
                          a.type.includes("COMPLETED")
                      ).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Bottom Navigation Placeholder */}
        <div className="border-t bg-white px-4 py-2">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile")}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile/custody")}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">Custody</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile/incidents")}
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs">Incidents</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile/profile")}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
