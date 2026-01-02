import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  incidentsApi,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentFilters,
} from "@/api/incidents";
import {
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "MISSING_SCRIPT", label: "Missing Script" },
  { value: "DAMAGED_SCRIPT", label: "Damaged Script" },
  { value: "MALPRACTICE", label: "Malpractice" },
  { value: "STUDENT_ILLNESS", label: "Student Illness" },
  { value: "VENUE_ISSUE", label: "Venue Issue" },
  { value: "COUNT_DISCREPANCY", label: "Count Discrepancy" },
  { value: "LATE_SUBMISSION", label: "Late Submission" },
  { value: "OTHER", label: "Other" },
];

const SEVERITY_LEVELS: { value: IncidentSeverity; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: "REPORTED", label: "Reported" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "ESCALATED", label: "Escalated" },
];

const getSeverityBadgeVariant = (
  severity: IncidentSeverity
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<
    IncidentSeverity,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    LOW: "secondary",
    MEDIUM: "outline",
    HIGH: "default",
    CRITICAL: "destructive",
  };
  return variants[severity] || "default";
};

const getStatusBadgeVariant = (
  status: IncidentStatus
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<
    IncidentStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    REPORTED: "outline",
    INVESTIGATING: "default",
    RESOLVED: "secondary",
    CLOSED: "secondary",
    ESCALATED: "destructive",
  };
  return variants[status] || "default";
};

export default function IncidentsPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<IncidentFilters>({
    page: 1,
    limit: 20,
  });
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set());

  // Fetch incidents
  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ["incidents", filters],
    queryFn: () => incidentsApi.getIncidents(filters),
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ["incident-statistics"],
    queryFn: () => incidentsApi.getStatistics(),
  });

  // Export mutations
  const exportSummaryMutation = useMutation({
    mutationFn: () => incidentsApi.exportSummary(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incidents-summary-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Incidents summary exported successfully");
    },
    onError: () => {
      toast.error("Failed to export incidents summary");
    },
  });

  const exportBulkPDFMutation = useMutation({
    mutationFn: (incidentIds: string[]) => incidentsApi.exportBulkPDF(incidentIds),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incidents-bulk-export-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${selectedIncidents.size} incidents exported successfully`);
      setSelectedIncidents(new Set());
    },
    onError: () => {
      toast.error("Failed to export incidents");
    },
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Implement search logic if needed
  };

  const handleFilterChange = (
    key: keyof IncidentFilters,
    value: string | boolean | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1, // Reset to first page
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 });
    setSearchTerm("");
  };

  const toggleIncidentSelection = (incidentId: string) => {
    const newSelection = new Set(selectedIncidents);
    if (newSelection.has(incidentId)) {
      newSelection.delete(incidentId);
    } else {
      newSelection.add(incidentId);
    }
    setSelectedIncidents(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIncidents.size === filteredIncidents?.length) {
      setSelectedIncidents(new Set());
    } else {
      setSelectedIncidents(new Set(filteredIncidents?.map(i => i.id) || []));
    }
  };

  const handleBulkExport = () => {
    if (selectedIncidents.size === 0) {
      toast.error("Please select incidents to export");
      return;
    }
    if (selectedIncidents.size > 50) {
      toast.error("Maximum 50 incidents can be exported at once");
      return;
    }
    exportBulkPDFMutation.mutate(Array.from(selectedIncidents));
  };

  const filteredIncidents = incidentsData?.incidents.filter((incident) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      incident.incidentNumber.toLowerCase().includes(search) ||
      incident.title.toLowerCase().includes(search) ||
      incident.description.toLowerCase().includes(search) ||
      incident.reporter?.firstName.toLowerCase().includes(search) ||
      incident.reporter?.lastName.toLowerCase().includes(search)
    );
  });

  const stats = statsData?.statistics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Incident Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage examination incidents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIncidents.size > 0 && (
            <Button
              variant="default"
              onClick={handleBulkExport}
              disabled={exportBulkPDFMutation.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportBulkPDFMutation.isPending 
                ? "Exporting..." 
                : `Export ${selectedIncidents.size} PDF${selectedIncidents.size > 1 ? 's' : ''}`}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => exportSummaryMutation.mutate()}
            disabled={exportSummaryMutation.isPending}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {exportSummaryMutation.isPending ? "Exporting..." : "Export Excel"}
          </Button>
          <Button onClick={() => navigate("/dashboard/incidents/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Incidents"
            value={stats.total?.toString() || "0"}
            description="All time"
            icon={AlertTriangle}
          />
          <StatCard
            title="Open Incidents"
            value={stats.openIncidents?.toString() || "0"}
            description="Requires attention"
            icon={TrendingUp}
            trend={
              (stats.openIncidents ?? 0) > 0
                ? { value: stats.openIncidents ?? 0, isPositive: false }
                : undefined
            }
          />
          <StatCard
            title="Resolved Today"
            value={stats.resolvedToday?.toString() || "0"}
            description="Completed today"
            icon={CheckCircle2}
          />
          <StatCard
            title="Avg Resolution Time"
            value={`${stats.avgResolutionTime?.toFixed(1) || "0"}h`}
            description="Hours to resolve"
            icon={Clock}
          />
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>
                {incidentsData?.total || 0} total incidents
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by incident number, title, or reporter..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-4 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div>
                <Label>Type</Label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) => handleFilterChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Severity</Label>
                <Select
                  value={filters.severity || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("severity", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    {SEVERITY_LEVELS.map((severity) => (
                      <SelectItem key={severity.value} value={severity.value}>
                        {severity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Confidential</Label>
                <Select
                  value={
                    filters.isConfidential === undefined
                      ? "all"
                      : filters.isConfidential
                      ? "yes"
                      : "no"
                  }
                  onValueChange={(value) =>
                    handleFilterChange(
                      "isConfidential",
                      value === "all" ? undefined : value === "yes"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Confidential Only</SelectItem>
                    <SelectItem value="no">Non-Confidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredIncidents &&
                        filteredIncidents.length > 0 &&
                        selectedIncidents.size === filteredIncidents.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Incident #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Loading incidents...
                    </TableCell>
                  </TableRow>
                ) : filteredIncidents && filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      className={
                        incident.isConfidential ? "bg-muted/50 italic" : ""
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIncidents.has(incident.id)}
                          onCheckedChange={() => toggleIncidentSelection(incident.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {incident.incidentNumber}
                          {incident.isConfidential && (
                            <Badge variant="destructive" className="text-xs">
                              Confidential
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {INCIDENT_TYPES.find((t) => t.value === incident.type)
                          ?.label || incident.type}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {incident.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getSeverityBadgeVariant(incident.severity)}
                        >
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(incident.status)}>
                          {incident.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {incident.reporter
                          ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {new Date(incident.reportedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/dashboard/incidents/${incident.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No incidents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {incidentsData && incidentsData.total > filters.limit! && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(filters.page! - 1) * filters.limit! + 1} to{" "}
                {Math.min(filters.page! * filters.limit!, incidentsData.total)}{" "}
                of {incidentsData.total} incidents
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    filters.page! * filters.limit! >= incidentsData.total
                  }
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
