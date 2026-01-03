import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Fingerprint } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BiometricEnrollment() {
  const [indexNumber, setIndexNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"index" | "checking" | "enroll" | "success">("index");

  const handleSubmitIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!indexNumber.trim()) {
      setError("Please enter your index number");
      return;
    }

    setLoading(true);
    setError(null);

    // TODO: Implement student lookup and device check
    // For now, just move to checking step
    setTimeout(() => {
      setStep("checking");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Fingerprint className="h-6 w-6 text-primary" />
            <CardTitle>Biometric Enrollment</CardTitle>
          </div>
          <CardDescription>
            Enroll your fingerprint or face for fast attendance marking
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                />
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
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              {/* Benefits section */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="text-sm font-semibold">Benefits of Enrollment:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Mark attendance in just 3 seconds
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    No need to remember passwords
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Most secure verification method
                  </li>
                </ul>
              </div>
            </form>
          )}

          {step === "checking" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Checking device compatibility...</p>
              <p className="text-sm text-muted-foreground text-center">
                Verifying that your device supports biometric authentication
              </p>
            </div>
          )}

          {/* TODO: Add enrollment flow steps (device check, WebAuthn capture, success) */}
        </CardContent>
      </Card>
    </div>
  );
}
