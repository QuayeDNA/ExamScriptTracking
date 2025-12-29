/* eslint-disable react-hooks/purity */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import {
  Download,
  RefreshCw,
  Clock,
  Users,
  Plus,
  Trash2,
  BarChart3,
  Share2,
  Copy,
  Zap,
  Calendar,
  Activity,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationApi } from "@/api/registration";
import { toast } from "sonner";
import { format } from "date-fns";
import { SmartDepartmentInput } from "@/components/SmartDepartmentInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface RegistrationSession {
  id: string;
  qrToken: string;
  department: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function QRRegistrationPage() {
  const [expiresInMinutes, setExpiresInMinutes] = useState(60);
  const [department, setDepartment] = useState("");
  const [currentQR, setCurrentQR] = useState<{
    token: string;
    expiresAt: string;
    qrData: string;
  } | null>(null);

  // Bulk generation state
  const [bulkSessions, setBulkSessions] = useState<Array<{
    department: string;
    expiresInMinutes: number;
  }>>([]);

  // Management state
  const [selectedSession, setSelectedSession] = useState<RegistrationSession | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(60);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("create");

  const queryClient = useQueryClient();

  // Fetch registration sessions
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: ["registration-sessions"],
    queryFn: () => registrationApi.getSessions(),
  });

  // Create QR session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: { expiresInMinutes: number; department: string }) => 
      registrationApi.createSession(data.expiresInMinutes, data.department),
    onSuccess: (data) => {
      setCurrentQR({
        token: data.qrToken,
        expiresAt: data.expiresAt,
        qrData: JSON.stringify(data.qrCodeData),
      });
      queryClient.invalidateQueries({ queryKey: ["registration-sessions"] });
      toast.success("QR code created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create QR code");
    },
  });

  // Bulk create sessions mutation
  const bulkCreateMutation = useMutation({
    mutationFn: (sessions: Array<{ expiresInMinutes: number; department: string }>) =>
      registrationApi.bulkCreateSessions(sessions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registration-sessions"] });
      toast.success(`Created ${data.sessions.length} QR codes successfully!`);
      setBulkSessions([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create bulk QR codes");
    },
  });

  // Deactivate session mutation
  const deactivateMutation = useMutation({
    mutationFn: (sessionId: string) => registrationApi.deactivateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-sessions"] });
      toast.success("QR code deactivated successfully!");
      setSelectedSession(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to deactivate QR code");
    },
  });

  // Extend session mutation
  const extendMutation = useMutation({
    mutationFn: ({ sessionId, additionalMinutes }: { sessionId: string; additionalMinutes: number }) =>
      registrationApi.extendSession(sessionId, additionalMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-sessions"] });
      toast.success("QR code expiration extended!");
      setShowExtendDialog(false);
      setSelectedSession(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to extend QR code expiration");
    },
  });

  // Analytics query
  const { data: analytics } = useQuery({
    queryKey: ["registration-analytics"],
    queryFn: () => registrationApi.getAnalytics(),
    enabled: showAnalytics,
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: () => registrationApi.cleanupExpired(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registration-sessions"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cleanup expired sessions");
    },
  });

  const handleCreateQR = () => {
    if (expiresInMinutes < 1 || expiresInMinutes > 1440) {
      toast.error("Expiration time must be between 1 and 1440 minutes");
      return;
    }
    if (!department.trim()) {
      toast.error("Department is required");
      return;
    }
    createSessionMutation.mutate({ expiresInMinutes, department: department.trim() });
  };

  const handleDownloadQR = () => {
    if (!currentQR) return;

    const svg = document.querySelector("#qr-code svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `registration-qr-${format(
        new Date(),
        "yyyy-MM-dd-HH-mm"
      )}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleDownloadSessionQR = (session: RegistrationSession) => {
    const qrData = JSON.stringify({
      type: "REGISTRATION",
      token: session.qrToken,
      department: session.department,
      expiresAt: session.expiresAt
    });

    // Create a temporary div to render QR code
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.innerHTML = `<div id="temp-qr"></div>`;
    document.body.appendChild(tempDiv);

    // Use React to render QR code temporarily
    const tempContainer = tempDiv.querySelector("#temp-qr");
    if (tempContainer) {
      // Simple approach: copy data to clipboard for now
      navigator.clipboard.writeText(qrData).then(() => {
        toast.success("QR data copied! Use online QR generator for PNG.");
      }).catch(() => {
        toast.error("Failed to copy data");
      });
    }

    // Clean up
    document.body.removeChild(tempDiv);
  };

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt);

  // Bulk operations handlers
  const handleAddToBulk = () => {
    if (!department.trim()) {
      toast.error("Department is required");
      return;
    }
    if (bulkSessions.some(s => s.department === department.trim())) {
      toast.error("Department already added to bulk list");
      return;
    }
    setBulkSessions([...bulkSessions, { department: department.trim(), expiresInMinutes }]);
    setDepartment("");
    toast.success("Added to bulk generation list");
  };

  const handleRemoveFromBulk = (index: number) => {
    setBulkSessions(bulkSessions.filter((_, i) => i !== index));
  };

  const handleBulkCreate = () => {
    if (bulkSessions.length === 0) {
      toast.error("No sessions to create");
      return;
    }
    bulkCreateMutation.mutate(bulkSessions);
  };

  // Management handlers
  const handleDeactivateSession = (session: RegistrationSession) => {
    if (session.used) {
      toast.error("Cannot deactivate a used session");
      return;
    }
    deactivateMutation.mutate(session.id);
  };

  const handleExtendSession = () => {
    if (!selectedSession) return;
    if (extendMinutes < 1 || extendMinutes > 1440) {
      toast.error("Extension time must be between 1 and 1440 minutes");
      return;
    }
    extendMutation.mutate({ sessionId: selectedSession.id, additionalMinutes: extendMinutes });
  };

  const handleShareQR = async (qrData: string) => {
    try {
      await navigator.clipboard.writeText(qrData);
      toast.success("QR data copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy QR data:", error);
      toast.error("Failed to copy QR data");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Registration</h1>
          <p className="text-muted-foreground">
            Create and manage QR codes for fast invigilator registration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={showAnalytics ? "bg-primary text-primary-foreground" : ""}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Registration Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.active}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.used}</div>
                <div className="text-sm text-muted-foreground">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analytics.expired}</div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Department Breakdown</h4>
              {Object.entries(analytics.departments).map(([dept, stats]) => (
                <div key={dept} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{dept}</span>
                    <span>{stats.active}/{stats.total} active</span>
                  </div>
                  <Progress value={(stats.active / stats.total) * 100} className="h-2" />
                </div>
              ))}
            </div>

            {analytics.recentActivity.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{activity.department}</span>
                      <Badge variant={activity.status === 'used' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create QR</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
          <TabsTrigger value="manage">Manage Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Create Single QR Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Create Registration QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expiresIn">Expiration Time (minutes)</Label>

                  {/* Quick Presets */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpiresInMinutes(60)}
                      className={expiresInMinutes === 60 ? "bg-primary text-primary-foreground" : ""}
                    >
                      1 Hour
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpiresInMinutes(240)}
                      className={expiresInMinutes === 240 ? "bg-primary text-primary-foreground" : ""}
                    >
                      4 Hours
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpiresInMinutes(1440)}
                      className={expiresInMinutes === 1440 ? "bg-primary text-primary-foreground" : ""}
                    >
                      1 Day
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpiresInMinutes(10080)}
                      className={expiresInMinutes === 10080 ? "bg-primary text-primary-foreground" : ""}
                    >
                      1 Week
                    </Button>
                  </div>

                  <Input
                    id="expiresIn"
                    type="number"
                    min="1"
                    max="1440"
                    value={expiresInMinutes}
                    onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
                    placeholder="60"
                  />
                  <p className="text-sm text-muted-foreground">
                    QR code will expire after this many minutes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <SmartDepartmentInput
                    value={department}
                    onChange={setDepartment}
                    placeholder="Computer Science Department"
                  />
                  <p className="text-sm text-muted-foreground">
                    Users who register with this QR code will be assigned to this department
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateQR}
                    disabled={createSessionMutation.isPending}
                    className="flex-1"
                  >
                    {createSessionMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAddToBulk}
                    disabled={!department.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {currentQR && (
                  <Alert>
                    <AlertDescription>
                      QR code created successfully! Share this code with new invigilators.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* QR Display Section */}
            <Card>
              <CardHeader>
                <CardTitle>Current QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                {currentQR ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div id="qr-code" className="p-4 bg-white rounded-lg border">
                        <QRCodeSVG
                          value={currentQR.qrData}
                          size={200}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Expires: {format(new Date(currentQR.expiresAt), "PPpp")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            isExpired(currentQR.expiresAt)
                              ? "destructive"
                              : "default"
                          }
                        >
                          {isExpired(currentQR.expiresAt) ? "Expired" : "Active"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleDownloadQR}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PNG
                      </Button>
                      <Button
                        onClick={() => handleShareQR(currentQR.qrData)}
                        variant="outline"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No QR code generated yet</p>
                    <p className="text-sm">Create a QR code to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Bulk Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Bulk QR Generation
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create multiple QR codes for different departments at once
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Expiration Time (applied to all)</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpiresInMinutes(60)}
                      className={expiresInMinutes === 60 ? "bg-primary text-primary-foreground" : ""}
                    >
                      1 Hour
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpiresInMinutes(240)}
                      className={expiresInMinutes === 240 ? "bg-primary text-primary-foreground" : ""}
                    >
                      4 Hours
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpiresInMinutes(1440)}
                      className={expiresInMinutes === 1440 ? "bg-primary text-primary-foreground" : ""}
                    >
                      1 Day
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Add Department</Label>
                  <div className="flex gap-2">
                    <SmartDepartmentInput
                      value={department}
                      onChange={setDepartment}
                      placeholder="Enter department name"
                      className="flex-1"
                    />
                    <Button onClick={handleAddToBulk} disabled={!department.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Bulk List */}
                {bulkSessions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Queued for Creation ({bulkSessions.length})</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {bulkSessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{session.department}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({session.expiresInMinutes} min)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromBulk(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBulkCreate}
                  disabled={bulkCreateMutation.isPending || bulkSessions.length === 0}
                  className="w-full"
                >
                  {bulkCreateMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating {bulkSessions.length} QR codes...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Create {bulkSessions.length} QR Codes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Bulk Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {bulkSessions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{bulkSessions.length}</div>
                      <div className="text-sm text-muted-foreground">QR codes ready to create</div>
                    </div>
                    <div className="space-y-2">
                      {bulkSessions.slice(0, 3).map((session, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{session.department}</span>
                          <span className="text-muted-foreground">
                            {Math.floor(session.expiresInMinutes / 60)}h {session.expiresInMinutes % 60}m
                          </span>
                        </div>
                      ))}
                      {bulkSessions.length > 3 && (
                        <div className="text-sm text-muted-foreground text-center">
                          +{bulkSessions.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No departments added yet</p>
                    <p className="text-sm">Add departments above to create bulk QR codes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Sessions Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Registration Sessions
                </span>
                {sessions?.sessions && (
                  <div className="flex gap-2">
                    <Badge variant="default">
                      {sessions.sessions.filter(s => !s.used && !isExpired(s.expiresAt)).length} Active
                    </Badge>
                    <Badge variant="secondary">
                      {sessions.sessions.filter(s => s.used).length} Used
                    </Badge>
                    <Badge variant="destructive">
                      {sessions.sessions.filter(s => !s.used && isExpired(s.expiresAt)).length} Expired
                    </Badge>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-4">Loading sessions...</div>
              ) : sessionsError ? (
                <div className="text-center py-4 text-red-600">
                  Failed to load sessions: {sessionsError.message}
                </div>
              ) : sessions?.sessions && sessions.sessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sessions.sessions.map((session: RegistrationSession) => (
                    <Card key={session.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              session.used
                                ? "secondary"
                                : isExpired(session.expiresAt)
                                ? "destructive"
                                : "default"
                            }
                          >
                            {session.used
                              ? "Used"
                              : isExpired(session.expiresAt)
                              ? "Expired"
                              : "Active"}
                          </Badge>
                          <div className="flex gap-1">
                            {!session.used && !isExpired(session.expiresAt) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setShowExtendDialog(true);
                                  }}
                                  title="Extend expiration"
                                >
                                  <Calendar className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeactivateSession(session)}
                                  title="Deactivate"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <div className="font-medium text-sm">{session.department}</div>
                          <div className="text-xs text-muted-foreground">
                            Created by {session.createdBy.firstName} {session.createdBy.lastName}
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Expires:</span>
                            <span>{format(new Date(session.expiresAt), "MMM dd, HH:mm")}</span>
                          </div>
                          {session.used && session.usedAt && (
                            <div className="flex justify-between">
                              <span>Used:</span>
                              <span>{format(new Date(session.usedAt), "MMM dd, HH:mm")}</span>
                            </div>
                          )}
                        </div>

                        {/* QR Code Display */}
                        <div className="flex justify-center py-2">
                          <QRCodeDisplay
                            data={JSON.stringify({
                              type: "REGISTRATION",
                              token: session.qrToken,
                              department: session.department,
                              expiresAt: session.expiresAt
                            })}
                            size={240}
                            className="scale-75"
                          />
                        </div>

                        <div className="flex gap-1 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadSessionQR(session)}
                            title="Copy QR data to clipboard"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Copy Data
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleShareQR(JSON.stringify({
                              type: "REGISTRATION",
                              token: session.qrToken,
                              department: session.department,
                              expiresAt: session.expiresAt
                            }))}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No registration sessions found</p>
                  <p className="text-sm">Create your first QR code in the Create tab</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extend Expiration Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend QR Code Expiration</DialogTitle>
            <DialogDescription>
              Add additional time to the selected QR code's expiration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Additional Time (minutes)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendMinutes(60)}
                  className={extendMinutes === 60 ? "bg-primary text-primary-foreground" : ""}
                >
                  1 Hour
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendMinutes(240)}
                  className={extendMinutes === 240 ? "bg-primary text-primary-foreground" : ""}
                >
                  4 Hours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendMinutes(1440)}
                  className={extendMinutes === 1440 ? "bg-primary text-primary-foreground" : ""}
                >
                  1 Day
                </Button>
              </div>
              <Input
                type="number"
                min="1"
                max="1440"
                value={extendMinutes}
                onChange={(e) => setExtendMinutes(Number(e.target.value))}
                placeholder="60"
              />
            </div>

            {selectedSession && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <div><strong>Department:</strong> {selectedSession.department}</div>
                  <div><strong>Current Expires:</strong> {format(new Date(selectedSession.expiresAt), "PPpp")}</div>
                  <div><strong>New Expires:</strong> {format(new Date(Date.now() + extendMinutes * 60000), "PPpp")}</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendSession} disabled={extendMutation.isPending}>
              {extendMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Extending...
                </>
              ) : (
                "Extend Expiration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
