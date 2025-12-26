import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Camera, RotateCcw } from "lucide-react";
import { useRegisterWithQR } from "@/hooks/useAuth";

interface QRData {
  type: "REGISTRATION";
  token: string;
  department: string;
  expiresAt: string;
}

export const MobileQRRegistrationPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
  });
  const [scanError, setScanError] = useState("");
  const [scanner, setScanner] = useState<QrScanner | null>(null);

  const { mutate: registerWithQR, isPending, error } = useRegisterWithQR();

  const requestCameraPermission = async () => {
    setHasPermission(null); // Reset to show loading state
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
    } catch (error) {
      console.error("Camera permission request failed:", error);
      setHasPermission(false);
    }
  };

  const handleScan = (data: string) => {
    setScanned(true);
    setScanError(""); // Clear any previous errors
    try {
      const parsedData: QRData = JSON.parse(data);

      if (parsedData.type !== "REGISTRATION") {
        setScanError("This QR code is not for registration.");
        setScanned(false);
        return;
      }

      // Check if department is provided
      if (!parsedData.department) {
        setScanError("This QR code is not configured with a department.");
        setScanned(false);
        return;
      }

      // Check if expired
      if (new Date() > new Date(parsedData.expiresAt)) {
        setScanError("This QR code has expired.");
        setScanned(false);
        return;
      }

      setQrData(parsedData);
      setShowForm(true);
    } catch (error) {
      console.error("QR scan error:", error);
      setScanError("Unable to read QR code data.");
      setScanned(false);
    }
  };

  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // First check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          setHasPermission(false);
          return;
        }

        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        // Stop the stream immediately after getting permission
        stream.getTracks().forEach((track) => track.stop());

        setHasPermission(true);
      } catch (error) {
        console.error("Camera permission error:", error);
        setHasPermission(false);
      }
    };

    const initScanner = async () => {
      try {
        // Wait for permission check first
        if (hasPermission === null) {
          await checkCameraPermission();
          return; // Exit and let the useEffect re-run when hasPermission changes
        }

        if (hasPermission && videoRef.current) {
          const qrScanner = new QrScanner(
            videoRef.current,
            (result) => handleScan(result.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              returnDetailedScanResult: true,
            }
          );

          setScanner(qrScanner);

          // Set up error handling - wrap start in try-catch
          try {
            await qrScanner.start();
          } catch (error) {
            console.warn("QR scanner start error:", error);
            setScanError(
              "Failed to start camera. Please check camera permissions."
            );
          }
        }
      } catch (error) {
        console.error("Error initializing scanner:", error);
        setHasPermission(false);
        setScanError("Failed to initialize camera. Please check permissions.");
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.destroy();
        setScanner(null);
      }
    };
  }, [hasPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.destroy();
        setScanner(null);
      }
    };
  }, [scanner]);

  const handleRegister = () => {
    if (!qrData) {
      setScanError("No QR code data available. Please scan a QR code first.");
      return;
    }

    // Validation
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim() ||
      !formData.password.trim()
    ) {
      setScanError("All fields are required.");
      return;
    }

    if (!/^(\+233|0)[0-9]{9}$/.test(formData.phone)) {
      setScanError(
        "Please enter a valid Ghana phone number (0241234567 or +233241234567)."
      );
      return;
    }

    if (formData.password.length < 8) {
      setScanError("Password must be at least 8 characters long.");
      return;
    }

    // Clear any previous errors
    setScanError("");

    registerWithQR(
      {
        qrToken: qrData.token,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      },
      {
        onSuccess: () => {
          // Navigation is handled in the hook
        },
        onError: (error) => {
          console.error("Registration error:", error);
          setScanError(
            error instanceof Error
              ? error.message
              : "Registration failed. Please try again."
          );
        },
      }
    );
  };

  const resetScanner = async () => {
    setScanned(false);
    setQrData(null);
    setShowForm(false);
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      password: "",
    });
    setScanError("");

    // Restart scanner if it exists
    if (scanner) {
      try {
        await scanner.start();
      } catch (error) {
        console.error("Error restarting scanner:", error);
        setScanError("Failed to restart camera. Please refresh the page.");
      }
    }
  };

  if (hasPermission === null) {
    return (
      <>
        <div className="w-full max-w-md">
          <Card className="w-full bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">
                Requesting camera permission...
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (hasPermission === false) {
    return (
      <>
        <div className="w-full max-w-md">
          <Card className="w-full max-w-md bg-card">
            <CardHeader>
              <CardTitle className="text-center text-foreground">
                QR Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">
                Camera permission is required to scan QR codes.
              </p>
              <p className="text-muted-foreground mb-6">
                Please enable camera access in your browser settings and try
                again.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={requestCameraPermission} variant="default">
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate("/mobile/login")}
                  variant="outline"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (showForm) {
    return (
      <>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Complete Registration
            </h1>
            <p className="text-muted-foreground">Enter your details</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error instanceof Error
                      ? error.message
                      : "Registration failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              {scanError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}

              {qrData && (
                <Alert>
                  <AlertDescription>
                    You will be registered to the{" "}
                    <strong>{qrData.department}</strong> department.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    disabled={isPending}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    disabled={isPending}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0241234567 or +233241234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    disabled={isPending}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password (min 8 characters)"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    disabled={isPending}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>

                <Button
                  onClick={handleRegister}
                  className="w-full"
                  disabled={isPending || !qrData}
                >
                  {isPending ? "Registering..." : "Complete Registration"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resetScanner}
                    className="text-sm text-primary hover:text-primary/80 underline"
                    disabled={isPending}
                  >
                    Scan Different QR Code
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Camera className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            QR Registration
          </h1>
          <p className="text-muted-foreground">Scan the registration QR code</p>
        </div>

        <Card className="shadow-xl border-0 bg-card">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center mb-6">
              Point your camera at the registration QR code provided by your
              administrator.
            </p>

            {scanError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}

            <div className="relative mb-6">
              <div className="aspect-square bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              </div>
              {scanned && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                  <p className="text-white text-lg font-bold">
                    QR Code Detected!
                  </p>
                </div>
              )}
            </div>

            {scanned && (
              <Button
                onClick={resetScanner}
                variant="outline"
                className="w-full mb-4"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Scan Again
              </Button>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/mobile/login")}
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
