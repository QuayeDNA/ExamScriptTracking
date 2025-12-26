import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Download, RefreshCw, Clock, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationApi } from "@/api/registration";
import { toast } from "sonner";
import { format } from "date-fns";

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

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Registration</h1>
        <p className="text-muted-foreground">
          Create QR codes for fast invigilator registration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create QR Section */}
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
              <Input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science Department"
                required
              />
              <p className="text-sm text-muted-foreground">
                Users who register with this QR code will be assigned to this department
              </p>
            </div>

            <Button
              onClick={handleCreateQR}
              disabled={createSessionMutation.isPending}
              className="w-full"
            >
              {createSessionMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Generate QR Code"
              )}
            </Button>

            {currentQR && (
              <Alert>
                <AlertDescription>
                  QR code created successfully! Share this code with new
                  invigilators.
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
                  <div id="qr-code" className="p-4 bg-white rounded-lg">
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

                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
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

      {/* Sessions History */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="text-center py-4">Loading sessions...</div>
          ) : sessionsError ? (
            <div className="text-center py-4 text-red-600">
              Failed to load sessions: {sessionsError.message}
            </div>
          ) : sessions?.sessions && sessions.sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.sessions.map((session: RegistrationSession) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
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
                      <span className="text-sm text-muted-foreground">
                        Created by {session.createdBy.firstName}{" "}
                        {session.createdBy.lastName}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(session.createdAt), "PPp")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Department:</span>{" "}
                      {session.department}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span>{" "}
                      {format(new Date(session.expiresAt), "PPp")}
                    </div>
                    {session.used && session.usedAt && (
                      <div className="col-span-2">
                        <span className="font-medium">Used:</span>{" "}
                        {format(new Date(session.usedAt), "PPp")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No registration sessions found</p>
              <p className="text-sm">Create your first QR code above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
