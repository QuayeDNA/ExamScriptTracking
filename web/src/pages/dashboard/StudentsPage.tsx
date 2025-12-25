import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  AlertTriangle,
  Grid3X3,
  List,
  User,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuthStore } from "@/store/auth";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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
      toast.success("Student created successfully");
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create student");
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentData }) =>
      studentsApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated successfully");
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update student");
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete student");
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
      toast.success(
        `Successfully imported ${data.success.length} students. ${data.failed.length} failed.`
      );
      setIsBulkImportModalOpen(false);
      setCsvFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import students");
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
      toast.error((error as Error).message || "Failed to fetch QR code");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Manage student records and QR codes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  onClick={() => setViewMode("table")}
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode("cards")}
                  variant={viewMode === "cards" ? "default" : "ghost"}
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
              {isAdmin && (
                <>
                  <Button
                    onClick={() => setIsBulkImportModalOpen(true)}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by index number or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="space-y-1">
              <Select
                value={programFilter || undefined}
                onValueChange={(value) => {
                  setProgramFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  {programsData?.programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {programFilter && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setProgramFilter("");
                    setPage(1);
                  }}
                  className="h-auto p-0 text-xs"
                >
                  Clear filter
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <Select
                value={levelFilter || undefined}
                onValueChange={(value) => {
                  setLevelFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  {levelsData?.levels.map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {levelFilter && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setLevelFilter("");
                    setPage(1);
                  }}
                  className="h-auto p-0 text-xs"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Display */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading students...
            </div>
          ) : viewMode === "table" ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Index Number</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData?.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.indexNumber}
                      </TableCell>
                      <TableCell>{student.firstName}</TableCell>
                      <TableCell>{student.lastName}</TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>{student.level}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleShowQRCode(student)}
                            variant="ghost"
                            size="icon"
                            title="View QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                onClick={() => openEditModal(student)}
                                variant="ghost"
                                size="icon"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => openDeleteModal(student)}
                                variant="ghost"
                                size="icon"
                                title="Delete"
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

              {/* Pagination */}
              {studentsData && studentsData.pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, studentsData.pagination.total)} of{" "}
                    {studentsData.pagination.total} students
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
                      Page {page} of {studentsData.pagination.pages}
                    </span>
                    <Button
                      onClick={() => setPage(page + 1)}
                      disabled={page === studentsData.pagination.pages}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {studentsData?.students.map((student) => (
                    <Card
                      key={student.id}
                      className="overflow-hidden border-border bg-card"
                    >
                      <CardContent className="p-0">
                        {/* Placeholder Image Section */}
                        <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border-b border-border">
                          <User className="h-16 w-16 text-primary" />
                        </div>

                        {/* Student Info */}
                        <div className="p-4 space-y-2 bg-card">
                          <div className="text-center">
                            <h3 className="font-semibold text-lg text-foreground">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {student.indexNumber}
                            </p>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Program:
                              </span>
                              <span className="font-medium text-foreground">
                                {student.program}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Level:
                              </span>
                              <span className="font-medium text-foreground">
                                {student.level}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="p-4 border-t border-border bg-muted/30">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="bg-background p-3 rounded-md border-2 border-border shadow-sm">
                              <QRCodeSVG
                                value={student.indexNumber}
                                size={120}
                                level="H"
                                includeMargin={true}
                                fgColor="var(--foreground)"
                                bgColor="var(--background)"
                              />
                            </div>
                            <Button
                              onClick={() => handleShowQRCode(student)}
                              variant="outline"
                              size="sm"
                              className="w-full border-border hover:bg-accent hover:text-accent-foreground"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              View Large QR
                            </Button>
                          </div>
                        </div>

                        {/* Actions */}
                        {isAdmin && (
                          <div className="p-4 border-t border-border bg-muted/30">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openEditModal(student)}
                                variant="outline"
                                size="sm"
                                className="flex-1 border-border hover:bg-accent hover:text-accent-foreground"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => openDeleteModal(student)}
                                variant="outline"
                                size="sm"
                                className="flex-1 border-border hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination for Card View */}
                {studentsData && studentsData.pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, studentsData.pagination.total)} of{" "}
                      {studentsData.pagination.total} students
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
                        Page {page} of {studentsData.pagination.pages}
                      </span>
                      <Button
                        onClick={() => setPage(page + 1)}
                        disabled={page === studentsData.pagination.pages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Student Modal */}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Student" : "Add New Student"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? "Update student information below."
                : "Fill in the details to create a new student record."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indexNumber">Index Number</Label>
              <Input
                id="indexNumber"
                type="text"
                value={formData.indexNumber}
                onChange={(e) =>
                  setFormData({ ...formData, indexNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Input
                id="program"
                type="text"
                value={formData.program}
                onChange={(e) =>
                  setFormData({ ...formData, program: e.target.value })
                }
                required
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.level.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    level: parseInt(value),
                  })
                }
              >
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">Level 100</SelectItem>
                  <SelectItem value="200">Level 200</SelectItem>
                  <SelectItem value="300">Level 300</SelectItem>
                  <SelectItem value="400">Level 400</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Student
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStudent?.firstName}{" "}
              {selectedStudent?.lastName}? This action cannot be undone.
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
                selectedStudent && deleteMutation.mutate(selectedStudent.id)
              }
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog
        open={isBulkImportModalOpen}
        onOpenChange={(open) => {
          setIsBulkImportModalOpen(open);
          if (!open) setCsvFile(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: indexNumber, firstName, lastName,
              program, level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Button
                type="button"
                variant="link"
                onClick={handleDownloadTemplate}
                className="h-auto p-0 text-sm"
              >
                <FileDown className="h-3 w-3 mr-1" />
                Download CSV Template
              </Button>
            </div>
            <div>
              <Label htmlFor="csvFile">CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
              <strong className="text-foreground">
                CSV Format Requirements:
              </strong>
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkImportModalOpen(false);
                setCsvFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={!csvFile || bulkImportMutation.isPending}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
            <DialogDescription>
              {selectedStudent?.indexNumber} - {selectedStudent?.firstName}{" "}
              {selectedStudent?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeData && (
              <img
                src={qrCodeData}
                alt="Student QR Code"
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
