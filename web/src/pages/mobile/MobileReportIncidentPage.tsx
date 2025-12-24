import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  MapPin,
  Upload,
  X,
} from "lucide-react";
import {
  incidentsApi,
  type IncidentType,
  type IncidentSeverity,
  type CreateIncidentData,
} from "@/api/incidents";
import { toast } from "sonner";

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "MISSING_SCRIPT", label: "Missing Script" },
  { value: "DAMAGED_SCRIPT", label: "Damaged Script" },
  { value: "MALPRACTICE", label: "Malpractice" },
  { value: "STUDENT_ILLNESS", label: "Student Illness" },
  { value: "VENUE_ISSUE", label: "Venue Issue" },
  { value: "COUNT_DISCREPANCY", label: "Count Discrepancy" },
  { value: "LATE_SUBMISSION", label: "Late Submission" },
  { value: "OTHER", label: "Other" },
];

const INCIDENT_SEVERITIES: { value: IncidentSeverity; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const MobileReportIncidentPage = () => {
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createIncidentMutation = useMutation({
    mutationFn: (incidentData: CreateIncidentData) =>
      incidentsApi.createIncident(incidentData),
    onSuccess: () => {
      toast.success("Incident reported successfully");
      navigate("/mobile/incidents");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast.error("Failed to report incident", {
        description: message,
      });
    },
  });

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      const incidentData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as IncidentType,
        severity: formData.get("severity") as IncidentSeverity,
        venue: formData.get("venue") as string,
        // Note: File attachments would need backend support
        // attachments: attachments,
      };

      await createIncidentMutation.mutateAsync(incidentData);
    } catch (error) {
      console.error("Error submitting incident:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/mobile/incidents")}
              className="text-white hover:bg-blue-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">Report Incident</h1>
              <p className="text-blue-100 text-sm">
                Create new incident report
              </p>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSubmit(formData);
              }}
              className="space-y-6"
            >
              {/* Incident Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Incident Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      placeholder="Brief description of the incident"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      rows={4}
                      placeholder="Detailed description of what happened"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCIDENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="severity">Severity *</Label>
                    <Select name="severity" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCIDENT_SEVERITIES.map((severity) => (
                          <SelectItem
                            key={severity.value}
                            value={severity.value}
                          >
                            {severity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      name="venue"
                      required
                      placeholder="Where did this incident occur?"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Attachments (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>Choose Files</span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported: Images, PDF, Word documents
                    </p>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files:</Label>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>
                      The venue field above will be used to identify the
                      location of this incident.
                    </p>
                    <p className="mt-2">
                      If you have GPS coordinates or additional location
                      details, please include them in the description.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="pb-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || createIncidentMutation.isPending}
                >
                  {isSubmitting || createIncidentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Reporting Incident...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report Incident
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
