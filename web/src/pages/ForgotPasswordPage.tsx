import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api/auth";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.requestPasswordReset({ email });

      setResetToken(response.resetToken);
      setStep("reset");
      toast.success("Reset Token Generated", {
        description: `Token: ${response.resetToken}\n\nIn production, this would be sent via in-app notification.`,
        duration: 10000,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPasswordWithToken({
        token: resetToken,
        newPassword,
      });

      toast.success("Password Reset Successful", {
        description: "You can now login with your new password.",
      });
      navigate("/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === "request" ? "Reset Password" : "Enter New Password"}
      description={
        step === "request"
          ? "Enter your email to receive a password reset token"
          : "Enter your new password to complete the reset"
      }
    >
      {step === "request" ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            loading={isLoading}
          >
            Request Password Reset
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Password reset token generated successfully. Enter your new
              password below.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="resetToken">Reset Token</Label>
            <Input
              id="resetToken"
              type="text"
              placeholder="Enter reset token"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              disabled={isLoading}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            loading={isLoading}
          >
            Reset Password
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("request");
                setError("");
              }}
            >
              Request New Token
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
