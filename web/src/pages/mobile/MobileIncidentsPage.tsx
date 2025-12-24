import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  AlertCircle,
  Users,
  FileText,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  incidentsApi,
  type Incident,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/api/incidents";
import { formatDistanceToNow } from "date-fns";

export const MobileIncidentsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    type?: IncidentType;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
  }>({});

  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ["mobile-incidents", filters, searchQuery],
    queryFn: () =>
      incidentsApi.getIncidents({
        ...filters,
        limit: 50,
      }),
  });

  const { data: statisticsData } = useQuery({
    queryKey: ["incident-statistics"],
    queryFn: () => incidentsApi.getStatistics(),
  });

  const statistics = statisticsData?.statistics;

  const incidents = incidentsData?.incidents || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800 border-red-200";
      case "INVESTIGATING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ACADEMIC_MISCONDUCT":
        return <Users className="w-4 h-4" />;
      case "EXAM_IRREGULARITY":
        return <FileText className="w-4 h-4" />;
      case "TECHNICAL_ISSUE":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Incidents</h1>
              <p className="text-blue-100 text-sm">
                Report and manage incidents
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/mobile/report-incident")}
              className="bg-blue-500 hover:bg-blue-400"
            >
              <Plus className="w-4 h-4 mr-1" />
              Report
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="bg-white border-b p-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {statistics.byStatus?.REPORTED || 0}
                </div>
                <div className="text-xs text-gray-600">Reported</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {statistics.byStatus?.INVESTIGATING || 0}
                </div>
                <div className="text-xs text-gray-600">Investigating</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {statistics.byStatus?.RESOLVED || 0}
                </div>
                <div className="text-xs text-gray-600">Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {statistics.byStatus?.CLOSED || 0}
                </div>
                <div className="text-xs text-gray-600">Closed</div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters{" "}
              {Object.keys(filters).length > 0 &&
                `(${Object.keys(filters).length})`}
            </Button>

            {showFilters && (
              <div className="space-y-3 p-3 bg-white rounded-lg border">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={filters.type || ""}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: (value as IncidentType) || undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="ACADEMIC_MISCONDUCT">
                        Academic Misconduct
                      </SelectItem>
                      <SelectItem value="EXAM_IRREGULARITY">
                        Exam Irregularity
                      </SelectItem>
                      <SelectItem value="TECHNICAL_ISSUE">
                        Technical Issue
                      </SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Select
                    value={filters.severity || ""}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        severity: (value as IncidentSeverity) || undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Severities</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status || ""}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: (value as IncidentStatus) || undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="INVESTIGATING">
                        Investigating
                      </SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident: Incident) => (
                  <Card
                    key={incident.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      navigate(`/mobile/incident-details/${incident.id}`)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(incident.type)}
                            <h3 className="font-semibold text-base">
                              {incident.title}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {incident.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {incident.location || "Unknown location"}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDistanceToNow(new Date(incident.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className={getSeverityColor(incident.severity)}
                          >
                            {incident.severity}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getStatusColor(incident.status)}
                          >
                            {incident.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {incident.comments?.length || 0} comments
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No incidents found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || Object.keys(filters).length > 0
                    ? "Try adjusting your search or filters"
                    : "No incidents have been reported yet"}
                </p>
                <Button onClick={() => navigate("/mobile/report-incident")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Report First Incident
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Navigation */}
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
              className="flex flex-col items-center space-y-1 text-blue-600"
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
              <Users className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
