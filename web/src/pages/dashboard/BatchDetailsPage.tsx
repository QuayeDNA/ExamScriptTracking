import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examSessionsApi } from "@/api/examSessions";
import {
  ArrowLeft,
  Download,
  Upload,
  RefreshCw,
  Users,
  CheckCircle2,
  UserCheck,
  UserX,
  AlertCircle,
  Trash2,
  Clock,
} from "lucide-react";
import { socketService } from "@/lib/socket";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  downloadExpectedStudentsTemplate,
  parseStudentCSV,
  type ParsedStudent,
} from "@/utils/csvTemplates";
import type { BatchStatus } from "@/api/examSessions";

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

const getAttendanceStatusBadge = (
  status: string
): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} => {
  const statusMap: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    SUBMITTED: { variant: "default", label: "Submitted" },
    PRESENT: { variant: "secondary", label: "Present" },
    LEFT_WITHOUT_SUBMITTING: { variant: "destructive", label: "Left Early" },
  };
  return (
    statusMap[status] || {
      variant: "outline",
      label: status.replace(/_/g, " "),
    }
  );
};

export default function BatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!id) return;

    // Connect to socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Listen for attendance events
    const handleAttendanceRecorded = (data: unknown) => {
      if (
        typeof data === "object" &&
        data !== null &&
        "examSessionId" in data
      ) {
        const eventData = data as { examSessionId: string };
        if (eventData.examSessionId === id) {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["examSession", id] });
          queryClient.invalidateQueries({
            queryKey: ["attendanceSummary", id],
          });

          toast.success("New attendance recorded", {
            description: "A student has just checked in",
          });
        }
      }
    };

    const handleBatchStatusUpdated = (data: unknown) => {
      if (
        typeof data === "object" &&
        data !== null &&
        "examSessionId" in data
      ) {
        const eventData = data as { examSessionId: string };
        if (eventData.examSessionId === id) {
          queryClient.invalidateQueries({ queryKey: ["examSession", id] });

          toast.info("Batch status updated", {
            description: "The exam session status has been updated",
          });
        }
      }
    };

    // Register event listeners
    socketService.on("attendance:recorded", handleAttendanceRecorded);
    socketService.on("batch:status_updated", handleBatchStatusUpdated);

    // Cleanup on unmount
    return () => {
      socketService.off("attendance:recorded", handleAttendanceRecorded);
      socketService.off("batch:status_updated", handleBatchStatusUpdated);
    };
  }, [id, queryClient]);

  // Fetch exam session with attendances (no socket polling)
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["examSession", id],
    queryFn: () => examSessionsApi.getExamSession(id!),
  });

  // Fetch expected students
  const { data: expectedStudentsData } = useQuery({
    queryKey: ["expectedStudents", id],
    queryFn: () => examSessionsApi.getExpectedStudents(id!),
    enabled: !!id,
  });

  // Fetch attendance summary
  const { data: summaryData } = useQuery({
    queryKey: ["attendanceSummary", id],
    queryFn: () => examSessionsApi.getAttendanceSummary(id!),
    enabled: !!id,
  });

  // Mutation for adding expected students
  const addExpectedStudentsMutation = useMutation({
    mutationFn: (students: ParsedStudent[]) =>
      examSessionsApi.addExpectedStudents(id!, students),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expectedStudents", id] });
      queryClient.invalidateQueries({ queryKey: ["attendanceSummary", id] });
      queryClient.invalidateQueries({ queryKey: ["examSession", id] });
      setUploadError(null);

      toast.success("Upload Complete!", {
        description: `${data.added} students added • ${data.newStudentRecordsCreated} new records created`,
      });
    },
    onError: (error: Error) => {
      toast.error("Upload Failed", {
        description: error.message,
      });
    },
  });

  // Mutation for removing expected student
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) =>
      examSessionsApi.removeExpectedStudent(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expectedStudents", id] });
      queryClient.invalidateQueries({ queryKey: ["attendanceSummary", id] });
      queryClient.invalidateQueries({ queryKey: ["examSession", id] });
      toast.success("Student removed from exam session");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove student", {
        description: error.message,
      });
    },
  });

  // Mutation for ending session
  const endSessionMutation = useMutation({
    mutationFn: () => examSessionsApi.endExamSession(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["examSession", id] });
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      toast.success("Session Ended", {
        description: `Session marked as SUBMITTED with ${data.examSession.scriptsCount} scripts recorded`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to end session", {
        description: error.message,
      });
    },
  });

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadError(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const students = (results.data as Record<string, string>[])
            .map(parseStudentCSV)
            .filter((student) => student.indexNumber?.trim().length > 0);

          if (students.length === 0) {
            setUploadError(
              "No valid students found in CSV file. Required column: indexNumber"
            );
            setUploading(false);
            return;
          }

          addExpectedStudentsMutation.mutate(students, {
            onSettled: () => setUploading(false),
            onError: (error: Error) => {
              setUploadError(error.message || "Failed to upload students");
            },
          });
        },
        error: (error) => {
          setUploadError(`CSV parsing error: ${error.message}`);
          setUploading(false);
        },
      });

      event.target.value = "";
    },
    [addExpectedStudentsMutation]
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["examSession", id] });
    queryClient.invalidateQueries({ queryKey: ["expectedStudents", id] });
    queryClient.invalidateQueries({ queryKey: ["attendanceSummary", id] });
    toast.success("Data refreshed");
  };

  if (isLoading || !sessionData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const session = sessionData.examSession;
  const stats = session.stats || {
    expectedStudents: 0,
    totalAttended: 0,
    submitted: 0,
    present: 0,
    attendanceRate: "0",
  };

  const expectedStudents = expectedStudentsData?.expectedStudents || [];
  const attendances = session.attendances || [];
  const notYetArrived = summaryData?.summary?.notYetArrived || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard/exam-sessions")}
                variant="ghost"
                size="icon"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">
                    {session.courseCode} - {session.courseName}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(session.status)}>
                    {session.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  Batch: {session.batchQrCode} • {session.venue} •{" "}
                  {new Date(session.examDate).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {session.status === "IN_PROGRESS" && (
                <Button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to end this exam session?\n\n" +
                          "This will:\n" +
                          "• Mark all scripts as collected\n" +
                          "• Update status to SUBMITTED\n" +
                          "• Close the session for new entries"
                      )
                    ) {
                      endSessionMutation.mutate();
                    }
                  }}
                  disabled={endSessionMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {endSessionMutation.isPending ? "Ending..." : "End Session"}
                </Button>
              )}
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expected
                </p>
                <p className="text-3xl font-bold mt-1">
                  {stats.expectedStudents}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Attended
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {stats.totalAttended}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Submitted
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.submitted}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.attendanceRate}%
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Expected Students */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Expected Students ({expectedStudents.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={downloadExpectedStudentsTemplate}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                  <label>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload CSV"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {uploadError && (
                <div className="mx-6 mt-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{uploadError}</p>
                </div>
              )}

              {expectedStudents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No expected students yet. Upload a CSV to add students.</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Index Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expectedStudents.map((item) => {
                        const hasAttended = attendances.some(
                          (a) => a.student.indexNumber === item.indexNumber
                        );
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">
                              {item.indexNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.firstName && item.lastName
                                    ? `${item.firstName} ${item.lastName}`
                                    : "N/A"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.program && item.level
                                    ? `${item.program} - L${item.level}`
                                    : ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasAttended ? (
                                <Badge variant="default">Present</Badge>
                              ) : (
                                <Badge variant="secondary">Not Arrived</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() =>
                                  removeStudentMutation.mutate(item.id)
                                }
                                variant="ghost"
                                size="icon"
                                disabled={removeStudentMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Not Yet Arrived */}
          {notYetArrived.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-muted-foreground" />
                  Not Yet Arrived ({notYetArrived.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                  {notYetArrived.map((student) => (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <p className="font-mono text-sm font-medium">
                          {student.indexNumber}
                        </p>
                        <p className="text-sm">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.program} - Level {student.level}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Attendances */}
        <Card>
          <CardHeader>
            <CardTitle>Attendances ({attendances.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attendances.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No attendance records yet</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.map((attendance) => {
                      const statusInfo = getAttendanceStatusBadge(
                        attendance.status
                      );
                      return (
                        <TableRow key={attendance.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {attendance.student.firstName}{" "}
                                {attendance.student.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {attendance.student.indexNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {attendance.entryTime
                                ? new Date(
                                    attendance.entryTime
                                  ).toLocaleTimeString()
                                : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {attendance.exitTime
                                ? new Date(
                                    attendance.exitTime
                                  ).toLocaleTimeString()
                                : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
