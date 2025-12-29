import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Fingerprint, Smartphone, CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

interface EnrollmentData {
  token: string;
  biometricTemplate: string | object;
  biometricProvider: string;
  biometricDeviceId: string;
}

export default function BiometricEnrollmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [enrollmentStatus, setEnrollmentStatus] = useState<"idle" | "enrolling" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState<boolean | null>(null);
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);

  useEffect(() => {
    // Check if we're in a secure context (required for WebAuthn)
    // Allow localhost for development even on HTTP
    const secure = window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.startsWith('192.168.') ||
                   window.location.hostname.startsWith('10.');
    setIsSecureContext(secure);

    // More comprehensive WebAuthn support check
    const checkWebAuthnSupport = async () => {
      try {
        // Check if WebAuthn API is available
        if (!window.PublicKeyCredential) {
          setIsWebAuthnSupported(false);
          return;
        }

        // Check if the browser can actually create credentials
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsWebAuthnSupported(available);
      } catch (error) {
        console.warn('WebAuthn availability check failed:', error);
        // Fallback: assume supported if API exists
        setIsWebAuthnSupported(!!window.PublicKeyCredential);
      }
    };

    checkWebAuthnSupport();

    // Validate token
    if (!token) {
      setErrorMessage("Invalid enrollment link. No token provided.");
      setEnrollmentStatus("error");
    }
  }, [token]);

  // Check for development mode (localhost and no biometric support)
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       /^192\.168\./.test(window.location.hostname) ||
                       /^10\./.test(window.location.hostname);

    if (isLocalhost && !window.PublicKeyCredential) {
      setIsDevelopmentMode(true);
    }
  }, []);

  const enrollMutation = useMutation({
    mutationFn: async (data: EnrollmentData) => {
      console.log("Making enrollment request to:", "/api/students/enroll-biometric");
      console.log("Request data:", data);

      const response = await fetch("/api/students/enroll-biometric", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = "Enrollment failed";
        try {
          const contentType = response.headers.get("content-type");
          console.log("Error response content-type:", contentType);

          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            console.log("Error response JSON:", error);
            errorMessage = error.error || error.message || errorMessage;
          } else {
            // Try to get text content if not JSON
            const text = await response.text();
            console.log("Error response text:", text);
            if (text) {
              errorMessage = text;
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse error response:", parseError);
          // If parsing fails, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // For successful responses, try to parse JSON if available
      try {
        const contentType = response.headers.get("content-type");
        console.log("Success response content-type:", contentType);

        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          console.log("Success response JSON:", result);
          return result;
        } else {
          // Return success indicator for non-JSON responses
          console.log("Non-JSON success response");
          return { success: true };
        }
      } catch (parseError) {
        console.warn("Failed to parse success response:", parseError);
        return { success: true };
      }
    },
    onSuccess: () => {
      setEnrollmentStatus("success");
      toast.success("Biometric enrollment completed successfully!");
      setTimeout(() => {
        navigate("/login"); // Redirect to login or success page
      }, 3000);
    },
    onError: (error: Error) => {
      setEnrollmentStatus("error");
      setErrorMessage(error.message);
      toast.error(error.message);
    },
  });

  const handleWebAuthnEnrollment = async () => {
    if (!token) return;

    setEnrollmentStatus("enrolling");

    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // For localhost development, try a simpler approach
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

      let credential: PublicKeyCredential;

      if (isLocalhost && window.location.protocol === 'http:') {
        // Try with relaxed requirements for localhost
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const createCredentialOptions: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: {
            name: "Exam Script Tracking System",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: "student",
            displayName: "Student Biometric Enrollment",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred", // Changed from "required" to "preferred"
          },
          timeout: 60000,
        };

        credential = await navigator.credentials.create({
          publicKey: createCredentialOptions,
        }) as PublicKeyCredential;
      } else {
        // Standard WebAuthn flow for production/HTTPS
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const createCredentialOptions: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: {
            name: "Exam Script Tracking System",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16), // Random user ID for enrollment
            name: "student",
            displayName: "Student Biometric Enrollment",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Prefer platform authenticator (fingerprint/face)
            userVerification: "required",
          },
          timeout: 60000,
        };

        credential = await navigator.credentials.create({
          publicKey: createCredentialOptions,
        }) as PublicKeyCredential;
      }

      if (!credential) {
        throw new Error("Failed to create biometric credential");
      }

      // Extract credential data
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const response = credential.response as AuthenticatorAttestationResponse;
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON)));
      const attestationObject = btoa(String.fromCharCode(...new Uint8Array(response.attestationObject)));

      // Create enrollment data
      const enrollmentData: EnrollmentData = {
        token,
        biometricTemplate: {
          credentialId,
          clientDataJSON,
          attestationObject,
        },
        biometricProvider: "WEBAUTHN",
        biometricDeviceId: navigator.userAgent,
      };

      // Submit enrollment
      enrollMutation.mutate(enrollmentData);

    } catch (error) {
      console.error("WebAuthn enrollment error:", error);
      setEnrollmentStatus("error");
      
      // Provide more helpful error messages
      let userFriendlyMessage = "Biometric enrollment failed. Please try again.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          userFriendlyMessage = "Biometric authentication was cancelled or denied. Please try again and allow access to your biometric data.";
        } else if (error.name === 'NotSupportedError') {
          userFriendlyMessage = "Your device doesn't support the required biometric authentication method.";
        } else if (error.name === 'SecurityError') {
          userFriendlyMessage = `Biometric authentication requires a secure connection. For local testing, please access via localhost instead of ${window.location.hostname}.`;
        } else if (error.message.includes('timeout')) {
          userFriendlyMessage = "Biometric authentication timed out. Please try again.";
        } else {
          userFriendlyMessage = error.message;
        }
      }
      
      setErrorMessage(userFriendlyMessage);
    }
  };

  const handleDevelopmentEnrollment = async () => {
    if (!token) return;

    setEnrollmentStatus("enrolling");

    try {
      // Simulate biometric enrollment for development
      const mockBiometricData = {
        credentialId: btoa("mock-credential-" + Date.now()),
        clientDataJSON: btoa(JSON.stringify({
          type: "webauthn.create",
          challenge: btoa("mock-challenge"),
          origin: window.location.origin,
          crossOrigin: false
        })),
        attestationObject: btoa("mock-attestation-object")
      };

      const enrollmentData: EnrollmentData = {
        token,
        biometricTemplate: mockBiometricData, // Send as object, not JSON string
        biometricProvider: "WEBAUTHN",
        biometricDeviceId: "Development-Mock-Device",
      };

      // Submit enrollment
      enrollMutation.mutate(enrollmentData);

    } catch (error) {
      console.error("Development enrollment error:", error);
      setEnrollmentStatus("error");
      setErrorMessage("Development enrollment failed. Please try again.");
    }
  };

  const handleManualEnrollment = () => {
    // For manual enrollment, we'd need to collect biometric data differently
    // This could be a fallback for browsers that don't support WebAuthn
    setErrorMessage("Manual biometric enrollment is not yet implemented. Please use a modern browser with biometric support.");
    setEnrollmentStatus("error");
  };

  if (enrollmentStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-700">Enrollment Successful!</CardTitle>
            <CardDescription>
              Your biometric data has been enrolled successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You will be redirected to the login page shortly.
            </p>
            <Button onClick={() => navigate("/login")} variant="outline">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Fingerprint className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <CardTitle>Biometric Enrollment</CardTitle>
          <CardDescription>
            Enroll your biometric data for secure attendance verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Security Context Warning */}
          {!isSecureContext && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> Biometric enrollment requires a secure connection (HTTPS). 
                If you're testing locally, this is normal. In production, ensure the site uses HTTPS.
              </AlertDescription>
            </Alert>
          )}

          {enrollmentStatus === "idle" && (
            <>
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Click the button below to enroll your biometric data using your device's fingerprint or face recognition.
                </p>

                {isWebAuthnSupported === null ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                ) : isWebAuthnSupported ? (
                  <Button
                    onClick={handleWebAuthnEnrollment}
                    className="w-full"
                    size="lg"
                    disabled={enrollMutation.isPending}
                  >
                    <Fingerprint className="h-5 w-5 mr-2" />
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Biometric"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <Smartphone className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Biometric Support Check:</strong><br/>
                        • Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}<br/>
                        • Platform: {navigator.platform}<br/>
                        • Secure Context: {isSecureContext ? 'Yes' : 'No'}<br/>
                        • WebAuthn API: {window.PublicKeyCredential ? 'Available' : 'Not Available'}<br/>
                        <br/>
                        If you have fingerprint/face unlock enabled on your device, try:
                        <br/>• Refreshing the page
                        <br/>• Using Chrome on Android/iOS
                        <br/>• Ensuring biometric unlock is set up in your device settings
                      </AlertDescription>
                    </Alert>
                    
                    {isDevelopmentMode && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Development Mode:</strong> WebAuthn is not available in this environment. 
                          You can use the development enrollment button below to test the enrollment flow.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {isDevelopmentMode ? (
                      <Button
                        onClick={handleDevelopmentEnrollment}
                        className="w-full"
                        size="lg"
                        disabled={enrollMutation.isPending}
                      >
                        <Fingerprint className="h-5 w-5 mr-2" />
                        {enrollMutation.isPending ? "Enrolling..." : "Development Enrollment"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleManualEnrollment}
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        Manual Enrollment (Coming Soon)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {enrollmentStatus === "enrolling" && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-600">
                Please complete the biometric authentication on your device...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}