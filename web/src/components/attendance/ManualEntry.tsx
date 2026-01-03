// ========================================
// MANUAL ENTRY COMPONENT
// Mark attendance by entering index number manually
// ========================================

import { useState } from "react";
import { Loader2, AlertCircle, Keyboard, ArrowLeft, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classAttendancePortalApi, type SessionInfo, type StudentLookupResponse } from "@/api/classAttendancePortal";
import type { AttendanceResult } from "./BiometricVerification";

interface ManualEntryProps {
  session: SessionInfo;
  onSuccess: (data: AttendanceResult) => void;
  onBack: () => void;
}

export function ManualEntry({ session, onSuccess, onBack }: ManualEntryProps) {
  const [indexNumber, setIndexNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "confirm" | "recording">("input");
  const [student, setStudent] = useState<StudentLookupResponse | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!indexNumber.trim()) {
      setError("Please enter your index number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lookup student
      const studentData = await classAttendancePortalApi.lookupStudent(indexNumber);
      setStudent(studentData);
      setStep("confirm");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Student not found. Please check your index number.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!student) return;

    setLoading(true);
    setError(null);
    setStep("recording");

    try {
      const response = await classAttendancePortalApi.recordManual({
        recordId: session.id,
        indexNumber,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to record attendance");
      }

      // Success
      onSuccess({
        success: true,
        studentId: response.attendance.studentId,
        studentName: response.attendance.studentName,
        indexNumber: student.indexNumber,
        verificationMethod: "MANUAL",
        timestamp: response.attendance.scanTime,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to record attendance");
      setLoading(false);
      setStep("confirm");
    }
  };

  const handleEdit = () => {
    setStep("input");
    setStudent(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Keyboard className="h-6 w-6 text-primary" />
              <CardTitle>Manual Entry</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardDescription>
            Enter your index number to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Step */}
          {step === "input" && (
            <>
              <form onSubmit={handleLookup} className="space-y-4">
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
                    autoFocus
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your full student index number
                  </p>
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
                      Looking up...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>

              {/* Session Info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Session Details:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• {session.courseCode} - {session.courseName}</p>
                  <p>• {session.lecturerName}</p>
                  <p>• {session.venue}</p>
                </div>
              </div>
            </>
          )}

          {/* Confirmation Step */}
          {step === "confirm" && student && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <UserCheck className="h-5 w-5" />
                  <p className="font-medium">Student Found</p>
                </div>

                {/* Student Card */}
                <div className="p-6 border-2 border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-4">
                    <img
                      src={student.profilePicture || "/placeholder-avatar.png"}
                      alt={student.firstName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                    <div className="flex-1">
                      <p className="text-xl font-semibold">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.indexNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.program} - Level {student.level}
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please confirm this is you before marking attendance
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleEdit}
                    disabled={loading}
                  >
                    Not Me
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Confirm & Mark Attendance"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Recording Step */}
          {step === "recording" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Recording attendance...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we save your attendance
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      {step === "input" && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> Manual entry is slower than biometric or QR scan. Consider
            enrolling in biometric verification for faster attendance marking.
          </p>
        </div>
      )}
    </div>
  );
}
