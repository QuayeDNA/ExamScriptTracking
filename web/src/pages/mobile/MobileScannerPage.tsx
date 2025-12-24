import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  FileText,
} from "lucide-react";
import { examSessionsApi, type ExamSession } from "@/api/examSessions";
import { toast } from "sonner";

// Mock attendance API for web implementation
const attendanceApi = {
  recordAttendance: async (
    studentId: string,
    examSessionId: string,
    action: "ENTRY" | "EXIT"
  ) => {
    // Mock implementation - in real app this would call the backend
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
    return {
      studentId,
      examSessionId,
      action,
      timestamp: new Date().toISOString(),
      success: true,
    };
  },
};

export const MobileScannerPage = () => {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [activeExamSession, setActiveExamSession] =
    useState<ExamSession | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    data?: {
      studentId: string;
      examSessionId: string;
      action: "ENTRY" | "EXIT";
      timestamp: string;
      success: boolean;
    };
    error?: string;
    message?: string;
  } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Mock camera functionality for web
  const [cameraActive, setCameraActive] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        // Get active exam sessions
        const sessions = await examSessionsApi.getExamSessions({
          status: "IN_PROGRESS",
          limit: 1,
        });

        if (sessions.examSessions.length > 0) {
          setActiveExamSession(sessions.examSessions[0]);
        }
      } catch (error) {
        console.warn("Failed to load active session:", error);
      }
    };

    loadActiveSession();
  }, []);

  const recordAttendanceMutation = useMutation({
    mutationFn: ({
      studentId,
      examSessionId,
      action,
    }: {
      studentId: string;
      examSessionId: string;
      action: "ENTRY" | "EXIT";
    }) => attendanceApi.recordAttendance(studentId, examSessionId, action),
    onSuccess: (data) => {
      setScanResult({
        success: true,
        data,
        message: `Student ${
          scanMode === "ENTRY" ? "entry" : "exit"
        } recorded successfully`,
      });
      setShowResultDialog(true);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to record attendance";
      setScanResult({
        success: false,
        error: message,
      });
      setShowResultDialog(true);
    },
  });

  const handleManualEntry = () => {
    if (!manualInput.trim()) {
      toast.error("Please enter a student ID");
      return;
    }

    if (!activeExamSession) {
      toast.error("No active exam session found");
      return;
    }

    recordAttendanceMutation.mutate({
      studentId: manualInput.trim(),
      examSessionId: activeExamSession.id,
      action: scanMode,
    });
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
    toast.info(flashEnabled ? "Flash turned off" : "Flash turned on");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">QR Scanner</h1>
              <p className="text-blue-100 text-sm">
                Scan student QR codes for attendance
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-500">
              {scanMode}
            </Badge>
          </div>
        </div>

        {/* Active Session Info */}
        {activeExamSession && (
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {activeExamSession.courseCode}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeExamSession.venue}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Active
              </Badge>
            </div>
          </div>
        )}

        {/* Scanner Area */}
        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="space-y-6">
                  {/* Camera View Placeholder */}
                  <div className="relative">
                    <div
                      className={`w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center ${
                        cameraActive
                          ? "border-2 border-green-500"
                          : "border-2 border-gray-300"
                      }`}
                    >
                      {cameraActive ? (
                        <div className="text-center text-white">
                          <Camera className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Camera Active</p>
                          <p className="text-xs text-gray-300 mt-2">
                            Point camera at QR code
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <CameraOff className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Camera Inactive</p>
                        </div>
                      )}
                    </div>

                    {/* Scan overlay */}
                    {cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50">
                          <div className="w-full h-full border-2 border-transparent border-t-white animate-spin"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleCamera}
                      className={
                        cameraActive ? "bg-green-50 border-green-200" : ""
                      }
                    >
                      {cameraActive ? (
                        <CameraOff className="w-4 h-4" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>

                    {cameraActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFlash}
                        className={
                          flashEnabled ? "bg-yellow-50 border-yellow-200" : ""
                        }
                      >
                        {flashEnabled ? (
                          <FlashlightOff className="w-4 h-4" />
                        ) : (
                          <Flashlight className="w-4 h-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setScanMode(scanMode === "ENTRY" ? "EXIT" : "ENTRY")
                      }
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Manual Input Toggle */}
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowManualInput(!showManualInput)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {showManualInput ? "Hide" : "Show"} Manual Entry
                  </Button>

                  {/* Manual Input */}
                  {showManualInput && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label htmlFor="manualInput">Student ID</Label>
                        <Input
                          id="manualInput"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          placeholder="Enter student ID manually"
                        />
                      </div>
                      <Button
                        onClick={handleManualEntry}
                        disabled={
                          recordAttendanceMutation.isPending ||
                          !manualInput.trim()
                        }
                        className="w-full"
                      >
                        {recordAttendanceMutation.isPending
                          ? "Recording..."
                          : "Record Attendance"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="px-4 pb-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">
                      1
                    </span>
                  </div>
                  <p>Enable camera and point it at the student's QR code</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">
                      2
                    </span>
                  </div>
                  <p>Ensure the QR code is within the scanning area</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">
                      3
                    </span>
                  </div>
                  <p>Switch between ENTRY and EXIT mode as needed</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">
                      4
                    </span>
                  </div>
                  <p>Use manual entry if camera is not available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t bg-white px-4 py-2">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile")}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile/custody")}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">Custody</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate("/mobile/incidents")}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs">Incidents</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 text-blue-600"
              onClick={() => navigate("/mobile/scanner")}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-xs">Scanner</span>
            </Button>
          </div>
        </div>

        {/* Scan Result Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center space-x-2">
                {scanResult?.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <DialogTitle>
                  {scanResult?.success ? "Success" : "Error"}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p
                className={
                  scanResult?.success ? "text-green-700" : "text-red-700"
                }
              >
                {scanResult?.message || scanResult?.error}
              </p>
              {scanResult?.success && scanResult?.data && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    Student ID: {scanResult.data.studentId}
                  </p>
                  <p className="text-sm text-gray-600">
                    Action: {scanResult.data.action}
                  </p>
                  <p className="text-sm text-gray-600">
                    Time:{" "}
                    {new Date(scanResult.data.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowResultDialog(false)}>
                Continue Scanning
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
