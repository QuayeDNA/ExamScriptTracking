import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Search,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClassAttendanceSession {
  id: string;
  className: string;
  venue: string;
  createdAt: string;
  studentCount: number;
}

export const MobileStudentAttendancePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] =
    useState<ClassAttendanceSession | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["class-attendance-sessions"],
    queryFn: () =>
      Promise.resolve([
        {
          id: "1",
          className: "Computer Science 101",
          venue: "Room 101",
          createdAt: new Date().toISOString(),
          studentCount: 30,
        },
        {
          id: "2",
          className: "Mathematics 201",
          venue: "Room 205",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          studentCount: 25,
        },
      ]),
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["students-in-class", selectedSession?.id],
    queryFn: () =>
      Promise.resolve([
        {
          id: "1",
          name: "Alice Johnson",
          studentId: "STU001",
          attendanceStatus: "PRESENT",
        },
        {
          id: "2",
          name: "Bob Smith",
          studentId: "STU002",
          attendanceStatus: "ABSENT",
        },
        {
          id: "3",
          name: "Charlie Brown",
          studentId: "STU003",
          attendanceStatus: null,
        },
      ]),
    enabled: !!selectedSession,
  });

  const createSessionMutation = useMutation({
    mutationFn: (_sessionData: { className: string; venue: string }) =>
      Promise.resolve({ message: "Session created successfully" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["class-attendance-sessions"],
      });
      toast.success("Attendance session created successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to create session", {
        description: error.error || "An error occurred",
      });
    },
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: (_params: {
      sessionId: string;
      studentId: string;
      status: "PRESENT" | "ABSENT";
    }) => Promise.resolve({ message: "Attendance recorded successfully" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["students-in-class", selectedSession?.id],
      });
      toast.success("Attendance recorded");
    },
    onError: (error: any) => {
      toast.error("Failed to record attendance", {
        description: error.error || "An error occurred",
      });
    },
  });

  const filteredStudents =
    students?.filter(
      (student) =>
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.studentId.toLowerCase().includes(studentSearch.toLowerCase())
    ) || [];

  const presentCount =
    students?.filter((s) => s.attendanceStatus === "PRESENT").length || 0;
  const absentCount =
    students?.filter((s) => s.attendanceStatus === "ABSENT").length || 0;
  const unmarkedCount =
    students?.filter((s) => !s.attendanceStatus).length || 0;

  const handleCreateSession = () => {
    const className = prompt("Enter class name:");
    const venue = prompt("Enter venue:");

    if (className && venue) {
      createSessionMutation.mutate({ className, venue });
    }
  };

  const handleRecordAttendance = (
    studentId: string,
    status: "PRESENT" | "ABSENT"
  ) => {
    if (!selectedSession) return;

    recordAttendanceMutation.mutate({
      sessionId: selectedSession.id,
      studentId,
      status,
    });
  };

  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              onClick={() => navigate("/mobile")}
              className="text-white hover:bg-blue-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">Student Attendance</h1>
              <p className="text-blue-100 text-sm">Record class attendance</p>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {!selectedSession ? (
              <>
                {/* Create New Session */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={handleCreateSession}
                      className="w-full"
                      disabled={createSessionMutation.isPending}
                    >
                      {createSessionMutation.isPending
                        ? "Creating..."
                        : "Create New Session"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessions && sessions.length > 0 ? (
                      <div className="space-y-3">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">
                                  {session.className}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {session.venue}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(
                                    new Date(session.createdAt),
                                    "MMM dd, HH:mm"
                                  )}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {session.studentCount} students
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No active sessions</p>
                        <p className="text-sm text-gray-500">
                          Create a new session to get started
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Session Header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSession(null)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sessions
                      </Button>
                      <Badge variant="outline">
                        {selectedSession.className}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {presentCount}
                        </div>
                        <div className="text-sm text-gray-600">Present</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {absentCount}
                        </div>
                        <div className="text-sm text-gray-600">Absent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">
                          {unmarkedCount}
                        </div>
                        <div className="text-sm text-gray-600">Unmarked</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Search */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Student List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Students ({filteredStudents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">
                          Loading students...
                        </p>
                      </div>
                    ) : filteredStudents.length > 0 ? (
                      <div className="space-y-3">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {student.studentId}
                                  </p>
                                </div>
                                {student.attendanceStatus === "PRESENT" && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {student.attendanceStatus === "ABSENT" && (
                                  <UserX className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant={
                                  student.attendanceStatus === "PRESENT"
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  handleRecordAttendance(student.id, "PRESENT")
                                }
                                disabled={recordAttendanceMutation.isPending}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  student.attendanceStatus === "ABSENT"
                                    ? "destructive"
                                    : "outline"
                                }
                                onClick={() =>
                                  handleRecordAttendance(student.id, "ABSENT")
                                }
                                disabled={recordAttendanceMutation.isPending}
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No students found</p>
                        <p className="text-sm text-gray-500">
                          Try adjusting your search
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
