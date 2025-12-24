import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Users,
  FileText,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: {
    venue?: string;
    studentCount?: number;
    batchId?: string;
    incidentType?: string;
  };
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<any>> = {
  INCIDENT_REPORTED: AlertTriangle,
  INCIDENT_RESOLVED: CheckCircle,
  BATCH_TRANSFERRED: Package,
  ATTENDANCE_RECORDED: Users,
  EXAM_SESSION_STARTED: FileText,
  EXAM_SESSION_COMPLETED: CheckCircle,
};

const ACTIVITY_COLORS: Record<string, string> = {
  INCIDENT_REPORTED: "text-red-600",
  INCIDENT_RESOLVED: "text-green-600",
  BATCH_TRANSFERRED: "text-blue-600",
  ATTENDANCE_RECORDED: "text-purple-600",
  EXAM_SESSION_STARTED: "text-orange-600",
  EXAM_SESSION_COMPLETED: "text-green-600",
};

export const MobileRecentActivityPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: activities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () =>
      Promise.resolve([
        {
          id: "1",
          type: "INCIDENT_REPORTED",
          title: "Incident Reported",
          description: "Missing exam script reported in Room 101",
          timestamp: new Date().toISOString(),
          user: "John Doe",
          metadata: { venue: "Room 101" },
        },
        {
          id: "2",
          type: "ATTENDANCE_RECORDED",
          title: "Attendance Recorded",
          description: "Class attendance recorded for Mathematics 201",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: "Jane Smith",
          metadata: { studentCount: 45 },
        },
        {
          id: "3",
          type: "BATCH_TRANSFERRED",
          title: "Batch Transferred",
          description: "Exam scripts transferred between invigilators",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: "Bob Johnson",
          metadata: { batchId: "BATCH-001" },
        },
      ]),
  });

  const filteredActivities =
    activities?.filter((activity) => {
      if (activeTab === "all") return true;
      return activity.type.toLowerCase().includes(activeTab);
    }) || [];

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = format(new Date(activity.timestamp), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/mobile")}
              className="text-white hover:bg-blue-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">Recent Activity</h1>
              <p className="text-blue-100 text-sm">Latest system activities</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-white hover:bg-blue-500"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="incident">Incidents</TabsTrigger>
              <TabsTrigger value="batch">Batches</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              <TabsContent value={activeTab} className="mt-0">
                {Object.keys(groupedActivities).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedActivities)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([date, dayActivities]) => (
                        <div key={date}>
                          <div className="flex items-center space-x-2 mb-3">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <h3 className="font-medium text-gray-700">
                              {format(new Date(date), "EEEE, MMMM d")}
                            </h3>
                          </div>

                          <div className="space-y-3">
                            {dayActivities.map((activity) => {
                              const IconComponent =
                                ACTIVITY_ICONS[activity.type] || FileText;
                              const iconColor =
                                ACTIVITY_COLORS[activity.type] ||
                                "text-gray-600";

                              return (
                                <Card key={activity.id} className="p-4">
                                  <div className="flex items-start space-x-3">
                                    <div
                                      className={`p-2 rounded-full bg-gray-100 ${iconColor}`}
                                    >
                                      <IconComponent className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-gray-900">
                                          {activity.title}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                          {formatDistanceToNow(
                                            new Date(activity.timestamp),
                                            { addSuffix: true }
                                          )}
                                        </span>
                                      </div>

                                      <p className="text-sm text-gray-600 mb-2">
                                        {activity.description}
                                      </p>

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {activity.type.replace(/_/g, " ")}
                                          </Badge>
                                          {activity.user && (
                                            <span className="text-xs text-gray-500">
                                              by {activity.user}
                                            </span>
                                          )}
                                        </div>

                                        {activity.metadata?.venue && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {activity.metadata.venue}
                                          </Badge>
                                        )}
                                      </div>

                                      {activity.metadata && (
                                        <div className="mt-2 text-xs text-gray-500">
                                          {activity.metadata.batchId && (
                                            <div>
                                              Batch: {activity.metadata.batchId}
                                            </div>
                                          )}
                                          {activity.metadata.studentCount && (
                                            <div>
                                              Students:{" "}
                                              {activity.metadata.studentCount}
                                            </div>
                                          )}
                                          {activity.metadata.incidentType && (
                                            <div>
                                              Type:{" "}
                                              {activity.metadata.incidentType}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No recent activity
                    </h3>
                    <p className="text-gray-600">
                      {activeTab === "all"
                        ? "There hasn't been any recent activity in the system."
                        : `No ${activeTab} activity found.`}
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};
