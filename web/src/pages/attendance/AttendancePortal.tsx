import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { StudentRegistrationModal } from "@/components/attendance/StudentRegistrationModal";
import type { AttendanceResult } from "@/components/attendance/BiometricVerification";
import { getStudentIdentity, isStudentRegistered, updateLastUsed, type StudentIdentity } from "@/utils/studentIdentity";

export function AttendancePortal() {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Support both query param (?token=xxx) and path param (/attendance/:token)
  const token = searchParams.get("token") || pathToken;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [showEnrollmentPrompt, setShowEnrollmentPrompt] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [studentIdentity, setStudentIdentity] = useState<StudentIdentity | null>(null);
  const [currentView, setCurrentView] = useState<"session" | "method-selection" | "biometric" | "qr" | "manual" | "success">("session");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<AttendanceResult | null>(null);
  
  // Check biometric enrollment status using registered student's index number
  const biometricStatus = useBiometricStatus(studentIdentity?.indexNumber || null);

  // Check if student is registered on this device
  useEffect(() => {
    if (isStudentRegistered()) {
      const identity = getStudentIdentity();
      setStudentIdentity(identity);
      updateLastUsed();
    } else {
      // Show registration modal on first visit
      setShowRegistrationModal(true);
    }
  }, []);

  const handleRegistrationComplete = (identity: StudentIdentity) => {
    setStudentIdentity(identity);
    setShowRegistrationModal(false);
    // Continue with link validation
    if (token) {
      validateLink();
    }
  };

  const validateLink = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get user's location (for geofencing validation)
      let studentLocation: { lat: number; lng: number } | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 60000,
            });
          });
          
          studentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (geoError) {
          console.warn("Could not get location:", geoError);
          // Continue without location - backend will handle if it's required
        }
      }

      const response = await classAttendancePortalApi.validateLink(token!, studentLocation);

      if (!response.valid || !response.session) {
        setError(response.error || "This attendance link is invalid or has expired");
        return;
      }

      setSession(response.session);
      
      // TODO: Extract student index number from session/token when backend provides it
      // For now, enrollment prompt won't show until we have student identification
      // setStudentIndexNumber(response.studentIndexNumber);
    } catch (err: any) {
      console.error('[AttendancePortal] Validation error:', err);
      
      // Extract error message from API response or use generic message
      let errorMessage = "Failed to validate attendance link";
      
      if (err?.error) {
        // API returned error in standard format { error: "message" }
        errorMessage = err.error;
      } else if (err?.message) {
        // Error object with message
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
    if (!studentIdentity) {
      setError("Student identity not found. Please refresh and try again.");
      return;
    }

    // Map result.verificationMethod to LocalAttendanceRecord format
    let verificationMethod: LocalAttendanceRecord['verificationMethod'] = 'MANUAL';
    if (result.verificationMethod === 'BIOMETRIC') {
      verificationMethod = 'BIOMETRIC_FINGERPRINT'; // Default to fingerprint
    } else if (result.verificationMethod === 'QR_SCAN') {
      verificationMethod = 'QR_SCAN';
    }

    // Save to local storage with registered student identity
    const record: LocalAttendanceRecord = {
      id: `${result.studentId}-${Date.now()}`,
      studentId: result.studentId,
      indexNumber: studentIdentity.indexNumber,
      courseCode: session!.courseCode,
      courseName: session!.courseName,
      lecturerName: session!.lecturerName,
      venue: session!.venue,
      timestamp: result.timestamp,
      verificationMethod,
      confidence: result.confidence,
      sessionId: session!.id,
      sessionDate: new Date(session!.startTime).toISOString(),
      // Use registered student identity
      firstName: studentIdentity.firstName,
      lastName: studentIdentity.lastName,
      profilePictureUrl: "",
      program: studentIdentity.program || "",
      level: studentIdentity.level || 0,
      deviceId: studentIdentity.deviceId,
    };

    saveAttendanceRecord(record);

    // Set result and show success screen
    setAttendanceResult(result);
    setCurrentView("success");
  };

  // Show registration modal if student not registered
  if (showRegistrationModal) {
    return <StudentRegistrationModal open={true} onComplete={handleRegistrationComplete} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
      <div className="min-h-screen bg-background p-4">
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Student Identity Badge */}
        {studentIdentity && (
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {studentIdentity.firstName.charAt(0)}{studentIdentity.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {studentIdentity.firstName} {studentIdentity.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {studentIdentity.indexNumber}
                    {studentIdentity.program && ` • ${studentIdentity.program}`}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                📱 Device Registered
              </div>
            </div>
          </div>
        )}

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
                  <div className="bg-muted rounded-lg p-4 space-y-2">
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
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success border border-success/20">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
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
            {currentView === "biometric" && biometricStatus.provider && token && (
              <BiometricVerification
                token={token}
                session={session}
                biometricProvider={biometricStatus.provider}
                onSuccess={handleVerificationSuccess}
                onBack={handleBack}
              />
            )}

            {/* QR SCANNER VIEW */}
            {currentView === "qr" && token && (
              <QRScanner
                token={token}
                session={session}
                onSuccess={handleVerificationSuccess}
                onBack={handleBack}
              />
            )}

            {/* MANUAL ENTRY VIEW */}
            {currentView === "manual" && token && (
              <ManualEntry
                token={token}
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
