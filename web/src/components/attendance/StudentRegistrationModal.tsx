/**
 * Student Registration Modal
 * First-time setup - collects student identity and binds to device
 */

import { useState } from "react";
import { Loader2, UserPlus, AlertCircle, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerStudent, type StudentIdentity } from "@/utils/studentIdentity";

interface StudentRegistrationModalProps {
  open: boolean;
  onComplete: (identity: StudentIdentity) => void;
}

export function StudentRegistrationModal({ open, onComplete }: StudentRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    indexNumber: "",
    firstName: "",
    lastName: "",
    program: "",
    level: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.indexNumber.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Register student on this device
      const identity = registerStudent({
        indexNumber: formData.indexNumber.toUpperCase(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        program: formData.program || undefined,
        level: formData.level ? parseInt(formData.level) : undefined,
      });

      // Success
      onComplete(identity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Welcome! 👋</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Let's set up your attendance profile
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>One device, one student:</strong> This device will be registered to your index number.
              Other students won't be able to use it for attendance.
            </AlertDescription>
          </Alert>

          {/* Index Number */}
          <div className="space-y-2">
            <Label htmlFor="indexNumber">
              Student Index Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="indexNumber"
              type="text"
              placeholder="e.g., 12345678"
              value={formData.indexNumber}
              onChange={(e) => setFormData({ ...formData, indexNumber: e.target.value.toUpperCase() })}
              disabled={loading}
              required
            />
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="e.g., John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="e.g., Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          {/* Program (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="program">Program (Optional)</Label>
            <Input
              id="program"
              type="text"
              placeholder="e.g., BSc Computer Science"
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Level (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="level">Level (Optional)</Label>
            <Input
              id="level"
              type="number"
              placeholder="e.g., 300"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Register & Continue
              </>
            )}
          </Button>

          {/* Privacy Notice */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Your information is stored locally on this device only.
            <br />
            No data is shared with servers without your action.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
