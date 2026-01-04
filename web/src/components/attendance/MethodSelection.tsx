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
  console.log('[MethodSelection] Biometric status:', biometricStatus);
  
  // Determine method availability
  const methods: MethodOption[] = [
    {
      id: "biometric",
      name: "Biometric Verification",
      description: biometricStatus.deviceSupported
        ? biometricStatus.enrolled 
          ? "Use fingerprint or face for instant verification"
          : "Enroll your biometrics during attendance"
        : "Your device doesn't support biometric authentication",
      icon: <Fingerprint className="h-10 w-10 sm:h-12 sm:w-12" />,
      estimatedTime: biometricStatus.enrolled ? "3 seconds" : "30 seconds",
      available: biometricStatus.deviceSupported,
      recommended: biometricStatus.enrolled && biometricStatus.deviceSupported,
      disabledReason: !biometricStatus.deviceSupported 
        ? "Device not supported" 
        : undefined,
    },
    {
      id: "qr",
      name: "QR Code Scan",
      description: "Scan your student ID QR code with your camera",
      icon: <QrCode className="h-10 w-10 sm:h-12 sm:w-12" />,
      estimatedTime: "10 seconds",
      available: true,
      recommended: !biometricStatus.enrolled,
    },
    {
      id: "manual",
      name: "Manual Entry",
      description: "Enter your index number manually",
      icon: <Keyboard className="h-10 w-10 sm:h-12 sm:w-12" />,
      estimatedTime: "20 seconds",
      available: true,
    },
  ];

  // Simple solid colors for each method
  const cardColors = {
    biometric: "#10b981", // emerald-500
    qr: "#3b82f6",        // blue-500
    manual: "#8b5cf6",    // violet-500
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Choose Verification Method</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Select how you'd like to mark your attendance
        </p>
      </div>

      <div className="grid gap-4 max-w-3xl mx-auto">
        {methods.map((method) => (
          <Card
            key={method.id}
            className={`relative overflow-hidden border-0 shadow-lg ${
              method.available
                ? "cursor-pointer active:scale-[0.98] transition-transform"
                : "opacity-60 cursor-not-allowed"
            }`}
            style={{
              backgroundColor: method.available ? cardColors[method.id] : '#6b7280'
            }}
            onClick={() => method.available && onSelectMethod(method.id)}
          >
            {method.recommended && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold">
                  Recommended
                </Badge>
              </div>
            )}

            <CardContent className="p-5 sm:p-6">
              {/* Icon */}
              <div className="mb-4">
                <div className="text-white/90">
                  {method.icon}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {method.name}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                    {method.description}
                  </p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{method.estimatedTime}</span>
                  </div>
                  
                  {method.available && (
                    <div className="flex items-center gap-1.5 text-white/90">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Available</span>
                    </div>
                  )}

                  {!method.available && method.disabledReason && (
                    <div className="flex items-center gap-1.5 text-white/90">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{method.disabledReason}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {method.available && (
                  <div className="pt-3 border-t border-white/20">
                    <Button
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm font-semibold"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMethod(method.id);
                      }}
                    >
                      Select Method
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help text */}
      {!biometricStatus.deviceSupported && (
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Biometric not available? Use QR Code or Manual Entry
          </p>
        </div>
      )}
    </div>
  );
}
