import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Fingerprint, Smartphone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { classAttendancePortalApi, type StudentLookupResponse } from "@/api/classAttendancePortal";
import { checkDeviceSupport, getBiometricName } from "@/utils/biometric";
import { registerBiometric, getWebAuthnErrorMessage } from "@/services/webauthn";
import { cacheProfilePicture } from "@/utils/profilePictureCache";
import type { BiometricType, DeviceSupport } from "@/utils/biometric";

type EnrollmentStep = "index" | "device-check" | "unsupported" | "capture" | "saving" | "success";

interface EnrollmentData {
  student: StudentLookupResponse | null;
  deviceSupport: DeviceSupport | null;
  credentialId: string;
  biometricHash: string;
  confidence: number;
  enrolledAt: string;
}

export function BiometricEnrollment() {
  const [indexNumber, setIndexNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<EnrollmentStep>("index");
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    student: null,
    deviceSupport: null,
    credentialId: "",
    biometricHash: "",
    confidence: 0,
    enrolledAt: "",
  });

  // ========================================
  // STEP 1: Index Number Validation
  // ========================================
  const handleSubmitIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!indexNumber.trim()) {
      setError("Please enter your index number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lookup student by index number
      const studentData = await classAttendancePortalApi.lookupStudent(indexNumber);
      
      // Cache profile picture for future use
      if (studentData.profilePicture) {
        await cacheProfilePicture(indexNumber, studentData.profilePicture);
      }

      // Store student data
      setEnrollmentData(prev => ({
        ...prev,
        student: studentData,
      }));

      // Move to device check step
      setStep("device-check");
      checkDevice();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to lookup student. Please check your index number.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // STEP 2: Device Capability Check
  // ========================================
  const checkDevice = async () => {
    setLoading(true);
    setError(null);

    try {
      const deviceSupport = await checkDeviceSupport();
      
      setEnrollmentData(prev => ({
        ...prev,
        deviceSupport,
      }));

      // Automatically move to next step after 2 seconds
      setTimeout(() => {
        setLoading(false);
        
        if (!deviceSupport.supported || !deviceSupport.platformAuthenticator) {
          setStep("unsupported");
        } else {
          setStep("capture");
        }
      }, 2000);
    } catch (err) {
      console.error('Device check error:', err);
      setError("Failed to check device capabilities");
      setLoading(false);
    }
  };

  // ========================================
  // STEP 3: WebAuthn Registration
  // ========================================
  const handleCaptureBiometric = async () => {
    if (!enrollmentData.student) {
      setError("Student data not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Register biometric with WebAuthn
      const result = await registerBiometric(
        enrollmentData.student.id,
        indexNumber
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to capture biometric");
      }

      // Check confidence threshold
      if (result.confidence < 80) {
        setError(`Low confidence score (${result.confidence}%). Please try again for better accuracy.`);
        setLoading(false);
        return;
      }

      // Store biometric data
      setEnrollmentData(prev => ({
        ...prev,
        credentialId: result.credentialId,
        biometricHash: result.biometricHash,
        confidence: result.confidence,
      }));

      // Move to saving step
      setStep("saving");
      saveToBackend(result);
    } catch (err) {
      const error = err as Error;
      const errorMessage = getWebAuthnErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
    }
  };

  // ========================================
  // STEP 4: Save to Backend
  // ========================================
  const saveToBackend = async (biometricData: {
    credentialId: string;
    biometricHash: string;
    publicKey: string;
    deviceId: string;
    confidence: number;
  }) => {
    if (!enrollmentData.student) return;

    try {
      await classAttendancePortalApi.enrollBiometric({
        studentId: enrollmentData.student.id,
        biometricHash: biometricData.biometricHash,
        deviceId: biometricData.deviceId,
        provider: enrollmentData.deviceSupport?.type || 'unknown',
      });

      // Enrollment successful
      setEnrollmentData(prev => ({
        ...prev,
        enrolledAt: new Date().toISOString(),
      }));

      setStep("success");
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to save enrollment data");
      setLoading(false);
      setStep("capture"); // Go back to capture step
    }
  };

  // ========================================
  // Helper Functions
  // ========================================
  const getStepProgress = (): number => {
    const stepMap: Record<EnrollmentStep, number> = {
      "index": 20,
      "device-check": 40,
      "unsupported": 40,
      "capture": 60,
      "saving": 80,
      "success": 100,
    };
    return stepMap[step] || 0;
  };

  const handleBack = () => {
    if (step === "device-check") {
      setStep("index");
    } else if (step === "capture" || step === "unsupported") {
      setStep("device-check");
      setTimeout(() => checkDevice(), 100);
    }
  };

  const handleRetry = () => {
    setError(null);
    setStep("capture");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-pink-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-6 w-6 text-primary" />
              <CardTitle>Biometric Enrollment</CardTitle>
            </div>
            {step !== "index" && step !== "success" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <CardDescription>
            Enroll your fingerprint or face for fast attendance marking
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={getStepProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Step {Math.ceil(getStepProgress() / 20)} of 5
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {/* STEP 1: Index Number Input */}
          {step === "index" && (
            <form onSubmit={handleSubmitIndex} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="indexNumber">Index Number</Label>
                <Input
                  id="indexNumber"
                  type="text"
                  placeholder="e.g., 20230001"
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Enter your student index number to begin enrollment
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              {/* Benefits section */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Benefits of Biometric Enrollment
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Mark attendance in just 3 seconds
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    No need to remember passwords or QR codes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Most secure verification method (95%+ confidence)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Works offline - no internet required
                  </li>
                </ul>
              </div>
            </form>
          )}

          {/* STEP 2: Device Capability Check */}
          {step === "device-check" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Checking device compatibility...</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Verifying that your device supports biometric authentication
                </p>
              </div>
              
              {enrollmentData.student && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <img 
                    src={enrollmentData.student.profilePicture || "/placeholder-avatar.png"}
                    alt={enrollmentData.student.firstName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">
                      {enrollmentData.student.firstName} {enrollmentData.student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{indexNumber}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Unsupported Device */}
          {step === "unsupported" && (
            <div className="py-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-yellow-100 p-4">
                  <AlertCircle className="h-12 w-12 text-yellow-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Device Not Supported</h3>
                  <p className="text-muted-foreground max-w-md">
                    Your device doesn't support biometric authentication, or it's not enabled.
                  </p>
                </div>
              </div>

              {enrollmentData.deviceSupport && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Device Information:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• WebAuthn Available: {enrollmentData.deviceSupport.webAuthnAvailable ? "Yes" : "No"}</li>
                    <li>• Platform Authenticator: {enrollmentData.deviceSupport.platformAuthenticator ? "Yes" : "No"}</li>
                    <li>• Detected Type: {enrollmentData.deviceSupport.type || "Unknown"}</li>
                  </ul>
                </div>
              )}

              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alternative Methods Available:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• <strong>QR Scan:</strong> Scan QR code with your camera</li>
                    <li>• <strong>Manual Entry:</strong> Enter your index number manually</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = "/"}
                >
                  Go to Portal
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Biometric Capture */}
          {step === "capture" && (
            <div className="py-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {enrollmentData.deviceSupport && (
                  <div className="rounded-full bg-primary/10 p-6">
                    <Fingerprint className="h-12 w-12 text-primary" />
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Ready to Enroll</h3>
                  <p className="text-muted-foreground max-w-md">
                    Click the button below to start biometric enrollment. Your device will prompt you to use{" "}
                    {getBiometricName(enrollmentData.deviceSupport?.type as BiometricType)}.
                  </p>
                </div>
              </div>

              {enrollmentData.student && (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <img 
                    src={enrollmentData.student.profilePicture || "/placeholder-avatar.png"}
                    alt={enrollmentData.student.firstName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {enrollmentData.student.firstName} {enrollmentData.student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{indexNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {enrollmentData.student.program} - Level {enrollmentData.student.level}
                    </p>
                  </div>
                </div>
              )}

              {enrollmentData.deviceSupport && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-blue-900">Device Capabilities:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {getBiometricName(enrollmentData.deviceSupport.type as BiometricType)}
                    </Badge>
                    <Badge variant="secondary">
                      {enrollmentData.deviceSupport.platformAuthenticator ? "Platform Bound" : "External"}
                    </Badge>
                    <Badge variant="secondary">WebAuthn 2.0</Badge>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleCaptureBiometric}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Capturing Biometric...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Start Enrollment
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your biometric data is stored securely and only used for attendance verification
              </p>
            </div>
          )}

          {/* STEP 5: Saving to Backend */}
          {step === "saving" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Saving enrollment data...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we securely store your biometric information
                </p>
              </div>
            </div>
          )}

          {/* STEP 6: Success */}
          {step === "success" && enrollmentData.student && (
            <div className="py-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-green-100 p-6">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Enrollment Successful!</h3>
                  <p className="text-muted-foreground max-w-md">
                    You can now use {getBiometricName(enrollmentData.deviceSupport?.type as BiometricType)} to mark attendance
                  </p>
                </div>
              </div>

              {/* Student Details */}
              <div className="p-6 border rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={enrollmentData.student.profilePicture || "/placeholder-avatar.png"}
                    alt={enrollmentData.student.firstName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-lg font-semibold">
                      {enrollmentData.student.firstName} {enrollmentData.student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{indexNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {enrollmentData.student.program} - Level {enrollmentData.student.level}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Verification Method</p>
                    <p className="text-sm font-medium">
                      {getBiometricName(enrollmentData.deviceSupport?.type as BiometricType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence Score</p>
                    <p className="text-sm font-medium">{enrollmentData.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Enrolled At</p>
                    <p className="text-sm font-medium">
                      {new Date(enrollmentData.enrolledAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Device Type</p>
                    <p className="text-sm font-medium capitalize">
                      {enrollmentData.deviceSupport?.type || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-blue-900">Next Steps:</h4>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Wait for lecturer to start a class session</li>
                  <li>Open the attendance link (via SMS, email, or QR code)</li>
                  <li>Use {getBiometricName(enrollmentData.deviceSupport?.type as BiometricType)} to verify</li>
                  <li>Your attendance will be recorded instantly</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = "/my-attendance"}
                >
                  View My History
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => window.location.href = "/"}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
