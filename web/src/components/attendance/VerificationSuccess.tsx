// ========================================
// VERIFICATION SUCCESS COMPONENT
// Show success after marking attendance
// ========================================

import { useNavigate } from "react-router-dom";
import { CheckCircle2, Calendar, Clock, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AttendanceResult } from "./BiometricVerification";
import type { SessionInfo } from "@/api/classAttendancePortal";

interface VerificationSuccessProps {
  result: AttendanceResult;
  session: SessionInfo;
}

export function VerificationSuccess({ result, session }: VerificationSuccessProps) {
  const navigate = useNavigate();

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "BIOMETRIC":
        return "bg-success/10 text-success border-success/20";
      case "QR_SCAN":
        return "bg-primary/10 text-primary border-primary/20";
      case "MANUAL":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case "BIOMETRIC":
        return "Biometric Verification";
      case "QR_SCAN":
        return "QR Code Scan";
      case "MANUAL":
        return "Manual Entry";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Success Animation Card */}
      <Card className="border-2 border-success bg-success/5">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 py-4 sm:py-6">
            <div className="relative">
              <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
              <div className="relative rounded-full bg-success/10 p-4 sm:p-6">
                <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-success" />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2 px-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Attendance Recorded!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Successfully marked
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Card */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Student Info */}
          <div className="space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Student</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-2 w-2 rounded-full bg-success shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-base sm:text-lg truncate">{result.studentName}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{result.indexNumber}</p>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Session</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base break-words">{session.courseCode} - {session.courseName}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.lecturerName}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.venue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Verification</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Method</p>
                </div>
                <Badge className={getMethodBadgeColor(result.verificationMethod)}>
                  {getMethodName(result.verificationMethod)}
                </Badge>
              </div>

              {result.confidence && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Confidence</p>
                  </div>
                  <p className="font-semibold text-green-600">{result.confidence}%</p>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
                <p className="font-medium text-sm">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate("/my-attendance")}
        >
          View My History
        </Button>
        <Button
          className="flex-1"
          onClick={() => navigate("/")}
        >
          Done
        </Button>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          Your attendance record has been saved to your local device and uploaded to the server.
          You can view your full attendance history anytime from "My Attendance".
        </p>
      </div>
    </div>
  );
}
