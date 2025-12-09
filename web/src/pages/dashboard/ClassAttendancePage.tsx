import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  ShieldOff,
  Shield,
  Smartphone,
  Users,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import {
  classAttendanceApi,
  type AttendanceSession,
} from "@/api/classAttendance";
import RecordingDetailsModal from "@/components/RecordingDetailsModal";

export default function ClassAttendancePage() {
  const [searchFilter, setSearchFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [sessionToUpdate, setSessionToUpdate] =
    useState<AttendanceSession | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");

  const queryClient = useQueryClient();

  // Fetch all attendance sessions
  const { data: sessionsData } = useQuery({
    queryKey: ["attendance-sessions-all"],
    queryFn: () =>
      classAttendanceApi.getAttendanceSessions({
        limit: 100, // Get all sessions
      }),
  });

  const sessions = sessionsData?.sessions || [];

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { deviceName?: string; isActive?: boolean };
    }) => classAttendanceApi.updateAttendanceSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions-all"] });
      toast.success("Session updated successfully");
    },
    onError: () => {
      toast.error("Failed to update session");
    },
  });

  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  );

  const handleToggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleViewDetails = (recordId: string) => {
    setSelectedRecord(recordId);
    setShowDetailsModal(true);
  };

  const handleUpdateSession = (session: AttendanceSession) => {
    setSessionToUpdate(session);
    setNewDeviceName(session.deviceName || "");
    setShowUpdateDialog(true);
  };

  const confirmUpdateSession = async () => {
    if (!sessionToUpdate) return;

    updateSessionMutation.mutate({
      id: sessionToUpdate.id,
      data: { deviceName: newDeviceName },
    });

    setShowUpdateDialog(false);
    setSessionToUpdate(null);
    setNewDeviceName("");
  };

  const handleToggleActive = (session: AttendanceSession) => {
    updateSessionMutation.mutate({
      id: session.id,
      data: { isActive: !session.isActive },
    });
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      !searchFilter ||
      session.deviceId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      session.deviceName?.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesSession =
      sessionFilter === "all" || session.id === sessionFilter;

    return matchesSearch && matchesSession;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Class Attendance Management
        </h1>
        <p className="text-muted-foreground">
          Manage devices and view attendance recordings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {sessions.filter((s) => s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Sessions
            </CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {sessions.filter((s) => !s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recordings
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {sessions.reduce((sum, s) => sum + s.totalRecordings, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter attendance recordings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by device ID or name..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.deviceName || session.deviceId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchFilter("");
                setSessionFilter("all");
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No sessions found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isExpanded={expandedSessions.has(session.id)}
              onToggle={() => handleToggleSession(session.id)}
              onViewDetails={handleViewDetails}
              onUpdateSession={handleUpdateSession}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>

      {/* Recording Details Modal */}
      {selectedRecord && (
        <RecordingDetailsModal
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRecord(null);
          }}
          recordId={selectedRecord}
        />
      )}

      {/* Update Device Name Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
            <DialogDescription>
              Update the display name for this attendance device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                placeholder="Enter device name"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Device ID: {sessionToUpdate?.deviceId}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmUpdateSession}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Session Card Component
function SessionCard({
  session,
  isExpanded,
  onToggle,
  onViewDetails,
  onUpdateSession,
  onToggleActive,
}: {
  session: AttendanceSession;
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetails: (recordId: string) => void;
  onUpdateSession: (session: AttendanceSession) => void;
  onToggleActive: (session: AttendanceSession) => void;
}) {
  const { data: recordsData, isLoading } = useQuery({
    queryKey: ["attendance-records", session.id],
    queryFn: () => classAttendanceApi.getAttendanceRecords(session.id),
    enabled: isExpanded,
  });

  const records = recordsData?.records || [];

  return (
    <Card>
      <CardHeader className="hover:bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex-1 cursor-pointer" onClick={onToggle}>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {session.deviceName || session.deviceId}
              {session.isActive ? (
                <Badge variant="default" className="ml-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              Device ID: {session.deviceId} • Last Activity:{" "}
              {format(new Date(session.lastActivity), "PPp")} •{" "}
              {session.totalRecordings} recording(s)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {isExpanded ? "Hide" : "Show"} Recordings
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdateSession(session)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename Device
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(session)}>
                  {session.isActive ? (
                    <>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No recordings for this session
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium">
                        {record.courseName || "N/A"}
                      </div>
                      {record.courseCode && (
                        <div className="text-sm text-muted-foreground">
                          {record.courseCode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.lecturerName || "Not specified"}
                    </TableCell>
                    <TableCell>
                      {record.status === "COMPLETED" ? (
                        <Badge
                          variant="default"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.totalStudents}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.startTime), "PPp")}
                    </TableCell>
                    <TableCell>
                      {record.endTime
                        ? format(new Date(record.endTime), "PPp")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(record.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}
    </Card>
  );
}
