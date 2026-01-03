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
  session: SessionInfo;
  onSuccess: (data: AttendanceResult) => void;
  onBack: () => void;
}

export function QRScanner({ session, onSuccess, onBack }: QRScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"permission" | "scanning" | "verifying" | "recording">("permission");
  const [scannedData, setScannedData] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    setLoading(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10, // Scans per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        onScanSuccess,
        onScanFailure
      );

      setStep("scanning");
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error("Failed to start QR scanner:", error);
      setError(
        error.message || "Failed to access camera. Please check permissions."
      );
      setLoading(false);
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
      // Step 1: Validate QR code format (should be student index number)
      const indexNumber = decodedText.trim();
      if (!indexNumber) {
        throw new Error("Invalid QR code format");
      }

      // Step 2: Lookup student
      const student = await classAttendancePortalApi.lookupStudent(indexNumber);

      // Step 3: Record attendance
      setStep("recording");
      const response = await classAttendancePortalApi.recordQR({
        recordId: session.id,
        qrData: indexNumber,
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
          {/* Permission/Loading State */}
          {step === "permission" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Starting camera...</p>
                <p className="text-sm text-muted-foreground">
                  Please allow camera access when prompted
                </p>
              </div>
            </div>
          )}

          {/* Scanning State */}
          {step === "scanning" && (
            <>
              <div className="relative">
                {/* QR Scanner Container */}
                <div
                  id="qr-reader"
                  className="w-full rounded-lg overflow-hidden border-2 border-primary"
                />

                {/* Overlay Instructions */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
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
              <CheckCircle2 className="h-16 w-16 text-green-600" />
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
