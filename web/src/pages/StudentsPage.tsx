import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  studentsApi,
  type Student,
  type CreateStudentData,
  type UpdateStudentData,
} from "@/api/students";
import {
  Plus,
  Search,
  Download,
  Upload,
  QrCode,
  Pencil,
  Trash2,
  FileDown,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const columnHelper = createColumnHelper<Student>();

export default function StudentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  // Filter states
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<CreateStudentData>({
    indexNumber: "",
    firstName: "",
    lastName: "",
    program: "",
    level: 100,
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>("");

  // Fetch students with filters
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students", search, programFilter, levelFilter, page, limit],
    queryFn: () =>
      studentsApi.getStudents({
        search: search || undefined,
        program: programFilter || undefined,
        level: levelFilter ? parseInt(levelFilter) : undefined,
        page,
        limit,
      }),
  });

  // Fetch filter options
  const { data: programsData } = useQuery({
    queryKey: ["programs"],
    queryFn: () => studentsApi.getPrograms(),
  });

  const { data: levelsData } = useQuery({
    queryKey: ["levels"],
    queryFn: () => studentsApi.getLevels(),
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStudentData) => studentsApi.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      alert("Student created successfully");
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create student");
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentData }) =>
      studentsApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      alert("Student updated successfully");
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update student");
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      alert("Student deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to delete student");
    },
  });

  // Helper function to parse CSV properly handling quoted fields
  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error(
        "CSV file must contain headers and at least one data row"
      );
    }

    // Parse CSV line handling quoted fields
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);

      // Skip empty rows
      if (values.every((v) => !v)) continue;

      const indexNumber = values[headers.indexOf("indexnumber")] || "";
      const firstName = values[headers.indexOf("firstname")] || "";
      const lastName = values[headers.indexOf("lastname")] || "";
      const program = values[headers.indexOf("program")] || "";
      const levelStr = values[headers.indexOf("level")] || "";

      // Validate required fields
      if (!indexNumber || !firstName || !lastName || !program || !levelStr) {
        throw new Error(
          `Row ${i}: Missing required fields. Found: indexNumber="${indexNumber}", firstName="${firstName}", lastName="${lastName}", program="${program}", level="${levelStr}"`
        );
      }

      const level = parseInt(levelStr);
      if (isNaN(level)) {
        throw new Error(
          `Row ${i}: Level must be a valid number, got "${levelStr}"`
        );
      }

      students.push({
        indexNumber,
        firstName,
        lastName,
        program,
        level,
      });
    }

    return students;
  };

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const students = parseCSV(text);
      return studentsApi.bulkCreateStudents(students);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      alert(
        `Successfully imported ${data.success.length} students. ${data.failed.length} failed.`
      );
      setIsBulkImportModalOpen(false);
      setCsvFile(null);
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to import students");
    },
  });

  // Get QR code
  const handleShowQRCode = async (student: Student) => {
    try {
      const data = await studentsApi.getQRCode(student.id);
      setQrCodeData(data.qrCode);
      setSelectedStudent(student);
      setIsQRModalOpen(true);
    } catch (error) {
      alert((error as Error).message || "Failed to fetch QR code");
    }
  };

  // Download QR code
  const handleDownloadQRCode = () => {
    if (!qrCodeData || !selectedStudent) return;

    const link = document.createElement("a");
    link.href = qrCodeData;
    link.download = `${selectedStudent.indexNumber}_QR.png`;
    link.click();
  };

  // Export students to CSV
  const handleExportCSV = () => {
    if (!studentsData?.students.length) return;

    const headers = [
      "Index Number",
      "First Name",
      "Last Name",
      "Program",
      "Level",
    ];
    const rows = studentsData.students.map((s) => [
      s.indexNumber,
      s.firstName,
      s.lastName,
      s.program,
      s.level,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      indexNumber: "",
      firstName: "",
      lastName: "",
      program: "",
      level: 100,
    });
    setSelectedStudent(null);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      indexNumber: student.indexNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      program: student.program,
      level: student.level,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditModalOpen && selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleBulkImport = () => {
    if (csvFile) {
      bulkImportMutation.mutate(csvFile);
    }
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      "indexNumber",
      "firstName",
      "lastName",
      "program",
      "level",
    ];
    const exampleRows = [
      ["2024001", "John", "Doe", "Computer Science", "100"],
      ["2024002", "Jane", "Smith", "Engineering", "200"],
      ["2024003", "Mike", "Johnson", "Business", "300"],
    ];

    const csv = [headers, ...exampleRows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Table columns
  const columns = [
    columnHelper.accessor("indexNumber", {
      header: "Index Number",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("firstName", {
      header: "First Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("lastName", {
      header: "Last Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("program", {
      header: "Program",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("level", {
      header: "Level",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleShowQRCode(row.original)}
            className="p-1 hover:bg-gray-100 rounded"
            title="View QR Code"
          >
            <QrCode className="h-4 w-4" />
          </button>
          {isAdmin && (
            <>
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
    data: studentsData?.students || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-gray-500 mt-1">
            Manage student records and QR codes
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
          {isAdmin && (
            <>
              <button
                onClick={() => setIsBulkImportModalOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Import
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by index number or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            {programsData?.programs.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            {levelsData?.levels.map((level) => (
              <option key={level} value={level.toString()}>
                Level {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading students...</div>
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
            {studentsData && studentsData.pagination.pages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, studentsData.pagination.total)} of{" "}
                  {studentsData.pagination.total} students
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
                    Page {page} of {studentsData.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === studentsData.pagination.pages}
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

      {/* Create/Edit Student Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditModalOpen ? "Edit Student" : "Add New Student"}
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Index Number
                </label>
                <input
                  type="text"
                  value={formData.indexNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, indexNumber: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Program
                </label>
                <input
                  type="text"
                  value={formData.program}
                  onChange={(e) =>
                    setFormData({ ...formData, program: e.target.value })
                  }
                  required
                  placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <select
                  value={formData.level.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="100">Level 100</option>
                  <option value="200">Level 200</option>
                  <option value="300">Level 300</option>
                  <option value="400">Level 400</option>
                </select>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Student</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedStudent?.firstName}{" "}
              {selectedStudent?.lastName}? This action cannot be undone.
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
                  selectedStudent && deleteMutation.mutate(selectedStudent.id)
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

      {/* Bulk Import Modal */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Bulk Import Students</h2>
              <button
                onClick={() => {
                  setIsBulkImportModalOpen(false);
                  setCsvFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Upload a CSV file with columns: indexNumber, firstName,
                lastName, program, level
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-700 underline mb-2"
              >
                Download CSV Template
              </button>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="w-full mb-4 text-sm"
            />
            <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded">
              <strong>CSV Format Requirements:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>First row must contain headers (case-insensitive)</li>
                <li>
                  Required columns: indexNumber, firstName, lastName, program,
                  level
                </li>
                <li>Level must be a number (100, 200, 300, or 400)</li>
                <li>Empty rows will be skipped</li>
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsBulkImportModalOpen(false);
                  setCsvFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!csvFile || bulkImportMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Import
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
              <h2 className="text-xl font-bold">Student QR Code</h2>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedStudent?.indexNumber} - {selectedStudent?.firstName}{" "}
              {selectedStudent?.lastName}
            </p>
            <div className="flex flex-col items-center mb-4">
              {qrCodeData && (
                <img
                  src={qrCodeData}
                  alt="Student QR Code"
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
