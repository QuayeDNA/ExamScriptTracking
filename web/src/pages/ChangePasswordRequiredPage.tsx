import { useState } from "react";
import { useFirstTimePasswordChange } from "@/hooks/useAuth";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck } from "lucide-react";

export const ChangePasswordRequiredPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { mutate: changePassword, isPending } = useFirstTimePasswordChange();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    changePassword({ newPassword });
  };

  return (
    <AuthLayout
      title="Change Your Password"
      description="You must change your temporary password before continuing"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            For your security, please create a new strong password.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending}
            minLength={8}
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
            disabled={isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          loading={isPending}
        >
          Change Password
        </Button>
      </form>
    </AuthLayout>
  );
};
