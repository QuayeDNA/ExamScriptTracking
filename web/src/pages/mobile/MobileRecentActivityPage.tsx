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
  AlertTriangle,
  Package,
  Users,
  FileText,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { analyticsApi } from "@/api/analytics";

interface ActivityItem {
  id: string;
  type: "audit" | "incident" | "transfer" | "attendance";
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

import type { LucideIcon } from "lucide-react";

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  audit: FileText,
  incident: AlertTriangle,
  transfer: Package,
  attendance: Users,
};

const ACTIVITY_COLORS: Record<string, string> = {
  audit: "text-primary",
  incident: "text-destructive",
  transfer: "text-warning",
  attendance: "text-success",
};

export const MobileRecentActivityPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: activitiesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-activity"],
    queryFn: () => analyticsApi.getUserActivity(),
  });

  const activities = activitiesData?.activities || [];

  const filteredActivities =
    activities?.filter((activity) => {
      if (activeTab === "all") return true;
      return activity.type === activeTab;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/mobile")}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">Recent Activity</h1>
              <p className="text-primary-foreground/80 text-sm">
                Latest system activities
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
              <TabsTrigger value="incident">Incidents</TabsTrigger>
              <TabsTrigger value="transfer">Transfers</TabsTrigger>
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
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-medium text-foreground">
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
                                      className={`p-2 rounded-full bg-muted ${iconColor}`}
                                    >
                                      <IconComponent className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-foreground">
                                          {activity.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(
                                            new Date(activity.timestamp),
                                            { addSuffix: true }
                                          )}
                                        </span>
                                      </div>

                                      <p className="text-sm text-muted-foreground mb-2">
                                        {activity.description}
                                      </p>

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {activity.type}
                                          </Badge>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {activity.status}
                                          </Badge>
                                        </div>
                                      </div>
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
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No recent activity
                    </h3>
                    <p className="text-muted-foreground">
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
