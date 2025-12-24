import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, AlertCircle, Calendar, MapPin, FileText } from "lucide-react";
import {
  classAttendanceApi,
  type AttendanceSession,
} from "@/api/classAttendance";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

const DEVICE_ID_KEY = "attendance_device_id";
const DEVICE_NAME_KEY = "attendance_device_name";

export const MobileAttendancePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");

  const loadDeviceInfo = useCallback(async () => {
    try {
      const storedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
      const storedDeviceName = localStorage.getItem(DEVICE_NAME_KEY);

      if (storedDeviceId) {
        setDeviceId(storedDeviceId);
      } else {
        const newDeviceId = `web-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        localStorage.setItem(DEVICE_ID_KEY, newDeviceId);
        setDeviceId(newDeviceId);
      }

      if (storedDeviceName) {
        setDeviceName(storedDeviceName);
      } else {
        const newDeviceName = `Web Device - ${user?.name || "User"}`;
        localStorage.setItem(DEVICE_NAME_KEY, newDeviceName);
        setDeviceName(newDeviceName);
      }
    } catch (error) {
      console.warn("Failed to load device info:", error);
      // Fallback values
      setDeviceId(`web-fallback-${Date.now()}`);
      setDeviceName(`Web Device - ${user?.name || "User"}`);
    }
  }, [user?.name]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await classAttendanceApi.getAttendanceSessions({
        isActive: true,
      });
      setSessions(data.sessions || []);
    } catch (error: unknown) {
      const err = error as { error?: string };
      toast.error("Failed to load sessions", {
        description: err.error || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load device info
  useEffect(() => {
    loadDeviceInfo();
    loadSessions();
  }, [loadDeviceInfo, loadSessions]);

  const createSessionMutation = useMutation({
    mutationFn: (sessionData: {
      courseCode: string;
      courseName: string;
      venue: string;
      expectedStudents: number;
      deviceId: string;
      deviceName: string;
    }) =>
      Promise.resolve({
        message: "Session created successfully",
        session: {
          id: `session-${Date.now()}`,
          deviceId: sessionData.deviceId,
          deviceName: sessionData.deviceName,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          totalRecordings: 0,
        },
      }),
    onSuccess: () => {
      toast.success("Session created successfully");
      loadSessions();
      setShowSessionDialog(false);
    },
    onError: (error: unknown) => {
      const err = error as { error?: string };
      toast.error("Failed to create session", {
        description: err.error || "An error occurred",
      });
    },
  });

  const handleCreateSession = async (formData: FormData) => {
    const sessionData = {
      courseCode: formData.get("courseCode") as string,
      courseName: formData.get("courseName") as string,
      venue: formData.get("venue") as string,
      expectedStudents:
        parseInt(formData.get("expectedStudents") as string) || 0,
      deviceId,
      deviceName,
    };

    createSessionMutation.mutate(sessionData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Class Attendance</h1>
              <p className="text-blue-100 text-sm">Record student attendance</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSessionDialog(true)}
              className="bg-blue-500 hover:bg-blue-400"
            >
              <Users className="w-4 h-4 mr-1" />
              New Session
            </Button>
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-white border-b p-4">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Device ID:</span>
              <span className="font-mono text-xs">
                {deviceId.slice(0, 16)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span>Device Name:</span>
              <span className="font-medium">{deviceName}</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
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
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      navigate(
                        `/mobile/student-attendance?sessionId=${session.id}`
                      )
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            Session {session.id.slice(-8)}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {session.deviceName || "Unknown Device"}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            Device: {session.deviceId.slice(-8)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            session.isActive
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {session.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {session.totalRecordings || 0}
                          </div>
                          <div className="text-xs text-gray-600">
                            Recordings
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {session.isActive ? "Active" : "Inactive"}
                          </div>
                          <div className="text-xs text-gray-600">Status</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {new Date(
                              session.lastActivity
                            ).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-gray-600">
                            Last Activity
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No attendance sessions
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first attendance session to start recording
                  student attendance.
                </p>
                <Button onClick={() => setShowSessionDialog(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Create Session
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
              className="flex flex-col items-center space-y-1 text-blue-600"
              onClick={() => navigate("/mobile/attendance")}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Attendance</span>
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
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile/incidents")}
            >
              <AlertCircle className="w-5 h-5" />
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

        {/* Create Session Dialog */}
        <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Attendance Session</DialogTitle>
              <DialogDescription>
                Start a new class attendance session for recording student
                presence.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateSession(formData);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="courseCode">Course Code</Label>
                <Input id="courseCode" name="courseCode" required />
              </div>

              <div>
                <Label htmlFor="courseName">Course Name</Label>
                <Input id="courseName" name="courseName" required />
              </div>

              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" name="venue" required />
              </div>

              <div>
                <Label htmlFor="expectedStudents">Expected Students</Label>
                <Input
                  id="expectedStudents"
                  name="expectedStudents"
                  type="number"
                  min="1"
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSessionDialog(false)}
                  disabled={createSessionMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending
                    ? "Creating..."
                    : "Create Session"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
