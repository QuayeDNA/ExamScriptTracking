import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  MapPin,
  User,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { incidentsApi, type IncidentStatus } from "@/api/incidents";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuthStore } from "@/store/auth";

const STATUS_CONFIG = {
  REPORTED: {
    label: "Reported",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertCircle,
  },
  INVESTIGATING: {
    label: "Investigating",
    color: "bg-blue-100 text-blue-800",
    icon: AlertTriangle,
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  CLOSED: {
    label: "Closed",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
  ESCALATED: {
    label: "Escalated",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
};

const SEVERITY_CONFIG = {
  LOW: { label: "Low", color: "bg-green-100 text-green-800" },
  MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-800" },
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-800" },
};

export const MobileIncidentDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | null>(
    null
  );
  const { user } = useAuthStore();

  const canUpdateStatus =
    user?.role === "ADMIN" ||
    user?.role === "DEPARTMENT_HEAD" ||
    user?.role === "FACULTY_OFFICER";
  const canEdit = user?.role === "ADMIN" || user?.role === "DEPARTMENT_HEAD";

  const {
    data: incidentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => incidentsApi.getIncident(id!),
    enabled: !!id,
  });

  const incident = incidentData?.incident;

  const updateStatusMutation = useMutation({
    mutationFn: ({
      incidentId,
      status,
    }: {
      incidentId: string;
      status: IncidentStatus;
    }) => incidentsApi.updateStatus(incidentId, { status }),
    onSuccess: () => {
      toast.success("Incident status updated successfully");
      setSelectedStatus(null);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast.error("Failed to update incident status", {
        description: message,
      });
    },
  });

  const handleStatusUpdate = () => {
    if (!incident || !selectedStatus || selectedStatus === incident.status)
      return;

    updateStatusMutation.mutate({
      incidentId: incident.id,
      status: selectedStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Error Loading Incident
            </h2>
            <p className="text-gray-600 mb-4">
              {error ? "Failed to load incident details" : "Incident not found"}
            </p>
            <Button onClick={() => navigate("/mobile/incidents")}>
              Back to Incidents
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[incident.status];
  const severityConfig = SEVERITY_CONFIG[incident.severity];

  // Derive current status from selectedStatus or incident status
  const currentStatus = selectedStatus ?? incident.status;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/mobile/incidents")}
              className="text-white hover:bg-blue-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">Incident Details</h1>
              <p className="text-blue-100 text-sm">#{incident.id.slice(-8)}</p>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Status and Severity */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <statusConfig.icon className="w-5 h-5" />
                    <Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <Badge className={severityConfig.color}>
                    {severityConfig.label} Priority
                  </Badge>
                </div>

                {/* Status Update for authorized users */}
                {canUpdateStatus && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Update Status:
                    </Label>
                    <div className="flex space-x-2">
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <Button
                          key={status}
                          variant={
                            currentStatus === status ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setSelectedStatus(status as IncidentStatus)
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                    {selectedStatus && selectedStatus !== incident.status && (
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={updateStatusMutation.isPending}
                        className="w-full mt-2"
                      >
                        {updateStatusMutation.isPending
                          ? "Updating..."
                          : "Update Status"}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Incident Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Incident Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {incident.title}
                  </h3>
                  <p className="text-gray-600">{incident.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Reported by</p>
                      <p className="text-gray-600">
                        {incident.reporter
                          ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
                          : "Unknown reporter"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-gray-600">
                        {format(new Date(incident.reportedAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-gray-600">
                        {format(new Date(incident.reportedAt), "HH:mm")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-gray-600">
                        {incident.location || "Unknown location"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium mb-1">Type</p>
                  <p className="text-gray-600">
                    {incident.type.replace(/_/g, " ")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {incident.attachments && incident.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {incident.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{attachment.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {(attachment.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {canEdit && (
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Incident
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
