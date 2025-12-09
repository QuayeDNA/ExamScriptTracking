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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  ShieldOff,
  AlertCircle,
  Eye,
  Calendar,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import {
  classAttendanceApi,
  type AttendanceSession,
} from "@/api/classAttendance";

export default function AttendanceSessionsPage() {
  const [searchFilter, setSearchFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | "">("");
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set()
  );
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] =
    useState<AttendanceSession | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [sessionToUpdate, setSessionToUpdate] =
    useState<AttendanceSession | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");

  const queryClient = useQueryClient();

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ["attendance-sessions", searchFilter, isActiveFilter],
    queryFn: () =>
      classAttendanceApi.getAttendanceSessions({
        search: searchFilter || undefined,
        isActive: isActiveFilter === "" ? undefined : isActiveFilter,
      }),
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { deviceName?: string; isActive?: boolean };
    }) => classAttendanceApi.updateAttendanceSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      toast.success("Session updated successfully");
    },
    onError: () => {
      toast.error("Failed to update session");
    },
  });

  const sessions = sessionsData?.sessions || [];

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSessions);
    if (checked) {
      newSelected.add(sessionId);
    } else {
      newSelected.delete(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSessions(new Set(sessions.map((s) => s.id)));
    } else {
      setSelectedSessions(new Set());
    }
  };

  const handleRevokeSession = (session: AttendanceSession) => {
    setSessionToRevoke(session);
    setShowRevokeDialog(true);
  };

  const confirmRevokeSession = async () => {
    if (!sessionToRevoke) return;

    updateSessionMutation.mutate({
      id: sessionToRevoke.id,
      data: { isActive: false },
    });

    setShowRevokeDialog(false);
    setSessionToRevoke(null);
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Class Attendance Sessions
          </h1>
          <p className="text-muted-foreground">
            Manage device-based attendance recording sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
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
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by device name or ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={isActiveFilter === "" ? "" : isActiveFilter.toString()}
                onChange={(e) =>
                  setIsActiveFilter(
                    e.target.value === "" ? "" : e.target.value === "true"
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Sessions</CardTitle>
              <CardDescription>{sessions.length} sessions</CardDescription>
            </div>
            {selectedSessions.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedSessions.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSessions(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedSessions.size === sessions.length &&
                        sessions.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recordings</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSessions.has(session.id)}
                        onCheckedChange={(checked) =>
                          handleSelectSession(session.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {session.deviceName || "Unnamed Device"}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {session.deviceId.substring(0, 12)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.isActive ? "default" : "secondary"}
                      >
                        {session.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {session.totalRecordings}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(session.lastActivity),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateSession(session)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {session.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(session)}
                            className="text-destructive hover:text-destructive"
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No sessions found
              </h3>
              <p className="text-muted-foreground">
                {sessions.length === 0
                  ? "No attendance sessions have been created yet."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Session Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Revoke Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the session for{" "}
              <strong>
                {sessionToRevoke?.deviceName || sessionToRevoke?.deviceId}
              </strong>
              ? This will prevent the device from recording new attendance
              sessions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevokeDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRevokeSession}>
              Revoke Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Session Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Session</DialogTitle>
            <DialogDescription>
              Update the device name for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Enter a descriptive name for this device"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmUpdateSession}>Update Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
