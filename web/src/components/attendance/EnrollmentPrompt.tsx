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
    <Card className="border-2 border-primary/20 shadow-lg bg-linear-to-br from-primary/5 to-purple-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Enable Fast Attendance</CardTitle>
              <CardDescription className="mt-1">
                Your device supports {biometricName} - enroll now for instant check-in
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefits Grid */}
        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
            <div className="rounded-full bg-green-100 p-2">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Lightning Fast</p>
              <p className="text-sm text-muted-foreground">
                Mark attendance in just 3 seconds - no typing required
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
            <div className="rounded-full bg-blue-100 p-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Most Secure</p>
              <p className="text-sm text-muted-foreground">
                95%+ confidence score - the most reliable verification method
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
            <div className="rounded-full bg-purple-100 p-2">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Always Available</p>
              <p className="text-sm text-muted-foreground">
                Works offline - no internet connection needed
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col gap-3 pt-2">
          <Link to="/enroll/biometric" className="w-full">
            <Button size="lg" className="w-full">
              <Fingerprint className="mr-2 h-4 w-4" />
              Enroll Now (Takes 2 minutes)
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <Label
                htmlFor="dontShowAgain"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Don't show this again
              </Label>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
          </div>
        </div>

        {/* Trust Badge */}
        <p className="text-xs text-center text-muted-foreground border-t pt-3">
          Your biometric data is stored securely and only used for attendance verification
        </p>
      </CardContent>
    </Card>
  );
}
