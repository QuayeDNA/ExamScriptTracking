import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { classAttendancePortalApi, type SessionInfo } from "@/api/classAttendancePortal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { saveAttendanceRecord, getAllRecords, type LocalAttendanceRecord } from "@/utils/attendanceStorage";
import { useBiometricStatus } from "@/hooks/useBiometricStatus";
import { EnrollmentPrompt } from "@/components/attendance/EnrollmentPrompt";
import { isEnrollmentPromptDismissed } from "@/utils/enrollmentPromptStorage";
import { MethodSelection } from "@/components/attendance/MethodSelection";
import { BiometricVerification } from "@/components/attendance/BiometricVerification";
import { QRScanner } from "@/components/attendance/QRScanner";
import { ManualEntry } from "@/components/attendance/ManualEntry";
import { VerificationSuccess } from "@/components/attendance/VerificationSuccess";
import type { AttendanceResult } from "@/components/attendance/BiometricVerification";

export function AttendancePortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [showEnrollmentPrompt, setShowEnrollmentPrompt] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [studentIndexNumber, _setStudentIndexNumber] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"session" | "method-selection" | "biometric" | "qr" | "manual" | "success">("session");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<AttendanceResult | null>(null);
  
  // Check biometric enrollment status (only if we have index number)
  const biometricStatus = useBiometricStatus(studentIndexNumber);

  const validateLink = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await classAttendancePortalApi.validateLink(token!);

      if (!response.valid || !response.session) {
        setError(response.error || "This attendance link is invalid or has expired");
        return;
      }

      setSession(response.session);
      
      // TODO: Extract student index number from session/token when backend provides it
      // For now, enrollment prompt won't show until we have student identification
      // setStudentIndexNumber(response.studentIndexNumber);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to validate attendance link"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Invalid attendance link");
      setLoading(false);
      return;
    }

    validateLink();
  }, [token, validateLink]);

  // Show enrollment prompt if conditions are met
  useEffect(() => {
    if (
      session && // Valid session
      !biometricStatus.loading && // Status loaded
      !biometricStatus.enrolled && // Not enrolled
      biometricStatus.deviceSupported && // Device supports biometric
      !isEnrollmentPromptDismissed() // User hasn't dismissed
    ) {
      setShowEnrollmentPrompt(true);
    }
  }, [session, biometricStatus]);

  const handleProceedToMethods = () => {
    setCurrentView("method-selection");
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setCurrentView(methodId as "biometric" | "qr" | "manual");
  };

  const handleBack = () => {
    // If we're on a verification screen, go back to method selection
    if (currentView === "biometric" || currentView === "qr" || currentView === "manual") {
      setCurrentView("method-selection");
      setSelectedMethod(null);
    } else if (currentView === "method-selection") {
      setCurrentView("session");
    }
  };

  const handleVerificationSuccess = async (result: AttendanceResult) => {
    // Map result.verificationMethod to LocalAttendanceRecord format
    let verificationMethod: LocalAttendanceRecord['verificationMethod'] = 'MANUAL';
    if (result.verificationMethod === 'BIOMETRIC') {
      verificationMethod = 'BIOMETRIC_FINGERPRINT'; // Default to fingerprint
    } else if (result.verificationMethod === 'QR_SCAN') {
      verificationMethod = 'QR_SCAN';
    }

    // Save to local storage with proper LocalAttendanceRecord structure
    const record: LocalAttendanceRecord = {
      id: `${result.studentId}-${Date.now()}`,
      studentId: result.studentId,
      indexNumber: result.indexNumber,
      courseCode: session!.courseCode,
      courseName: session!.courseName,
      lecturerName: session!.lecturerName,
      venue: session!.venue,
      timestamp: result.timestamp,
      verificationMethod,
      confidence: result.confidence,
      sessionId: session!.id,
      sessionDate: new Date(session!.startTime).toISOString(),
      // Additional required fields - extract from studentName if available
      firstName: result.studentName.split(" ")[0] || "",
      lastName: result.studentName.split(" ").slice(1).join(" ") || "",
      profilePictureUrl: "",
      program: "", // Not available from result
      level: 0, // Not available from result
      deviceId: "", // Will be generated if not available
    };

    saveAttendanceRecord(record);

    // Set result and show success screen
    setAttendanceResult(result);
    setCurrentView("success");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Validating attendance link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    const hasHistory = getAllRecords().length > 0;
    
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Invalid Link</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>This link may have expired or is no longer valid.</p>
                <p>Please:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check that you scanned the correct QR code</li>
                  <li>Ask your lecturer for a new attendance link</li>
                  <li>Ensure the recording session is still active</li>
                </ul>
              </div>

              <Button
                onClick={() => navigate("/my-attendance")}
                variant="outline"
                className="w-full"
              >
                {hasHistory ? "View My Attendance History" : "Go Back"}
              </Button>
            </CardContent>
          </Card>

          {/* Show history even when link is invalid */}
          {hasHistory && (
            <div>
              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">
                  📜 Your personal attendance history is stored on this device
                </p>
              </div>
              <AttendanceHistory maxRecords={5} showHeader={true} />
              {getAllRecords().length > 5 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => navigate("/my-attendance")}
                    variant="link"
                  >
                    View All {getAllRecords().length} Records →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success - Show appropriate view based on state
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                {currentView !== "session" && currentView !== "success" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <CheckCircle2 className="h-6 w-6" />
                <CardTitle>
                  {currentView === "success" ? "Attendance Recorded" : "Mark Attendance"}
                </CardTitle>
              </div>
            </div>
            {currentView === "session" && (
              <CardDescription>
                Session validated successfully
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SESSION VIEW */}
            {currentView === "session" && (
              <>
                {/* Session Info */}
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Course</div>
                      <div className="font-semibold text-lg">
                        {session.courseCode} - {session.courseName}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Lecturer</div>
                        <div className="text-sm font-medium">{session.lecturerName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Venue</div>
                        <div className="text-sm font-medium">{session.venue}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Time</div>
                      <div className="text-sm font-medium">
                        {new Date(session.startTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">Recording Active</span>
                  </div>
                </div>

                {/* Enrollment Prompt (if applicable) */}
                {showEnrollmentPrompt && biometricStatus.deviceType && (
                  <EnrollmentPrompt
                    deviceType={biometricStatus.deviceType}
                    onDismiss={() => setShowEnrollmentPrompt(false)}
                  />
                )}

                {/* Action button */}
                <Button
                  onClick={handleProceedToMethods}
                  size="lg"
                  className="w-full"
                >
                  Choose Verification Method
                </Button>

                {/* Help text */}
                <p className="text-xs text-center text-muted-foreground">
                  You'll be asked to choose how to verify your identity:
                  <br />
                  Biometric, QR Code, or Index Number
                </p>
              </>
            )}

            {/* METHOD SELECTION VIEW */}
            {currentView === "method-selection" && (
              <MethodSelection
                biometricStatus={biometricStatus}
                onSelectMethod={handleMethodSelect}
              />
            )}

            {/* BIOMETRIC VERIFICATION VIEW */}
            {currentView === "biometric" && biometricStatus.provider && (
              <BiometricVerification
                session={session}
                biometricProvider={biometricStatus.provider}
                onSuccess={handleVerificationSuccess}
                onBack={handleBack}
              />
            )}

            {/* QR SCANNER VIEW */}
            {currentView === "qr" && (
              <QRScanner
                session={session}
                onSuccess={handleVerificationSuccess}
                onBack={handleBack}
              />
            )}

            {/* MANUAL ENTRY VIEW */}
            {currentView === "manual" && (
              <ManualEntry
                session={session}
                onSuccess={handleVerificationSuccess}
                onBack={handleBack}
              />
            )}

            {/* SUCCESS VIEW */}
            {currentView === "success" && attendanceResult && (
              <VerificationSuccess
                result={attendanceResult}
                session={session}
              />
            )}
          </CardContent>
        </Card>

        {/* Show attendance history below current session (only on session view) */}
        {currentView === "session" && getAllRecords().length > 0 && (
          <div>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                📜 Your recent attendance history
              </p>
            </div>
            <AttendanceHistory compact maxRecords={3} showHeader={false} />
            {getAllRecords().length > 3 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => navigate("/my-attendance")}
                  variant="link"
                >
                  View All {getAllRecords().length} Records →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
