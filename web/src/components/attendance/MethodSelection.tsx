// ========================================
// METHOD SELECTION COMPONENT
// Choose between Biometric, QR Scan, or Manual Entry
// ========================================

import { Fingerprint, QrCode, Keyboard, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BiometricStatus } from "@/hooks/useBiometricStatus";

export type VerificationMethod = "biometric" | "qr" | "manual";

interface MethodOption {
  id: VerificationMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
  available: boolean;
  recommended?: boolean;
  disabledReason?: string;
}

interface MethodSelectionProps {
  biometricStatus: BiometricStatus;
  onSelectMethod: (method: VerificationMethod) => void;
}

export function MethodSelection({ biometricStatus, onSelectMethod }: MethodSelectionProps) {
  // Determine method availability
  const methods: MethodOption[] = [
    {
      id: "biometric",
      name: "Biometric Verification",
      description: biometricStatus.enrolled 
        ? `Use ${biometricStatus.provider || "biometric"} for instant verification`
        : "Quick and secure - enroll to use this method",
      icon: <Fingerprint className="h-8 w-8" />,
      estimatedTime: "3 seconds",
      available: biometricStatus.enrolled && biometricStatus.deviceSupported,
      recommended: biometricStatus.enrolled && biometricStatus.deviceSupported,
      disabledReason: !biometricStatus.enrolled 
        ? "Not enrolled yet" 
        : !biometricStatus.deviceSupported 
        ? "Device not supported" 
        : undefined,
    },
    {
      id: "qr",
      name: "QR Code Scan",
      description: "Scan your student ID QR code with camera",
      icon: <QrCode className="h-8 w-8" />,
      estimatedTime: "10 seconds",
      available: true,
      recommended: !biometricStatus.enrolled,
    },
    {
      id: "manual",
      name: "Manual Entry",
      description: "Enter your index number manually",
      icon: <Keyboard className="h-8 w-8" />,
      estimatedTime: "20 seconds",
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Verification Method</h2>
        <p className="text-muted-foreground">
          Select how you'd like to mark your attendance
        </p>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => (
          <Card
            key={method.id}
            className={`relative transition-all ${
              method.available
                ? "cursor-pointer hover:shadow-lg hover:border-primary/50"
                : "opacity-60"
            } ${method.recommended ? "border-2 border-primary" : ""}`}
            onClick={() => method.available && onSelectMethod(method.id)}
          >
            {method.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Recommended
                </Badge>
              </div>
            )}

            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`rounded-full p-4 ${
                    method.available
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {method.icon}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{method.name}</h3>
                    {method.available ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{method.estimatedTime}</span>
                    </div>

                    {!method.available && method.disabledReason && (
                      <Badge variant="secondary" className="text-xs">
                        {method.disabledReason}
                      </Badge>
                    )}
                  </div>

                  {method.available && (
                    <Button
                      className="w-full mt-4"
                      variant={method.recommended ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMethod(method.id);
                      }}
                    >
                      Use This Method
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Need help? Contact your lecturer or IT support
        </p>
      </div>
    </div>
  );
}
