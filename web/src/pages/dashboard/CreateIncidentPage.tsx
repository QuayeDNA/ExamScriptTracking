import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  incidentsApi,
  type CreateIncidentData,
  type IncidentType,
  type IncidentSeverity,
} from "@/api/incidents";
import { examSessionsApi } from "@/api/examSessions";
import { studentsApi } from "@/api/students";
import { usersApi } from "@/api/users";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const INCIDENT_TYPES: {
  value: IncidentType;
  label: string;
  description: string;
}[] = [
  {
    value: "MALPRACTICE",
    label: "Malpractice",
    description: "Suspected cheating or exam violation",
  },
  {
    value: "HEALTH_ISSUE",
    label: "Health Issue",
    description: "Student became ill during examination",
  },
  {
    value: "EXAM_DAMAGE",
    label: "Exam Damage",
    description: "Examination materials are damaged or compromised",
  },
  {
    value: "EQUIPMENT_FAILURE",
    label: "Equipment Failure",
    description: "Technical issues with exam equipment or systems",
  },
  {
    value: "DISRUPTION",
    label: "Disruption",
    description: "External disturbances affecting the examination",
  },
  {
    value: "SECURITY_BREACH",
    label: "Security Breach",
    description: "Compromised exam security or unauthorized access",
  },
  {
    value: "PROCEDURAL_VIOLATION",
    label: "Procedural Violation",
    description: "Failure to follow examination procedures",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Other incident types not covered above",
  },
];

const SEVERITY_LEVELS: {
  value: IncidentSeverity;
  label: string;
  description: string;
}[] = [
  {
    value: "LOW",
    label: "Low",
    description: "Minor issue, minimal impact",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Moderate issue, requires attention",
  },
  {
    value: "HIGH",
    label: "High",
    description: "Serious issue, urgent attention needed",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    description: "Severe issue, immediate action required",
  },
];

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateIncidentData>({
    type: "OTHER",
    severity: "MEDIUM",
    title: "",
    description: "",
    location: "",
    isConfidential: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [searchStudent, setSearchStudent] = useState("");
  const [searchExam, setSearchExam] = useState("");

  // Fetch students for dropdown
  const { data: studentsData } = useQuery({
    queryKey: ["students", searchStudent],
    queryFn: () =>
      studentsApi.getStudents({
        search: searchStudent || undefined,
        limit: 20,
      }),
    enabled: searchStudent.length > 2,
  });

  // Fetch exam sessions for dropdown
  const { data: examsData } = useQuery({
    queryKey: ["examSessions", searchExam],
    queryFn: () =>
      examSessionsApi.getExamSessions({
        search: searchExam || undefined,
        limit: 20,
      }),
    enabled: searchExam.length > 2,
  });

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      usersApi.getUsers({
        isActive: true,
      }),
  });

  // Filter users by role
  const assignableUsers = usersData?.users.filter(
    (u) =>
      u.role === "ADMIN" ||
      u.role === "DEPARTMENT_HEAD" ||
      u.role === "FACULTY_OFFICER"
  );

  // Create incident mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      // First create the incident
      const result = await incidentsApi.createIncident(data);

      // Then upload attachments if any
      if (selectedFiles && selectedFiles.length > 0) {
        await incidentsApi.uploadAttachments(result.incident.id, selectedFiles);
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident reported successfully");
      navigate(`/dashboard/incidents/${data.incident.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to report incident");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    createMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 5) {
      toast.error("Maximum 5 files allowed");
      e.target.value = "";
      return;
    }

    // Check file sizes
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > 10 * 1024 * 1024) {
          toast.error(`File ${files[i].name} exceeds 10MB limit`);
          e.target.value = "";
          return;
        }
      }
    }

    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    if (!selectedFiles) return;

    const dt = new DataTransfer();
    for (let i = 0; i < selectedFiles.length; i++) {
      if (i !== index) dt.items.add(selectedFiles[i]);
    }
    setSelectedFiles(dt.files.length > 0 ? dt.files : null);
  };

  // Auto-set confidential for MALPRACTICE
  const handleTypeChange = (value: IncidentType) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
      isConfidential: value === "MALPRACTICE" ? true : prev.isConfidential,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/incidents")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Incidents
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Incident</h1>
        <p className="text-muted-foreground">
          Create a new incident report for examination issues
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
                <CardDescription>
                  Provide information about the incident
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type and Severity on same line */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Incident Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: IncidentType) =>
                        handleTypeChange(value)
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCIDENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-2">
                    <Label htmlFor="severity">
                      Severity Level <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value: IncidentSeverity) =>
                        setFormData((prev) => ({ ...prev, severity: value }))
                      }
                    >
                      <SelectTrigger id="severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_LEVELS.map((severity) => (
                          <SelectItem
                            key={severity.value}
                            value={severity.value}
                          >
                            <div>
                              <div className="font-medium">
                                {severity.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {severity.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of the incident"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of what happened..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters required
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location/Venue</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Great Hall, Lab 3"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Incident Date */}
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Incident Date & Time</Label>
                  <Input
                    id="incidentDate"
                    type="datetime-local"
                    value={formData.incidentDate || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        incidentDate: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Confidential */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confidential"
                    checked={formData.isConfidential}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isConfidential: checked as boolean,
                      }))
                    }
                    disabled={formData.type === "MALPRACTICE"}
                  />
                  <Label
                    htmlFor="confidential"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Mark as confidential (restricted access)
                    {formData.type === "MALPRACTICE" && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Auto-enabled for malpractice)
                      </span>
                    )}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Upload photos, videos, or documents (max 5 files, 10MB each)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="files">Files</Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported: Images (JPG, PNG, GIF, WebP), Videos (MP4, MOV,
                    AVI, WebM), PDFs
                  </p>
                </div>

                {/* File List */}
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Related Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Related Information</CardTitle>
                <CardDescription>
                  Link to student or exam session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student */}
                <div className="space-y-2">
                  <Label htmlFor="student">Student (Optional)</Label>
                  <Input
                    id="student"
                    placeholder="Search by name or index..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                  />
                  {studentsData && studentsData.students.length > 0 && (
                    <Select
                      value={formData.studentId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, studentId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsData.students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} (
                            {student.indexNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Exam Session */}
                <div className="space-y-2">
                  <Label htmlFor="exam">Exam Session (Optional)</Label>
                  <Input
                    id="exam"
                    placeholder="Search by course or batch..."
                    value={searchExam}
                    onChange={(e) => setSearchExam(e.target.value)}
                  />
                  {examsData && examsData.examSessions.length > 0 && (
                    <Select
                      value={formData.examSessionId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          examSessionId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam session" />
                      </SelectTrigger>
                      <SelectContent>
                        {examsData.examSessions.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.courseCode} - {exam.batchQrCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To (Optional)</Label>
                  <Select
                    value={formData.assigneeId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, assigneeId: value }))
                    }
                  >
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/incidents")}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Reporting..." : "Report Incident"}
          </Button>
        </div>
      </form>
    </div>
  );
}
