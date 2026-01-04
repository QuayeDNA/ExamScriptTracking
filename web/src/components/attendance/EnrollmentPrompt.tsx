// ========================================
// ENROLLMENT PROMPT COMPONENT
// Encourage students to enroll in biometric system
// ========================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Fingerprint, Zap, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getBiometricName, type BiometricType } from "@/utils/biometric";
import { setEnrollmentPromptDismissed } from "@/utils/enrollmentPromptStorage";

interface EnrollmentPromptProps {
  deviceType: string;
  onDismiss: () => void;
}

export function EnrollmentPrompt({ deviceType, onDismiss }: EnrollmentPromptProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDismiss = () => {
    if (dontShowAgain) {
      setEnrollmentPromptDismissed();
    }
    onDismiss();
  };

  const biometricName = getBiometricName(deviceType as BiometricType);

  return (
    <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/5 dark:to-purple-950">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-primary/10 p-2 sm:p-3 shrink-0">
              <Fingerprint className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-xl">Enable Fast Attendance</CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                Your device supports {biometricName}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="shrink-0 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Benefits Grid */}
        <div className="grid gap-2 sm:gap-3">
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-card rounded-lg border border-border">
            <div className="rounded-full bg-success/10 p-1.5 sm:p-2 shrink-0">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-xs sm:text-sm">Lightning Fast</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Mark attendance in 3 seconds
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-card rounded-lg border border-border">
            <div className="rounded-full bg-primary/10 p-1.5 sm:p-2 shrink-0">
              <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-xs sm:text-sm">Most Secure</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                95%+ confidence score
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-card rounded-lg border border-border">
            <div className="rounded-full bg-accent p-1.5 sm:p-2 shrink-0">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-accent-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-xs sm:text-sm">Always Available</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Works offline
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col gap-2 sm:gap-3 pt-2">
          <Link to="/enroll/biometric" className="w-full">
            <Button size="default" className="w-full text-sm sm:text-base">
              <Fingerprint className="mr-2 h-4 w-4" />
              Enroll Now (2 mins)
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <Label
                htmlFor="dontShowAgain"
                className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
              >
                Don't show again
              </Label>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs sm:text-sm self-end sm:self-auto"
            >
              Maybe Later
            </Button>
          </div>
        </div>

        {/* Trust Badge */}
        <p className="text-xs text-center text-muted-foreground border-t pt-2 sm:pt-3">
          Your biometric data is stored securely
        </p>
      </CardContent>
    </Card>
  );
}
