import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  incidentsApi,
  type IncidentStatus,
  type AddCommentData,
  type UpdateStatusData,
  type IncidentAttachment,
} from "@/api/incidents";
import { usersApi } from "@/api/users";
import {
  ArrowLeft,
  FileDown,
  Upload,
  Send,
  User,
  Calendar,
  MapPin,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: "REPORTED", label: "Reported" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "ESCALATED", label: "Escalated" },
];

// Helper function to check if file is an image or video
const isImageOrVideo = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().split(".").pop();
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
  return (
    imageExtensions.includes(extension || "") ||
    videoExtensions.includes(extension || "")
  );
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "bg-error text-error-foreground border-error";
    case "HIGH":
      return "bg-warning text-warning-foreground border-warning";
    case "MEDIUM":
      return "bg-info text-info-foreground border-info";
    case "LOW":
      return "bg-success text-success-foreground border-success";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export default function IncidentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "DEPARTMENT_HEAD" ||
    user?.role === "FACULTY_OFFICER";

  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [statusFormData, setStatusFormData] = useState<UpdateStatusData>({
    status: "INVESTIGATING",
  });
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [previewAttachment, setPreviewAttachment] =
    useState<IncidentAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch incident details
  const { data: incidentData, isLoading } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => incidentsApi.getIncident(id!),
    enabled: !!id,
  });

  // Fetch comments
  const { data: commentsData } = useQuery({
    queryKey: ["incident-comments", id],
    queryFn: () => incidentsApi.getComments(id!),
    enabled: !!id,
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

  const incident = incidentData?.incident;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data: AddCommentData) => incidentsApi.addComment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-comments", id] });
      setComment("");
      setIsInternal(false);
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateStatusData) =>
      incidentsApi.updateStatus(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setIsStatusModalOpen(false);
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  // Assign incident mutation
  const assignMutation = useMutation({
    mutationFn: () =>
      incidentsApi.assignIncident(id!, { assigneeId: selectedAssignee }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      setIsAssignModalOpen(false);
      toast.success("Incident assigned");
    },
    onError: () => {
      toast.error("Failed to assign incident");
    },
  });

  // Upload attachments mutation
  const uploadMutation = useMutation({
    mutationFn: (files: FileList) => incidentsApi.uploadAttachments(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      toast.success("Attachments uploaded");
    },
    onError: () => {
      toast.error("Failed to upload attachments");
    },
  });

  // Export PDF mutation
  const exportPDFMutation = useMutation({
    mutationFn: () => incidentsApi.exportPDF(id!),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incident-${incident?.incidentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF exported");
    },
    onError: () => {
      toast.error("Failed to export PDF");
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addCommentMutation.mutate({ comment, isInternal });
  };

  const handleUpdateStatus = () => {
    updateStatusMutation.mutate(statusFormData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      uploadMutation.mutate(files);
      e.target.value = "";
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading incident details...</div>;
  }

  if (!incident) {
    return <div className="p-8">Incident not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/incidents")}
                className="shrink-0"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                    {incident.incidentNumber}
                  </h1>
                  {incident.isConfidential && (
                    <Badge variant="destructive" className="shrink-0">
                      Confidential
                    </Badge>
                  )}
                  {incident.autoCreated && (
                    <Badge variant="outline" className="shrink-0">
                      Auto-Created
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm sm:text-base mt-1 truncate">
                  {incident.title}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => exportPDFMutation.mutate()}
                disabled={exportPDFMutation.isPending}
                className="shrink-0"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="shrink-0"
                  >
                    <User className="mr-2 h-4 w-4" />
                    {incident.assignee ? "Reassign" : "Assign"}
                  </Button>
                  <Button
                    onClick={() => setIsStatusModalOpen(true)}
                    className="shrink-0"
                  >
                    Update Status
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Incident Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Incident Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type and Severity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="font-medium">
                        {incident.type.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Severity</Label>
                      <Badge
                        className={getSeverityColor(incident.severity)}
                        variant="outline"
                      >
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 whitespace-pre-wrap text-sm sm:text-base">
                      {incident.description}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Incident Date
                      </Label>
                      <p className="text-sm">
                        {new Date(incident.incidentDate).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Last Updated
                      </Label>
                      <p className="text-sm">
                        {new Date(incident.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {incident.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Label className="text-muted-foreground">
                          Location
                        </Label>
                        <p className="wrap-break-word">{incident.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Resolution Notes */}
                  {incident.resolutionNotes && (
                    <div className="rounded-md bg-success/10 p-4 border border-success/20">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-success shrink-0" />
                        <div className="min-w-0 flex-1">
                          <Label className="text-success">Resolution</Label>
                          <p className="mt-1 text-sm wrap-break-word">
                            {incident.resolutionNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Related Information */}
              {(incident.student || incident.examSession) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Related Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {incident.student && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Student</Label>
                        <p className="font-medium wrap-break-words">
                          {incident.student.firstName}{" "}
                          {incident.student.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground wrap-break-words">
                          {incident.student.indexNumber} •{" "}
                          {incident.student.program} • Level{" "}
                          {incident.student.level}
                        </p>
                      </div>
                    )}
                    {incident.examSession && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">
                          Exam Session
                        </Label>
                        <p className="font-medium wrap-break-words">
                          {incident.examSession.courseCode} -{" "}
                          {incident.examSession.courseName}
                        </p>
                        <p className="text-sm text-muted-foreground wrap-break-words">
                          Batch: {incident.examSession.batchQrCode}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Attachments */}
              {incident.attachments && incident.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-lg sm:text-xl">
                        Attachments ({incident.attachments.length})
                      </CardTitle>
                      <Label
                        htmlFor="upload-files"
                        className="self-start sm:self-auto"
                      >
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Add Files
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="upload-files"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {incident.attachments.map((attachment) => {
                        const isPreviewable = isImageOrVideo(
                          attachment.fileName
                        );
                        const fileUrl = `http://192.168.43.153:5000/${attachment.filePath}`;

                        return (
                          <div
                            key={attachment.id}
                            className="flex flex-col gap-3 p-3 border rounded-md sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {isPreviewable ? (
                                <div
                                  className="h-8 w-8 bg-muted rounded cursor-pointer overflow-hidden shrink-0"
                                  onClick={() => {
                                    setPreviewAttachment(attachment);
                                    setIsPreviewOpen(true);
                                  }}
                                >
                                  <img
                                    src={fileUrl}
                                    alt={attachment.fileName}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      // Fallback to file icon if image fails to load
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.parentElement!.innerHTML =
                                        '<svg class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>';
                                    }}
                                  />
                                </div>
                              ) : (
                                <FileDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`font-medium text-sm truncate ${
                                    isPreviewable
                                      ? "cursor-pointer hover:text-primary"
                                      : ""
                                  }`}
                                  onClick={
                                    isPreviewable
                                      ? () => {
                                          setPreviewAttachment(attachment);
                                          setIsPreviewOpen(true);
                                        }
                                      : undefined
                                  }
                                >
                                  {attachment.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {attachment.fileSize
                                    ? `${(attachment.fileSize / 1024).toFixed(
                                        1
                                      )} KB`
                                    : "Unknown size"}{" "}
                                  • Uploaded by {attachment.uploader?.firstName}{" "}
                                  {attachment.uploader?.lastName} •
                                  {new Date(
                                    attachment.uploadedAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Create download link
                                const link = document.createElement("a");
                                link.href = fileUrl;
                                link.download = attachment.fileName;
                                link.target = "_blank";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="shrink-0 self-end sm:self-auto"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments & Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Comment List */}
                  {commentsData && commentsData.comments.length > 0 && (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {commentsData.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`rounded-md border p-3 ${
                            comment.isInternal
                              ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm">
                                {comment.user.firstName} {comment.user.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({comment.user.role})
                              </span>
                              {comment.isInternal && (
                                <Badge variant="outline" className="text-xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-2 text-sm whitespace-pre-wrap wrap-break-words">
                            {comment.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <Separator />
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="internal"
                          checked={isInternal}
                          onCheckedChange={(checked) =>
                            setIsInternal(checked as boolean)
                          }
                        />
                        <Label
                          htmlFor="internal"
                          className="text-sm cursor-pointer"
                        >
                          Internal note (staff only)
                        </Label>
                      </div>
                      <Button
                        type="submit"
                        disabled={
                          !comment.trim() || addCommentMutation.isPending
                        }
                        className="shrink-0"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {addCommentMutation.isPending
                          ? "Posting..."
                          : "Post Comment"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:col-span-1">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="text-muted-foreground">
                      Current Status
                    </Label>
                    <Badge
                      variant={
                        incident.status === "RESOLVED" ||
                        incident.status === "CLOSED"
                          ? "secondary"
                          : incident.status === "ESCALATED"
                          ? "destructive"
                          : "default"
                      }
                      className="self-start sm:self-auto"
                    >
                      {incident.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* People */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">People</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Reported By</Label>
                    <p className="text-sm font-medium wrap-break-words">
                      {incident.reporter?.firstName}{" "}
                      {incident.reporter?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground wrap-break-words">
                      {incident.reporter?.email}
                    </p>
                  </div>
                  {incident.assignee ? (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Assigned To
                      </Label>
                      <p className="text-sm font-medium wrap-break-words">
                        {incident.assignee.firstName}{" "}
                        {incident.assignee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground wrap-break-words">
                        {incident.assignee.role}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md bg-muted p-3 text-center">
                      <p className="text-sm text-muted-foreground">
                        Unassigned
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Label className="text-muted-foreground">Reported</Label>
                      <p className="text-sm wrap-break-words">
                        {new Date(incident.reportedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {incident.assignedAt && (
                    <div className="flex items-start gap-3">
                      <User className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Label className="text-muted-foreground">
                          Assigned
                        </Label>
                        <p className="text-sm wrap-break-words">
                          {new Date(incident.assignedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {incident.resolvedAt && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-success shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Label className="text-success">Resolved</Label>
                        <p className="text-sm wrap-break-words">
                          {new Date(incident.resolvedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {incident.statusHistory &&
                    incident.statusHistory.length > 1 && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground mb-2 block">
                          Status Changes
                        </Label>
                        <div className="space-y-2">
                          {incident.statusHistory.slice(1).map((history) => (
                            <div
                              key={history.id}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 shrink-0" />
                              <div>
                                <p>
                                  Changed to{" "}
                                  <Badge variant="outline" className="text-xs">
                                    {history.toStatus}
                                  </Badge>
                                  {history.fromStatus && (
                                    <span>
                                      {" "}
                                      from{" "}
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {history.fromStatus}
                                      </Badge>
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {history.reason && `${history.reason} • `}
                                  {new Date(
                                    history.changedAt
                                  ).toLocaleString()}{" "}
                                  by {history.user.firstName}{" "}
                                  {history.user.lastName}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Update Status Modal */}
        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Incident Status</DialogTitle>
              <DialogDescription>
                Change the status of this incident
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  value={statusFormData.status}
                  onValueChange={(value: IncidentStatus) =>
                    setStatusFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea
                  placeholder="Explain the status change..."
                  value={statusFormData.reason || ""}
                  onChange={(e) =>
                    setStatusFormData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              {(statusFormData.status === "RESOLVED" ||
                statusFormData.status === "CLOSED") && (
                <div className="space-y-2">
                  <Label>Resolution Notes</Label>
                  <Textarea
                    placeholder="Describe how this was resolved..."
                    value={statusFormData.resolutionNotes || ""}
                    onChange={(e) =>
                      setStatusFormData((prev) => ({
                        ...prev,
                        resolutionNotes: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending}
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Modal */}
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Incident</DialogTitle>
              <DialogDescription>
                Assign this incident to a staff member for investigation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={selectedAssignee}
                  onValueChange={setSelectedAssignee}
                >
                  <SelectTrigger>
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
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => assignMutation.mutate()}
                disabled={!selectedAssignee || assignMutation.isPending}
              >
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewAttachment?.fileName}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center min-h-[400px]">
              {previewAttachment &&
                (() => {
                  const fileName = previewAttachment.fileName.toLowerCase();
                  const fileUrl = `http://192.168.43.153:5000/${previewAttachment.filePath}`;

                  if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)) {
                    return (
                      <img
                        src={fileUrl}
                        alt={previewAttachment.fileName}
                        className="max-w-full max-h-full object-contain"
                        onError={() => {
                          toast.error("Failed to load image");
                          setIsPreviewOpen(false);
                        }}
                      />
                    );
                  } else if (
                    fileName.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)
                  ) {
                    return (
                      <video
                        src={fileUrl}
                        controls
                        className="max-w-full max-h-full"
                        onError={() => {
                          toast.error("Failed to load video");
                          setIsPreviewOpen(false);
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    );
                  }
                  return null;
                })()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
