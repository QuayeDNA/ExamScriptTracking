import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { examSessionsApi, type ExamSession } from "@/api/examSessions";
import { attendanceApi } from "@/api/attendance";
import { toast } from "sonner";

// Extend MediaTrackCapabilities to include torch
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

export const MobileScannerPage = () => {
  const [scanMode, setScanMode] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [activeExamSession, setActiveExamSession] =
    useState<ExamSession | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    data?: unknown;
    error?: string;
    message?: string;
  } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Camera and scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt" | null
  >(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const loadActiveSession = async () => {
      try {
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

  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          setCameraPermission(permission.state);
          permission.addEventListener("change", () => {
            setCameraPermission(permission.state);
          });
        }
      } catch (error) {
        console.warn("Could not check camera permission:", error);
      }
    };

    checkCameraPermission();
  }, []);

  // Handle video element ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log(
        "Video metadata loaded, video dimensions:",
        video.videoWidth,
        "x",
        video.videoHeight
      );
    };

    const handleCanPlay = () => {
      console.log("Video can play, readyState:", video.readyState);
    };

    const handlePlaying = () => {
      console.log("Video is now playing");
      setCameraActive(true);
    };

    const handleError = (e: Event) => {
      console.error("Video error:", e);
      setCameraActive(false);
    };

    const handleLoadStart = () => {
      console.log("Video load started");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraPermission("granted");
      return stream;
    } catch (error) {
      console.error("Camera permission denied:", error);
      setCameraPermission("denied");
      throw error;
    }
  };

  const startCamera = useCallback(async () => {
    try {
      // Don't check permission state here - let getUserMedia handle prompting
      const stream = await requestCameraPermission();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Stream assigned to video element");

        // Ensure video plays
        try {
          await videoRef.current.play();
          console.log("Video started playing");
          setCameraActive(true);
          setIsScanning(true);
          toast.success("Camera started - point at QR code to scan");
        } catch (playError) {
          console.warn("Could not autoplay video:", playError);
          // Try to play again after a short delay
          setTimeout(async () => {
            try {
              await videoRef.current?.play();
              console.log("Video started playing after delay");
              setCameraActive(true);
              setIsScanning(true);
            } catch (retryError) {
              console.error(
                "Failed to play video even after retry:",
                retryError
              );
              setCameraActive(false);
              setIsScanning(false);
            }
          }, 100);
        }
      } else {
        console.error("Video element not found");
        setCameraActive(false);
        setIsScanning(false);
      }
    } catch (error) {
      console.error("Failed to start camera:", error);
      toast.error("Failed to start camera");
      setCameraActive(false);
      setIsScanning(false);
    }
  }, []);

  // Auto-start camera when permission is granted and video element is ready
  useEffect(() => {
    if (cameraPermission === "granted" && !cameraActive && videoRef.current) {
      console.log(
        "Permission granted and video element ready, starting camera"
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCamera();
    }
  }, [cameraPermission, cameraActive, startCamera]);

  const recordAttendanceMutation = useMutation({
    mutationFn: async ({
      studentId,
      examSessionId,
      action,
    }: {
      studentId: string;
      examSessionId: string;
      action: "ENTRY" | "EXIT";
    }) => {
      if (action === "ENTRY") {
        return await attendanceApi.recordEntry(studentId, examSessionId);
      } else {
        throw new Error("Exit recording not implemented for web scanner yet");
      }
    },
    onSuccess: (data) => {
      setScanResult({
        success: true,
        data,
        message: `Student ${
          scanMode === "ENTRY" ? "entry" : "exit"
        } recorded successfully`,
      });
      setShowResultDialog(true);
      setIsScanning(false);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to record attendance";
      setScanResult({
        success: false,
        error: message,
      });
      setShowResultDialog(true);
      setIsScanning(false);
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsScanning(false);
    setFlashEnabled(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

    if (videoTrack && capabilities.torch) {
      const newFlashState = !flashEnabled;
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState } as MediaTrackConstraints],
        });
        setFlashEnabled(newFlashState);
        toast.info(newFlashState ? "Flash turned on" : "Flash turned off");
      } catch {
        toast.error("Failed to toggle flash");
      }
    } else {
      toast.error("Flash not supported on this device");
    }
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">QR Scanner</h1>
            <p className="text-primary-foreground/80 text-sm">
              Scan student QR codes for attendance
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-primary-foreground/10 text-primary-foreground"
          >
            {scanMode}
          </Badge>
        </div>
      </div>

      {/* Active Session Info */}
      <div className="bg-card border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {activeExamSession?.courseCode || "No Active Session"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeExamSession?.venue || "Please wait for session to start"}
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            {activeExamSession ? "Active" : "Waiting"}
          </Badge>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="space-y-6">
                {/* Camera View */}
                <div className="relative">
                  <div
                    className={`w-full h-64 bg-muted rounded-lg flex items-center justify-center overflow-hidden ${
                      cameraActive
                        ? "border-2 border-green-500"
                        : "border-2 border-border"
                    }`}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover rounded-lg ${
                        cameraActive ? "block" : "hidden"
                      }`}
                      style={{ transform: "scaleX(-1)" }} // Mirror the video for selfie-like experience
                      onLoadedMetadata={() =>
                        console.log("Video loaded metadata")
                      }
                      onCanPlay={() => console.log("Video can play")}
                      onPlaying={() => console.log("Video playing")}
                      onError={(e) => console.error("Video error:", e)}
                    />

                    {!cameraActive && (
                      <div className="text-center text-muted-foreground">
                        <CameraOff className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Camera Inactive</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Permission: {cameraPermission || "unknown"}
                        </p>
                        {cameraPermission === "denied" && (
                          <p className="text-xs text-red-500 mt-1">
                            Camera permission denied
                          </p>
                        )}
                        {cameraPermission === "granted" && (
                          <p className="text-xs text-green-500 mt-1">
                            Tap camera button to start
                          </p>
                        )}
                      </div>
                    )}

                    {cameraActive && (
                      <>
                        {isScanning && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-sm bg-black/50 rounded px-2 py-1">
                              Scanning for QR codes...
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFlash}
                    disabled={!cameraActive}
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
                  <span className="text-blue-600 font-semibold text-xs">1</span>
                </div>
                <p>Enable camera and point it at the student's QR code</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-xs">2</span>
                </div>
                <p>Ensure the QR code is within the scanning area</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-xs">3</span>
                </div>
                <p>Switch between ENTRY and EXIT mode as needed</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-xs">4</span>
                </div>
                <p>Use manual entry if camera is not available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scanResult?.success ? "Success" : "Error"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{scanResult?.message || scanResult?.error}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              Continue Scanning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
