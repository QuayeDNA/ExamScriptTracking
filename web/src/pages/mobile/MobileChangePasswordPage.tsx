import { useState } from "react";
import { useFirstTimePasswordChange } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Eye, EyeOff } from "lucide-react";

export const MobileChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const {
    mutate: changePassword,
    isPending,
    error,
  } = useFirstTimePasswordChange();

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setValidationErrors((prev) => ({
      ...prev,
      newPassword: value ? validatePassword(value) : "",
    }));
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setValidationErrors((prev) => ({
      ...prev,
      confirmPassword:
        value && value !== newPassword ? "Passwords do not match" : "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    changePassword({ newPassword });
  };

  return (
    <>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Change Your Password
          </h1>
          <p className="text-muted-foreground">
            Set a new secure password to continue
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg text-foreground">
              First Time Setup
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Info Alert */}
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must change your temporary password before continuing to use
                the system.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error
                    ? error.message
                    : "Failed to change password. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Input */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    required
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    disabled={isPending}
                    className={`pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
                      validationErrors.newPassword ? "border-destructive" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {validationErrors.newPassword && (
                  <p className="text-sm text-destructive">
                    {validationErrors.newPassword}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and
                  numbers
                </p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    required
                    value={confirmPassword}
                    onChange={(e) =>
                      handleConfirmPasswordChange(e.target.value)
                    }
                    disabled={isPending}
                    className={`pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
                      validationErrors.confirmPassword
                        ? "border-destructive"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isPending ||
                  !newPassword ||
                  !confirmPassword ||
                  !!validationErrors.newPassword ||
                  !!validationErrors.confirmPassword
                }
              >
                {isPending ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
