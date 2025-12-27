import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  examSessionsApi,
  type ExamSession,
  type CreateExamSessionData,
  type UpdateExamSessionData,
  type BatchStatus,
} from "@/api/examSessions";
import { usersApi } from "@/api/users";
import {
  Plus,
  Search,
  Download,
  QrCode,
  Pencil,
  Trash2,
  FileDown,
  Calendar,
  Eye,
  AlertTriangle,
  Grid3X3,
  List,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { toast } from "sonner";

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

export default function ExamSessionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const isLecturer = user?.role === "LECTURER";
  const canCreate = isAdmin || isLecturer;

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [facultyFilter, setFacultyFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Form states
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(
    null
  );
  const [formData, setFormData] = useState<{
    courseCode: string;
    courseName: string;
    lecturerId: string;
    lecturerName: string;
    department: string;
    faculty: string;
    venue: string;
    examDate: Date | undefined;
  }>({
    courseCode: "",
    courseName: "",
    lecturerId: "",
    lecturerName: "",
    department: "",
    faculty: "",
    venue: "",
    examDate: undefined,
  });
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [newStatus, setNewStatus] = useState<BatchStatus>("IN_PROGRESS");

  // Fetch exam sessions with filters
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: [
      "examSessions",
      search,
      statusFilter,
      departmentFilter,
      facultyFilter,
      dateFromFilter,
      dateToFilter,
      page,
      limit,
    ],
    queryFn: () =>
      examSessionsApi.getExamSessions({
        search: search || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        faculty: facultyFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        page,
        limit,
      }),
  });

  // Fetch filter options
  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => examSessionsApi.getDepartments(),
  });

  const { data: facultiesData } = useQuery({
    queryKey: ["faculties"],
    queryFn: () => examSessionsApi.getFaculties(),
  });

  // Fetch lecturers for dropdown
  const { data: lecturersData } = useQuery({
    queryKey: ["lecturers"],
    queryFn: () => usersApi.getUsers({ role: "LECTURER", isActive: true }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateExamSessionData) =>
      examSessionsApi.createExamSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      toast.success("Exam session created successfully");
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create exam session");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExamSessionData }) =>
      examSessionsApi.updateExamSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      toast.success("Exam session updated successfully");
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update exam session");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BatchStatus }) =>
      examSessionsApi.updateExamSessionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      toast.success("Status updated successfully");
      setIsStatusModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => examSessionsApi.deleteExamSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      toast.success("Exam session deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedSession(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete exam session");
    },
  });

  // Get QR code
  const handleShowQRCode = async (session: ExamSession) => {
    try {
      const data = await examSessionsApi.getQRCode(session.id);
      setQrCodeData(data.qrCode);
      setSelectedSession(session);
      setIsQRModalOpen(true);
    } catch (error) {
      toast.error((error as Error).message || "Failed to fetch QR code");
    }
  };

  // Download QR code
  const handleDownloadQRCode = () => {
    if (!qrCodeData || !selectedSession) return;

    const link = document.createElement("a");
    link.href = qrCodeData;
    link.download = `${selectedSession.batchQrCode}_QR.png`;
    link.click();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!sessionsData?.examSessions.length) return;

    const headers = [
      "Batch QR Code",
      "Course Code",
      "Course Name",
      "Lecturer",
      "Department",
      "Faculty",
      "Venue",
      "Exam Date",
      "Status",
      "Attendances",
    ];
    const rows = sessionsData.examSessions.map((s) => [
      s.batchQrCode,
      s.courseCode,
      s.courseName,
      s.lecturerName,
      s.department,
      s.faculty,
      s.venue,
      new Date(s.examDate).toLocaleString(),
      s.status,
      s._count?.attendances || 0,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exam_sessions_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const templateContent = `courseCode,courseName,lecturerId,lecturerName,department,faculty,venue,examDate
CS101,Introduction to Computer Science,LEC001,Dr. John Smith,Computer Science,Faculty of Science,Room 101,2025-01-15T09:00:00.000Z
MATH201,Calculus II,LEC002,Prof. Sarah Johnson,Mathematics,Faculty of Science,Room 205,2025-01-16T14:30:00.000Z
ENG301,Advanced English Literature,LEC003,Dr. Michael Brown,English Literature,Faculty of Arts,Room 312,2025-01-17T11:15:00.000Z`;

    const blob = new Blob([templateContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "exam_sessions_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      courseCode: "",
      courseName: "",
      lecturerId: "",
      lecturerName: "",
      department: "",
      faculty: "",
      venue: "",
      examDate: undefined,
    });
    setSelectedSession(null);
  };

  const openEditModal = (session: ExamSession) => {
    setSelectedSession(session);
    setFormData({
      courseCode: session.courseCode,
      courseName: session.courseName,
      lecturerId: session.lecturerId,
      lecturerName: session.lecturerName,
      department: session.department,
      faculty: session.faculty,
      venue: session.venue,
      examDate: new Date(session.examDate),
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (session: ExamSession) => {
    if (session._count?.attendances && session._count.attendances > 0) {
      toast.error(
        `Cannot delete exam session with ${session._count.attendances} attendance record(s)`
      );
      return;
    }
    setSelectedSession(session);
    setIsDeleteModalOpen(true);
  };

  const openStatusModal = (session: ExamSession) => {
    setSelectedSession(session);
    setNewStatus(session.status);
    setIsStatusModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.examDate) {
      toast.error("Please select an exam date and time");
      return;
    }

    // Convert Date object to ISO 8601 format
    const formattedData = {
      ...formData,
      examDate: formData.examDate.toISOString(),
    };

    if (isEditModalOpen && selectedSession) {
      updateMutation.mutate({ id: selectedSession.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleStatusUpdate = () => {
    if (selectedSession) {
      updateStatusMutation.mutate({
        id: selectedSession.id,
        status: newStatus,
      });
    }
  };

  // Exam Session Card Component
  const ExamSessionCard = ({ session }: { session: ExamSession }) => (
    <Card className="h-full w-full min-w-[280px]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {session.courseCode}
            </CardTitle>
            <CardDescription className="text-sm">
              {session.courseName}
            </CardDescription>
          </div>
          <Badge
            variant={getStatusBadgeVariant(session.status)}
            className="text-xs"
          >
            {session.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Lecturer</p>
            <p className="font-medium">{session.lecturerName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Venue</p>
            <p className="font-medium">{session.venue}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Department</p>
            <p className="font-medium">{session.department}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Faculty</p>
            <p className="font-medium">{session.faculty}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {new Date(session.examDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {session._count?.attendances || 0} students
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground font-mono">
            {session.batchQrCode}
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => navigate(`/dashboard/exam-sessions/${session.id}`)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="View Details"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              onClick={() => handleShowQRCode(session)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="View QR Code"
            >
              <QrCode className="h-3 w-3" />
            </Button>
            {(isAdmin || user?.id === session.createdById) && (
              <>
                <Button
                  onClick={() => openStatusModal(session)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Update Status"
                >
                  <Calendar className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => openEditModal(session)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => openDeleteModal(session)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Delete"
                  disabled={Boolean(
                    session._count?.attendances &&
                      session._count.attendances > 0
                  )}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Exam Sessions</CardTitle>
              <CardDescription>
                Manage exam sessions and batch QR codes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex border rounded-md">
                <Button
                  onClick={() => setViewMode("list")}
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode("card")}
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleExportCSV} variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleDownloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              {canCreate && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search course or lecturer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter || undefined}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
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
              onValueChange={(value) => {
                setDepartmentFilter(value);
                setPage(1);
              }}
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
            <Select
              value={facultyFilter || undefined}
              onValueChange={(value) => {
                setFacultyFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Faculties" />
              </SelectTrigger>
              <SelectContent>
                {facultiesData?.faculties.map((faculty) => (
                  <SelectItem key={faculty} value={faculty}>
                    {faculty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFromFilter}
              onChange={(e) => {
                setDateFromFilter(e.target.value);
                setPage(1);
              }}
              placeholder="From Date"
            />
            <Input
              type="date"
              value={dateToFilter}
              onChange={(e) => {
                setDateToFilter(e.target.value);
                setPage(1);
              }}
              placeholder="To Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content - List or Card View */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading exam sessions...
            </div>
          ) : (
            <>
              {viewMode === "list" ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch QR Code</TableHead>
                        <TableHead>Course Code</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Exam Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionsData?.examSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-xs">
                            {session.batchQrCode}
                          </TableCell>
                          <TableCell className="font-medium">
                            {session.courseCode}
                          </TableCell>
                          <TableCell>{session.courseName}</TableCell>
                          <TableCell>{session.venue}</TableCell>
                          <TableCell>
                            {new Date(session.examDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(session.status)}
                            >
                              {session.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session._count?.attendances || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/exam-sessions/${session.id}`
                                  )
                                }
                                variant="ghost"
                                size="icon"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                onClick={() => handleShowQRCode(session)}
                                variant="ghost"
                                size="icon"
                                title="View QR Code"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              {(isAdmin ||
                                user?.id === session.createdById) && (
                                <>
                                  <Button
                                    onClick={() => openStatusModal(session)}
                                    variant="ghost"
                                    size="icon"
                                    title="Update Status"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => openEditModal(session)}
                                    variant="ghost"
                                    size="icon"
                                    title="Edit"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => openDeleteModal(session)}
                                    variant="ghost"
                                    size="icon"
                                    title={
                                      session._count?.attendances &&
                                      session._count.attendances > 0
                                        ? `Cannot delete: ${session._count.attendances} attendance record(s) exist`
                                        : "Delete"
                                    }
                                    disabled={Boolean(
                                      session._count?.attendances &&
                                        session._count.attendances > 0
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Empty State for List View */}
                  {(!sessionsData?.examSessions ||
                    sessionsData.examSessions.length === 0) && (
                    <div className="p-12 text-center">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                        No exam sessions found
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        {search ||
                        statusFilter ||
                        departmentFilter ||
                        facultyFilter ||
                        dateFromFilter ||
                        dateToFilter
                          ? "No exam sessions match your current filters. Try adjusting your search criteria."
                          : "Get started by creating your first exam session to manage batch QR codes and track attendance."}
                      </p>
                      {canCreate &&
                        !search &&
                        !statusFilter &&
                        !departmentFilter &&
                        !facultyFilter &&
                        !dateFromFilter &&
                        !dateToFilter && (
                          <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Session
                          </Button>
                        )}
                    </div>
                  )}

                  {/* Pagination for List View */}
                  {sessionsData && sessionsData.pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to{" "}
                        {Math.min(page * limit, sessionsData.pagination.total)}{" "}
                        of {sessionsData.pagination.total} sessions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm">
                          Page {page} of {sessionsData.pagination.pages}
                        </span>
                        <Button
                          onClick={() => setPage(page + 1)}
                          disabled={page === sessionsData.pagination.pages}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Card View */}
                  <div className="p-6">
                    {!sessionsData?.examSessions ||
                    sessionsData.examSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                          No exam sessions found
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                          {search ||
                          statusFilter ||
                          departmentFilter ||
                          facultyFilter ||
                          dateFromFilter ||
                          dateToFilter
                            ? "No exam sessions match your current filters. Try adjusting your search criteria."
                            : "Get started by creating your first exam session to manage batch QR codes and track attendance."}
                        </p>
                        {canCreate &&
                          !search &&
                          !statusFilter &&
                          !departmentFilter &&
                          !facultyFilter &&
                          !dateFromFilter &&
                          !dateToFilter && (
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Your First Session
                            </Button>
                          )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {sessionsData.examSessions.map((session) => (
                          <ExamSessionCard key={session.id} session={session} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pagination for Card View */}
                  {sessionsData && sessionsData.pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to{" "}
                        {Math.min(page * limit, sessionsData.pagination.total)}{" "}
                        of {sessionsData.pagination.total} sessions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm">
                          Page {page} of {sessionsData.pagination.pages}
                        </span>
                        <Button
                          onClick={() => setPage(page + 1)}
                          disabled={page === sessionsData.pagination.pages}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Exam Session" : "Create Exam Session"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? "Update exam session information below."
                : "Fill in the details to create a new exam session."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseCode">Course Code</Label>
                <Input
                  id="courseCode"
                  value={formData.courseCode}
                  onChange={(e) =>
                    setFormData({ ...formData, courseCode: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData({ ...formData, courseName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="lecturer">
                  Select Registered Lecturer (Optional)
                </Label>
                <Select
                  value={formData.lecturerId || undefined}
                  onValueChange={(value) => {
                    const selectedLecturer = lecturersData?.users.find(
                      (l) => l.id === value
                    );
                    if (selectedLecturer) {
                      setFormData({
                        ...formData,
                        lecturerId: selectedLecturer.id,
                        lecturerName: selectedLecturer.name || "",
                      });
                    }
                  }}
                >
                  <SelectTrigger id="lecturer">
                    <SelectValue placeholder="-- Or enter manually below --" />
                  </SelectTrigger>
                  <SelectContent>
                    {lecturersData?.users.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>
                        {lecturer.name} ({lecturer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-center text-xs text-muted-foreground font-medium">
                OR
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lecturerName">Lecturer Name</Label>
                  <Input
                    id="lecturerName"
                    value={formData.lecturerName}
                    onChange={(e) =>
                      setFormData({ ...formData, lecturerName: e.target.value })
                    }
                    placeholder="Manual entry"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lecturerId">Lecturer ID</Label>
                  <Input
                    id="lecturerId"
                    value={formData.lecturerId}
                    onChange={(e) =>
                      setFormData({ ...formData, lecturerId: e.target.value })
                    }
                    placeholder="Manual entry"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Input
                  id="faculty"
                  value={formData.faculty}
                  onChange={(e) =>
                    setFormData({ ...formData, faculty: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam Date & Time</Label>
                <DateTimePicker
                  date={formData.examDate}
                  onDateChange={(date) =>
                    setFormData({ ...formData, examDate: date })
                  }
                  placeholder="Select exam date and time"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditModalOpen ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              {selectedSession?.courseCode} - {selectedSession?.courseName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as BatchStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Exam Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedSession?.courseCode} -{" "}
              {selectedSession?.courseName}? This action cannot be undone and
              will permanently remove the exam session and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedSession && deleteMutation.mutate(selectedSession.id)
              }
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Batch QR Code</DialogTitle>
            <DialogDescription>
              {selectedSession?.batchQrCode}
              <br />
              {selectedSession?.courseCode} - {selectedSession?.courseName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeData && (
              <img
                src={qrCodeData}
                alt="Batch QR Code"
                className="w-64 h-64 border rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQRModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadQRCode}>
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
