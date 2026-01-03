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
        return "bg-green-100 text-green-800 border-green-200";
      case "QR_SCAN":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MANUAL":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
    <div className="space-y-6">
      {/* Success Animation Card */}
      <Card className="border-2 border-green-500 bg-linear-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <div className="relative rounded-full bg-green-100 p-6">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-green-900">
                Attendance Recorded!
              </h2>
              <p className="text-green-700">
                Your attendance has been successfully marked
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Student Info */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Student</p>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="font-semibold text-lg">{result.studentName}</p>
                <p className="text-sm text-muted-foreground">{result.indexNumber}</p>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Session</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{session.courseCode} - {session.courseName}</p>
                  <p className="text-sm text-muted-foreground">{session.lecturerName}</p>
                  <p className="text-sm text-muted-foreground">{session.venue}</p>
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
