// ========================================
// BIOMETRIC VERIFICATION COMPONENT
// Mark attendance using biometric authentication
// ========================================

import { useState } from "react";
import { Loader2, AlertCircle, Fingerprint, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { verifyBiometric, getWebAuthnErrorMessage } from "@/services/webauthn";
import { classAttendancePortalApi, type SessionInfo } from "@/api/classAttendancePortal";
import { getBiometricName } from "@/utils/biometric";
import { generateDeviceId } from "@/utils/biometric";

interface BiometricVerificationProps {
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
  session,
  biometricProvider,
  onSuccess,
  onBack,
}: BiometricVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"ready" | "verifying" | "recording">("ready");

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setStep("verifying");

    try {
      // Step 1: Verify biometric
      const verificationResult = await verifyBiometric();

      if (!verificationResult.success) {
        throw new Error(verificationResult.error || "Biometric verification failed");
      }

      // Check confidence threshold
      if (verificationResult.confidence < 80) {
        setError(
          `Low confidence score (${verificationResult.confidence}%). Please try again for better accuracy.`
        );
        setLoading(false);
        setStep("ready");
        return;
      }

      // Step 2: Record attendance
      setStep("recording");
      const deviceId = generateDeviceId();

      const response = await classAttendancePortalApi.recordBiometric({
        recordId: session.id,
        biometricHash: verificationResult.credentialId, // Using credential ID as hash
        biometricConfidence: verificationResult.confidence,
        deviceId,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to record attendance");
      }

      // Success - pass data to parent
      onSuccess({
        success: true,
        studentId: response.attendance.studentId,
        studentName: response.attendance.studentName,
        indexNumber: "", // Index number not provided in response
        verificationMethod: "BIOMETRIC",
        confidence: verificationResult.confidence,
        timestamp: response.attendance.scanTime,
      });
    } catch (err) {
      const error = err as Error;
      const errorMessage = getWebAuthnErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      setStep("ready");
    }
  };

  const biometricName = getBiometricName(biometricProvider as "fingerprint");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-6 w-6 text-primary" />
              <CardTitle>Biometric Verification</CardTitle>
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
          <CardDescription>
            Use {biometricName} to mark your attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ready State */}
          {step === "ready" && (
            <>
              <div className="flex flex-col items-center text-center space-y-4 py-8">
                <div className="rounded-full bg-primary/10 p-8">
                  <Fingerprint className="h-16 w-16 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Ready to Verify</h3>
                  <p className="text-muted-foreground max-w-md">
                    Click the button below to start biometric verification. Your device will
                    prompt you to use {biometricName}.
                  </p>
                </div>
              </div>

              {/* Session Info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Session Details:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• {session.courseCode} - {session.courseName}</p>
                  <p>• {session.lecturerName}</p>
                  <p>• {session.venue}</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Verify with {biometricName}
                  </>
                )}
              </Button>
            </>
          )}

          {/* Verifying State */}
          {step === "verifying" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Verifying biometric...</p>
                <p className="text-sm text-muted-foreground">
                  Follow the prompt on your device
                </p>
              </div>
            </div>
          )}

          {/* Recording State */}
          {step === "recording" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
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

      {/* Info Card */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Security Note:</strong> Your biometric data is verified locally on your device
          and never transmitted to our servers. We only store a secure hash for verification.
        </p>
      </div>
    </div>
  );
}
