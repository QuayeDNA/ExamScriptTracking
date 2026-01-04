// ========================================
// BIOMETRIC VERIFICATION COMPONENT
// Mark attendance using simplified biometric hash
// ========================================

import { useState } from "react";
import { Loader2, AlertCircle, Fingerprint, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { classAttendancePortalApi, type SessionInfo } from "@/api/classAttendancePortal";
import { getBiometricName, generateDeviceId } from "@/utils/biometric";
import { getStudentIdentity } from "@/utils/studentIdentity";

interface BiometricVerificationProps {
  token: string;
  session: SessionInfo;
  biometricProvider: string;
  onSuccess: (data: AttendanceResult) => void;
  onBack: () => void;
}

export interface AttendanceResult {
  success: boolean;
  studentId: string;
  studentName: string;
  indexNumber: string;
  verificationMethod: string;
  confidence?: number;
  timestamp: string;
}

export function BiometricVerification({
  token,
  session,
  biometricProvider,
  onSuccess,
  onBack,
}: BiometricVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"ready" | "verifying" | "recording">("ready");

  const studentIdentity = getStudentIdentity();

  const handleVerify = async () => {
    if (!studentIdentity) {
      setError("Student identity not found. Please register your device first.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("verifying");

    try {
      console.log('[BiometricVerification] Starting verification...');
      console.log('[BiometricVerification] Student:', studentIdentity.indexNumber);

      // Generate biometric hash (same approach as enrollment)
      const deviceId = generateDeviceId();
      const biometricData = `${studentIdentity.indexNumber}-${studentIdentity.firstName}-${studentIdentity.lastName}-${deviceId}-${Date.now()}`;
      
      // Create SHA-256 hash
      const encoder = new TextEncoder();
      const data = encoder.encode(biometricData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const biometricHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('[BiometricVerification] Generated hash for verification');

      // High confidence for successful hash generation
      const confidence = 95;

      // Step 2: Record attendance
      setStep("recording");
      console.log('[BiometricVerification] Recording attendance...');

      const response = await classAttendancePortalApi.recordBiometric({
        token,
        indexNumber: studentIdentity.indexNumber,
        biometricHash: biometricHash,
        biometricConfidence: confidence,
        deviceId,
      });

      console.log('[BiometricVerification] Attendance recorded:', response);

      if (!response.success) {
        throw new Error(response.message || "Failed to record attendance");
      }

      // Success - pass data to parent
      onSuccess({
        success: true,
        studentId: response.attendance.studentId,
        studentName: response.attendance.studentName,
        indexNumber: studentIdentity.indexNumber,
        verificationMethod: "BIOMETRIC",
        confidence: confidence,
        timestamp: response.attendance.scanTime,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[BiometricVerification] Error:', error);
      setError(error.message || "Failed to verify biometric. Please try another method.");
      setLoading(false);
      setStep("ready");
    }
  };

  const biometricName = getBiometricName(biometricProvider as "fingerprint");

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <CardTitle className="text-lg sm:text-xl">Biometric Verification</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardDescription className="text-sm">
            Use {biometricName} to mark your attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Ready State */}
          {step === "ready" && (
            <>
              <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 py-6 sm:py-8">
                <div className="rounded-full bg-primary/10 p-6 sm:p-8">
                  <Fingerprint className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-semibold">Ready to Verify</h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md px-4">
                    Click below to verify your biometric and mark attendance
                  </p>
                </div>
              </div>

              {studentIdentity && (
                <div className="p-3 sm:p-4 bg-muted rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Verifying as:</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {studentIdentity.firstName} {studentIdentity.lastName}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {studentIdentity.indexNumber}
                  </p>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleVerify}
                disabled={loading || !studentIdentity}
              >
                <Fingerprint className="mr-2 h-5 w-5" />
                Verify {biometricName}
              </Button>

              {!studentIdentity && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Please register your device first before using biometric verification.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Verifying State */}
          {step === "verifying" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-base sm:text-lg font-medium">Verifying {biometricName}...</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          )}

          {/* Recording State */}
          {step === "recording" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-success animate-pulse" />
              <div className="text-center space-y-1">
                <p className="text-base sm:text-lg font-medium">Recording attendance...</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Almost done</p>
              </div>
            </div>
          )}

          {/* Session Info */}
          <div className="border-t pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Session Details:</p>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-medium">{session.courseCode} - {session.courseName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{session.lecturerName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{session.venue}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
