import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  incidentsApi,
  type IncidentStatus,
  type AddCommentData,
  type UpdateStatusData,
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "text-red-600 bg-red-50 dark:bg-red-950";
    case "HIGH":
      return "text-orange-600 bg-orange-50 dark:bg-orange-950";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
    case "LOW":
      return "text-blue-600 bg-blue-50 dark:bg-blue-950";
    default:
      return "";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/incidents")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {incident.incidentNumber}
              </h1>
              {incident.isConfidential && (
                <Badge variant="destructive">Confidential</Badge>
              )}
              {incident.autoCreated && (
                <Badge variant="outline">Auto-Created</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{incident.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportPDFMutation.mutate()}
            disabled={exportPDFMutation.isPending}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsAssignModalOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                {incident.assignee ? "Reassign" : "Assign"}
              </Button>
              <Button onClick={() => setIsStatusModalOpen(true)}>
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
              <div className="grid grid-cols-2 gap-4">
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
                <p className="mt-1 whitespace-pre-wrap">
                  {incident.description}
                </p>
              </div>

              {/* Location */}
              {incident.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p>{incident.location}</p>
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              {incident.resolutionNotes && (
                <div className="rounded-md bg-green-50 p-4 dark:bg-green-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                    <div>
                      <Label className="text-green-600">Resolution</Label>
                      <p className="mt-1 text-sm">{incident.resolutionNotes}</p>
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
                  <div>
                    <Label className="text-muted-foreground">Student</Label>
                    <p className="font-medium">
                      {incident.student.firstName} {incident.student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {incident.student.indexNumber} •{" "}
                      {incident.student.program} • Level{" "}
                      {incident.student.level}
                    </p>
                  </div>
                )}
                {incident.examSession && (
                  <div>
                    <Label className="text-muted-foreground">
                      Exam Session
                    </Label>
                    <p className="font-medium">
                      {incident.examSession.courseCode} -{" "}
                      {incident.examSession.courseName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Batch: {incident.examSession.batchQrCode}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {incident._count && incident._count.attachments > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Attachments</CardTitle>
                  <Label htmlFor="upload-files">
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
                <p className="text-sm text-muted-foreground">
                  {incident._count.attachments} file(s) attached
                </p>
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
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
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
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">
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
                />
                <div className="flex items-center justify-between">
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
                    size="sm"
                    disabled={!comment.trim() || addCommentMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Post Comment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">Current Status</Label>
                <Badge
                  variant={
                    incident.status === "RESOLVED" ||
                    incident.status === "CLOSED"
                      ? "secondary"
                      : incident.status === "ESCALATED"
                      ? "destructive"
                      : "default"
                  }
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
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Reported By</Label>
                <p className="text-sm font-medium">
                  {incident.reporter?.firstName} {incident.reporter?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {incident.reporter?.email}
                </p>
              </div>
              {incident.assignee ? (
                <div>
                  <Label className="text-muted-foreground">Assigned To</Label>
                  <p className="text-sm font-medium">
                    {incident.assignee.firstName} {incident.assignee.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {incident.assignee.role}
                  </p>
                </div>
              ) : (
                <div className="rounded-md bg-muted p-2 text-center">
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground">Reported</Label>
                  <p className="text-sm">
                    {new Date(incident.reportedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {incident.assignedAt && (
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground">Assigned</Label>
                    <p className="text-sm">
                      {new Date(incident.assignedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {incident.resolvedAt && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <div>
                    <Label className="text-muted-foreground">Resolved</Label>
                    <p className="text-sm">
                      {new Date(incident.resolvedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
    </div>
  );
}
