// ========================================
// QR SCANNER COMPONENT
// Scan student ID QR code for attendance
// ========================================

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Loader2, AlertCircle, QrCode, Camera, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { classAttendancePortalApi, type SessionInfo } from "@/api/classAttendancePortal";
import type { AttendanceResult } from "./BiometricVerification";

interface QRScannerProps {
  token: string;
  session: SessionInfo;
  onSuccess: (data: AttendanceResult) => void;
  onBack: () => void;
}

export function QRScanner({ token, session, onSuccess, onBack }: QRScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"permission" | "scanning" | "verifying" | "recording">("permission");
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [cameraTimeout, setCameraTimeout] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set timeout for camera initialization (10 seconds)
    timeoutRef.current = setTimeout(() => {
      if (step === "permission") {
        setCameraTimeout(true);
        setError("Camera initialization timed out. Please check camera permissions in your browser settings.");
        setLoading(false);
      }
    }, 10000);

    startScanning();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    setLoading(true);
    setError(null);
    setCameraTimeout(false);

    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this device/browser");
      }

      console.log('[QRScanner] Requesting camera permission...');

      // Request camera permission explicitly first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        console.log('[QRScanner] Camera permission granted, stream obtained');
        
        // Stop the stream - html5-qrcode will create its own
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr: any) {
        console.error('[QRScanner] Camera permission error:', permErr);
        
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          throw new Error("Camera permission denied. Please enable camera access in your browser settings and refresh the page.");
        } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
          throw new Error("No camera found on this device.");
        } else if (permErr.name === 'NotReadableError' || permErr.name === 'TrackStartError') {
          throw new Error("Camera is already in use by another application. Please close other apps using the camera.");
        } else if (permErr.name === 'OverconstrainedError') {
          throw new Error("Camera doesn't support the requested configuration. Trying default settings...");
        } else if (permErr.name === 'SecurityError') {
          throw new Error("Camera access blocked by browser security policy. Make sure you're using HTTPS.");
        } else {
          throw new Error(`Camera error: ${permErr.name || permErr.message}`);
        }
      }

      console.log('[QRScanner] Initializing HTML5 QR Code scanner...');
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      console.log('[QRScanner] Starting scanner with environment camera...');
      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10, // Scans per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
          aspectRatio: 1.0,
        },
        onScanSuccess,
        onScanFailure
      );

      console.log('[QRScanner] Scanner started successfully');

      // Clear timeout if successful
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setStep("scanning");
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error('[QRScanner] Failed to start QR scanner:', error);
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setError(error.message || "Failed to access camera. Please check permissions and try again.");
      setLoading(false);
      setCameraTimeout(true);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Prevent multiple simultaneous processing
    if (isProcessing.current) return;
    isProcessing.current = true;

    setScannedData(decodedText);
    setStep("verifying");
    stopScanning();

    try {
      // Step 1: Validate QR code format (should be student index number or JSON)
      let indexNumber: string;
      let qrData: string = decodedText;
      
      try {
        // Try to parse as JSON first (new format)
        const parsed = JSON.parse(decodedText);
        indexNumber = parsed.indexNumber;
      } catch {
        // Fallback to plain text (old format)
        indexNumber = decodedText.trim();
      }
      
      if (!indexNumber) {
        throw new Error("Invalid QR code format");
      }

      // Step 2: Lookup student
      const student = await classAttendancePortalApi.lookupStudent(token, indexNumber);

      // Step 3: Record attendance
      setStep("recording");
      const response = await classAttendancePortalApi.recordQR({
        token,
        indexNumber,
        qrData,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to record attendance");
      }

      // Success
      onSuccess({
        success: true,
        studentId: response.attendance.studentId,
        studentName: response.attendance.studentName,
        indexNumber: student.indexNumber,
        verificationMethod: "QR_SCAN",
        timestamp: response.attendance.scanTime,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to process QR code");
      setStep("scanning");
      isProcessing.current = false;
      // Restart scanning after error
      setTimeout(() => startScanning(), 2000);
    }
  };

  const onScanFailure = (errorMessage: string) => {
    // This is called for every frame without a QR code - ignore it
    // Only log actual errors
    if (!errorMessage.includes("NotFoundException")) {
      console.error("QR scan error:", errorMessage);
    }
  };

  const handleBack = () => {
    stopScanning();
    onBack();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              <CardTitle>QR Code Scanner</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={loading || step === "recording"}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardDescription>
            Scan your student ID QR code to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Reader Container - Always present in DOM, hidden when not scanning */}
          <div
            id="qr-reader"
            className={step === "scanning" ? "w-full rounded-lg overflow-hidden border-2 border-primary" : "hidden"}
          />

          {/* Error State with Fallback - Show this first if there's an error */}
          {error && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Can't access camera? Try these options:
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={startScanning} variant="outline" className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={onBack} variant="secondary" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Use Manual Entry Instead
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Permission/Loading State - Only show if no error */}
          {!error && step === "permission" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Starting camera...</p>
                <p className="text-sm text-muted-foreground">
                  Please allow camera access when prompted
                </p>
                {cameraTimeout && (
                  <p className="text-xs text-destructive mt-2">
                    Taking longer than expected...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Scanning State */}
          {!error && step === "scanning" && (
            <>
              <div className="relative">
                {/* Overlay Instructions */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm z-10">
                  <Camera className="h-4 w-4 inline mr-2" />
                  Position QR code within the box
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Tips for scanning:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Hold your student ID steady within the scanning box</li>
                  <li>Ensure good lighting for best results</li>
                  <li>Keep the QR code flat and unobstructed</li>
                </ul>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Verifying State */}
          {step === "verifying" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Verifying QR code...</p>
                <p className="text-sm text-muted-foreground">
                  {scannedData && `Code: ${scannedData.substring(0, 10)}...`}
                </p>
              </div>
            </div>
          )}

          {/* Recording State */}
          {step === "recording" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <CheckCircle2 className="h-16 w-16 text-success" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Recording attendance...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we save your attendance
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Info */}
      {step === "scanning" && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm font-medium">Session Details:</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• {session.courseCode} - {session.courseName}</p>
            <p>• {session.lecturerName}</p>
            <p>• {session.venue}</p>
          </div>
        </div>
      )}
    </div>
  );
}
