import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  examSessionsApi,
  type ExamSession,
  type BatchStatus,
} from "@/api/examSessions";
import {
  getTransferHistory,
  type BatchTransfer,
  type TransferStatus,
} from "@/api/batchTransfers";
import {
  Search,
  Clock,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BATCH_STATUSES: { value: BatchStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "WITH_LECTURER", label: "With Lecturer" },
  { value: "UNDER_GRADING", label: "Under Grading" },
  { value: "GRADED", label: "Graded" },
  { value: "RETURNED", label: "Returned" },
  { value: "COMPLETED", label: "Completed" },
];

const getStatusBadgeVariant = (
  status: BatchStatus
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<
    BatchStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    NOT_STARTED: "secondary",
    IN_PROGRESS: "default",
    SUBMITTED: "outline",
    IN_TRANSIT: "outline",
    WITH_LECTURER: "outline",
    UNDER_GRADING: "outline",
    GRADED: "outline",
    RETURNED: "outline",
    COMPLETED: "secondary",
  };
  return variants[status] || "default";
};

const getTransferBadgeVariant = (
  status: TransferStatus
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<
    TransferStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PENDING: "outline",
    CONFIRMED: "default",
    DISCREPANCY_REPORTED: "destructive",
    RESOLVED: "secondary",
  };
  return variants[status] || "default";
};

const getTransferColorClass = (status: TransferStatus): string => {
  const colors: Record<TransferStatus, string> = {
    PENDING: "bg-yellow-500",
    CONFIRMED: "bg-green-500",
    DISCREPANCY_REPORTED: "bg-red-500",
    RESOLVED: "bg-blue-500",
  };
  return colors[status] || "bg-gray-400";
};

export default function BatchTrackingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<ExamSession | null>(null);

  // Fetch exam sessions with filters
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ["examSessions", search, statusFilter, departmentFilter],
    queryFn: () =>
      examSessionsApi.getExamSessions({
        search: search || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
      }),
  });

  // Fetch filter options
  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => examSessionsApi.getDepartments(),
  });

  // Fetch transfer history for selected batch
  const { data: transferData } = useQuery({
    queryKey: ["transferHistory", selectedBatch?.id],
    queryFn: () => getTransferHistory(selectedBatch!.id),
    enabled: !!selectedBatch,
  });

  const getCurrentHandler = (
    transfers: BatchTransfer[] | undefined
  ): BatchTransfer | null => {
    if (!transfers || transfers.length === 0) return null;
    const confirmedTransfers = transfers.filter(
      (t) => t.status === "CONFIRMED"
    );
    if (confirmedTransfers.length === 0) return null;
    return confirmedTransfers.sort(
      (a, b) =>
        new Date(b.confirmedAt || b.requestedAt).getTime() -
        new Date(a.confirmedAt || a.requestedAt).getTime()
    )[0];
  };

  const currentHandler = getCurrentHandler(transferData?.transfers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Tracking</CardTitle>
          <CardDescription>
            Track exam script batches and their chain of custody in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search batch, course, or lecturer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter || undefined}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {BATCH_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter || undefined}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                {departmentsData?.departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("");
                  setDepartmentFilter("");
                  setSearch("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch List (Left Column) */}
        <Card className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-base">
              Batches ({sessionsData?.examSessions.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading batches...
              </div>
            ) : sessionsData?.examSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No batches found
              </div>
            ) : (
              sessionsData?.examSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedBatch?.id === session.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedBatch(session)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="font-mono text-xs text-muted-foreground">
                          {session.batchQrCode}
                        </p>
                        <p className="font-semibold text-sm">
                          {session.courseCode}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {session.courseName}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(session.status)}>
                        {session.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>{session._count?.attendances || 0} scripts</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Batch Details & Timeline (Right Column) */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedBatch ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a batch from the list to view its tracking details</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Batch Info and Current Location - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Batch Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          {selectedBatch.courseCode} -{" "}
                          {selectedBatch.courseName}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Batch QR: {selectedBatch.batchQrCode}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(selectedBatch.status)}
                        className="text-sm"
                      >
                        {selectedBatch.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Lecturer</p>
                        <p className="font-medium">
                          {selectedBatch.lecturerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Department</p>
                        <p className="font-medium">
                          {selectedBatch.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Venue</p>
                        <p className="font-medium">{selectedBatch.venue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Exam Date</p>
                        <p className="font-medium">
                          {new Date(selectedBatch.examDate).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Scripts Count</p>
                        <p className="font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {selectedBatch._count?.attendances || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Location */}
                {currentHandler && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Current Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {currentHandler.toHandler?.firstName?.[0] || ""}
                            {currentHandler.toHandler?.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {currentHandler.toHandler?.firstName}{" "}
                            {currentHandler.toHandler?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {currentHandler.toHandler?.role.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {currentHandler.toHandler?.email}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {currentHandler.examsReceived || 0} scripts
                                received
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{currentHandler.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Chain of Custody Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Chain of Custody
                  </CardTitle>
                  <CardDescription>
                    Complete transfer history and custody chain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!transferData || transferData.transfers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p>No transfer history available for this batch</p>
                    </div>
                  ) : (
                    <div className="relative space-y-6">
                      {/* Timeline connector line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                      {transferData.transfers
                        .sort(
                          (a: BatchTransfer, b: BatchTransfer) =>
                            new Date(b.requestedAt).getTime() -
                            new Date(a.requestedAt).getTime()
                        )
                        .map((transfer: BatchTransfer) => {
                          const hasDiscrepancy =
                            transfer.status === "DISCREPANCY_REPORTED";
                          const isResolved = transfer.status === "RESOLVED";
                          const scriptsMatch =
                            transfer.examsExpected === transfer.examsReceived;

                          return (
                            <div key={transfer.id} className="relative pl-14">
                              {/* Timeline dot */}
                              <div
                                className={`absolute left-4 top-2 h-5 w-5 rounded-full border-4 border-background ${getTransferColorClass(
                                  transfer.status
                                )} z-10`}
                              />

                              {/* Transfer Card */}
                              <Card
                                className={
                                  hasDiscrepancy && !isResolved
                                    ? "border-destructive/50 bg-destructive/5"
                                    : ""
                                }
                              >
                                <CardContent className="p-4 space-y-3">
                                  {/* Transfer Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      {/* From Handler */}
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src="" />
                                          <AvatarFallback className="text-xs">
                                            {transfer.fromHandler
                                              ?.firstName?.[0] || ""}
                                            {transfer.fromHandler
                                              ?.lastName?.[0] || ""}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-sm font-medium">
                                            {transfer.fromHandler?.firstName}{" "}
                                            {transfer.fromHandler?.lastName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {transfer.fromHandler?.role.replace(
                                              /_/g,
                                              " "
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

                                      {/* To Handler */}
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src="" />
                                          <AvatarFallback className="text-xs">
                                            {transfer.toHandler
                                              ?.firstName?.[0] || ""}
                                            {transfer.toHandler
                                              ?.lastName?.[0] || ""}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-sm font-medium">
                                            {transfer.toHandler?.firstName}{" "}
                                            {transfer.toHandler?.lastName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {transfer.toHandler?.role.replace(
                                              /_/g,
                                              " "
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <Badge
                                      variant={getTransferBadgeVariant(
                                        transfer.status
                                      )}
                                    >
                                      {transfer.status.replace(/_/g, " ")}
                                    </Badge>
                                  </div>

                                  {/* Scripts Info */}
                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <span>
                                        Expected: {transfer.examsExpected}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Package
                                        className={`h-4 w-4 ${
                                          scriptsMatch
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      />
                                      <span
                                        className={
                                          scriptsMatch
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }
                                      >
                                        Received: {transfer.examsReceived || 0}
                                      </span>
                                    </div>
                                    {scriptsMatch &&
                                      transfer.status === "CONFIRMED" && (
                                        <div className="flex items-center gap-1 text-green-600">
                                          <CheckCircle2 className="h-4 w-4" />
                                          <span>Match</span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Location & Timestamps */}
                                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{transfer.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        Requested:{" "}
                                        {new Date(
                                          transfer.requestedAt
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    {transfer.confirmedAt && (
                                      <div className="flex items-center gap-1 col-span-2">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>
                                          Confirmed:{" "}
                                          {new Date(
                                            transfer.confirmedAt
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Discrepancy Note */}
                                  {hasDiscrepancy &&
                                    transfer.discrepancyNote && (
                                      <Card className="border-destructive/50 bg-destructive/10">
                                        <CardContent className="p-3 flex items-start gap-2">
                                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-destructive">
                                              Discrepancy Reported
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {transfer.discrepancyNote}
                                            </p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}

                                  {/* Resolution Note */}
                                  {isResolved && transfer.resolutionNote && (
                                    <Card className="border-blue-500/50 bg-blue-500/10">
                                      <CardContent className="p-3 flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-blue-600">
                                            Resolved
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {transfer.resolutionNote}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
