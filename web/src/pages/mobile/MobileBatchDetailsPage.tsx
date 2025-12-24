import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Calendar,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import {
  useMobileBatchDetails,
  useStudentFilter,
  useAttendanceStats,
} from "@/hooks/mobile";
import type { ExpectedStudent } from "@/types/mobile";
import type { BatchStatus } from "@/api/examSessions";

const STATUS_OPTIONS = [
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

type FilterType = "ALL" | "PRESENT" | "SUBMITTED" | "NOT_YET";

export const MobileBatchDetailsPage = () => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BatchStatus | null>(null);

  const { sessionData, isLoading, refetch, updateStatusMutation } =
    useMobileBatchDetails(batchId);
  const session = sessionData?.examSession;
  const expectedStudents = session?.expectedStudents || [];

  const filteredStudents = useStudentFilter(expectedStudents, filter)();
  const stats = useAttendanceStats(expectedStudents)();

  const handleStatusUpdate = async () => {
    if (!pendingStatus || !session) return;

    updateStatusMutation.mutate({
      id: session.id,
      status: pendingStatus,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NOT_STARTED: "#9ca3af",
      IN_PROGRESS: "#3b82f6",
      SUBMITTED: "#10b981",
      IN_TRANSIT: "#f59e0b",
      WITH_LECTURER: "#8b5cf6",
      UNDER_GRADING: "#6366f1",
      GRADED: "#14b8a6",
      RETURNED: "#f97316",
      COMPLETED: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  const getStudentStatus = (student: ExpectedStudent) => {
    const hasEntry = student.attendanceRecords?.some(
      (record) => record.action === "ENTRY"
    );
    const hasExit = student.attendanceRecords?.some(
      (record) => record.action === "EXIT"
    );

    if (hasEntry && hasExit)
      return { status: "COMPLETED", color: "bg-green-100 text-green-800" };
    if (hasEntry)
      return { status: "PRESENT", color: "bg-blue-100 text-blue-800" };
    return { status: "NOT_PRESENT", color: "bg-gray-100 text-gray-800" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-4 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Batch Not Found
            </h3>
            <p className="text-gray-500 mb-4">
              The requested exam batch could not be found.
            </p>
            <Button onClick={() => navigate("/mobile/custody")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Custody
            </Button>
          </div>
        </div>
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
              onClick={() => navigate("/mobile/custody")}
              className="text-white hover:bg-blue-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">{session.courseCode}</h1>
              <p className="text-blue-100 text-sm">Batch Details</p>
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

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Batch Info */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {session.courseCode}
                    </h2>
                    <p className="text-gray-600">{session.courseName}</p>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {session.venue}
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(session.examDate), "PPP")}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      style={{
                        backgroundColor: getStatusColor(session.status),
                      }}
                      className="text-white"
                    >
                      {session.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <Button
                    onClick={() => setShowStatusDialog(true)}
                    className="w-full"
                    disabled={updateStatusMutation.isPending}
                  >
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.present}
                    </div>
                    <div className="text-xs text-gray-600">Present</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {stats.absent}
                    </div>
                    <div className="text-xs text-gray-600">Absent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.total}
                    </div>
                    <div className="text-xs text-gray-600">Expected</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filter Students:</span>
                  <Select
                    value={filter}
                    onValueChange={(value: FilterType) => setFilter(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="NOT_YET">Not Yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Students ({filteredStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredStudents.length > 0 ? (
                  <div className="divide-y">
                    {filteredStudents.map((student: ExpectedStudent) => {
                      const studentStatus = getStudentStatus(student);
                      return (
                        <div key={student.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">
                                    {student.firstName || ""}{" "}
                                    {student.lastName || ""}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {student.indexNumber}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={studentStatus.color}
                            >
                              {studentStatus.status}
                            </Badge>
                          </div>

                          {student.attendanceRecords &&
                            student.attendanceRecords.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                {student.attendanceRecords.map(
                                  (record, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <span>{record.action}</span>
                                      <span>at</span>
                                      <span>
                                        {new Date(
                                          record.timestamp
                                        ).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Batch Status</DialogTitle>
              <DialogDescription>
                Change the status of this exam batch
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={pendingStatus || ""}
                onValueChange={(value) =>
                  setPendingStatus(value as BatchStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDialog(false);
                  setPendingStatus(null);
                }}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!pendingStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
