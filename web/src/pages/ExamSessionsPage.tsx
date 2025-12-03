import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
  X,
  Calendar,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useNavigate } from "react-router-dom";

const columnHelper = createColumnHelper<ExamSession>();

const BATCH_STATUSES: { value: BatchStatus; label: string }[] = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "WITH_LECTURER", label: "With Lecturer" },
  { value: "UNDER_GRADING", label: "Under Grading" },
  { value: "GRADED", label: "Graded" },
  { value: "RETURNED", label: "Returned" },
  { value: "COMPLETED", label: "Completed" },
];

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
  const [formData, setFormData] = useState<CreateExamSessionData>({
    courseCode: "",
    courseName: "",
    lecturerId: "",
    lecturerName: "",
    department: "",
    faculty: "",
    venue: "",
    examDate: "",
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
      alert("Exam session created successfully");
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create exam session");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExamSessionData }) =>
      examSessionsApi.updateExamSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      alert("Exam session updated successfully");
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update exam session");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BatchStatus }) =>
      examSessionsApi.updateExamSessionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      alert("Status updated successfully");
      setIsStatusModalOpen(false);
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update status");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => examSessionsApi.deleteExamSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      alert("Exam session deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedSession(null);
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to delete exam session");
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
      alert((error as Error).message || "Failed to fetch QR code");
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

  const resetForm = () => {
    setFormData({
      courseCode: "",
      courseName: "",
      lecturerId: "",
      lecturerName: "",
      department: "",
      faculty: "",
      venue: "",
      examDate: "",
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
      examDate: session.examDate.split("T")[0],
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (session: ExamSession) => {
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

    // Convert datetime-local to ISO 8601 format
    const formattedData = {
      ...formData,
      examDate: new Date(formData.examDate).toISOString(),
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

  // Table columns
  const columns = [
    columnHelper.accessor("batchQrCode", {
      header: "Batch QR Code",
      cell: (info) => (
        <span className="font-mono text-xs">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("courseCode", {
      header: "Course Code",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("courseName", {
      header: "Course Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("venue", {
      header: "Venue",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("examDate", {
      header: "Exam Date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        const colors: Record<BatchStatus, string> = {
          IN_PROGRESS: "bg-blue-100 text-blue-800",
          SUBMITTED: "bg-green-100 text-green-800",
          IN_TRANSIT: "bg-yellow-100 text-yellow-800",
          WITH_LECTURER: "bg-purple-100 text-purple-800",
          UNDER_GRADING: "bg-indigo-100 text-indigo-800",
          GRADED: "bg-teal-100 text-teal-800",
          RETURNED: "bg-orange-100 text-orange-800",
          COMPLETED: "bg-gray-100 text-gray-800",
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
            {status.replace(/_/g, " ")}
          </span>
        );
      },
    }),
    columnHelper.accessor("_count.attendances", {
      header: "Students",
      cell: (info) => info.getValue() || 0,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() =>
              navigate(`/dashboard/exam-sessions/${row.original.id}`)
            }
            className="p-1 hover:bg-gray-100 rounded"
            title="View Details"
          >
            <Eye className="h-4 w-4 text-blue-500" />
          </button>
          <button
            onClick={() => handleShowQRCode(row.original)}
            className="p-1 hover:bg-gray-100 rounded"
            title="View QR Code"
          >
            <QrCode className="h-4 w-4" />
          </button>
          {(isAdmin || user?.id === row.original.createdById) && (
            <>
              <button
                onClick={() => openStatusModal(row.original)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Update Status"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEditModal(row.original)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => openDeleteModal(row.original)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: sessionsData?.examSessions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Exam Sessions</h1>
          <p className="text-gray-500 mt-1">
            Manage exam sessions and batch QR codes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </button>
          {canCreate && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Session
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search course or lecturer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {BATCH_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departmentsData?.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={facultyFilter}
            onChange={(e) => {
              setFacultyFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Faculties</option>
            {facultiesData?.faculties.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFromFilter}
            onChange={(e) => {
              setDateFromFilter(e.target.value);
              setPage(1);
            }}
            placeholder="From Date"
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={dateToFilter}
            onChange={(e) => {
              setDateToFilter(e.target.value);
              setPage(1);
            }}
            placeholder="To Date"
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading exam sessions...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sessionsData && sessionsData.pagination.pages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, sessionsData.pagination.total)} of{" "}
                  {sessionsData.pagination.total} sessions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-1 text-sm">
                    Page {page} of {sessionsData.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === sessionsData.pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditModalOpen ? "Edit Exam Session" : "Create Exam Session"}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) =>
                      setFormData({ ...formData, courseCode: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) =>
                      setFormData({ ...formData, courseName: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Registered Lecturer (Optional)
                  </label>
                  <select
                    value={formData.lecturerId}
                    onChange={(e) => {
                      const selectedLecturer = lecturersData?.users.find(
                        (l) => l.id === e.target.value
                      );
                      if (selectedLecturer) {
                        setFormData({
                          ...formData,
                          lecturerId: selectedLecturer.id,
                          lecturerName: selectedLecturer.name || "",
                        });
                      } else {
                        // Clear selection
                        setFormData({
                          ...formData,
                          lecturerId: "",
                          lecturerName: "",
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Or enter manually below --</option>
                    {lecturersData?.users.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name} ({lecturer.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-center text-xs text-gray-500 font-medium">
                  OR
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Lecturer ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lecturerId}
                      onChange={(e) =>
                        setFormData({ ...formData, lecturerId: e.target.value })
                      }
                      required
                      placeholder="e.g., LEC001 or UUID"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Lecturer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lecturerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lecturerName: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g., Dr. John Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Faculty
                  </label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) =>
                      setFormData({ ...formData, faculty: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Exam Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.examDate}
                    onChange={(e) =>
                      setFormData({ ...formData, examDate: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isEditModalOpen ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Status</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedSession?.courseCode} - {selectedSession?.courseName}
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as BatchStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              {BATCH_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Exam Session</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedSession?.courseCode} -{" "}
              {selectedSession?.courseName}? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  selectedSession && deleteMutation.mutate(selectedSession.id)
                }
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Batch QR Code</h2>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedSession?.batchQrCode}
              <br />
              {selectedSession?.courseCode} - {selectedSession?.courseName}
            </p>
            <div className="flex flex-col items-center mb-4">
              {qrCodeData && (
                <img
                  src={qrCodeData}
                  alt="Batch QR Code"
                  className="w-64 h-64"
                />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleDownloadQRCode}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
