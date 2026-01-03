import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { classAttendancePortalApi, type SessionInfo } from "@/api/classAttendancePortal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { getAllRecords } from "@/utils/attendanceStorage";

export function AttendancePortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid attendance link");
      setLoading(false);
      return;
    }

    validateLink();
  }, [token]);

  const validateLink = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await classAttendancePortalApi.validateLink(token!);

      if (!response.valid || !response.session) {
        setError(response.error || "This attendance link is invalid or has expired");
        return;
      }

      setSession(response.session);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to validate attendance link"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToMethods = () => {
    // TODO: Navigate to method selection screen
    console.log("Proceed to method selection");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Validating attendance link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    const hasHistory = getAllRecords().length > 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Invalid Link</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>This link may have expired or is no longer valid.</p>
                <p>Please:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check that you scanned the correct QR code</li>
                  <li>Ask your lecturer for a new attendance link</li>
                  <li>Ensure the recording session is still active</li>
                </ul>
              </div>

              <Button
                onClick={() => navigate("/my-attendance")}
                variant="outline"
                className="w-full"
              >
                {hasHistory ? "View My Attendance History" : "Go Back"}
              </Button>
            </CardContent>
          </Card>

          {/* Show history even when link is invalid */}
          {hasHistory && (
            <div>
              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">
                  📜 Your personal attendance history is stored on this device
                </p>
              </div>
              <AttendanceHistory maxRecords={5} showHeader={true} />
              {getAllRecords().length > 5 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => navigate("/my-attendance")}
                    variant="link"
                  >
                    View All {getAllRecords().length} Records →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success - Show session info
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>Mark Attendance</CardTitle>
            </div>
            <CardDescription>
              Session validated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Info */}
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Course</div>
                  <div className="font-semibold text-lg">
                    {session.courseCode} - {session.courseName}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Lecturer</div>
                    <div className="text-sm font-medium">{session.lecturerName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Venue</div>
                    <div className="text-sm font-medium">{session.venue}</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Time</div>
                  <div className="text-sm font-medium">
                    {new Date(session.startTime).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Recording Active</span>
              </div>
            </div>

            {/* Action button */}
            <Button
              onClick={handleProceedToMethods}
              size="lg"
              className="w-full"
            >
              Choose Verification Method
            </Button>

            {/* Help text */}
            <p className="text-xs text-center text-muted-foreground">
              You'll be asked to choose how to verify your identity:
              <br />
              Biometric, QR Code, or Index Number
            </p>
          </CardContent>
        </Card>

        {/* Show attendance history below current session */}
        {getAllRecords().length > 0 && (
          <div>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                📜 Your recent attendance history
              </p>
            </div>
            <AttendanceHistory compact maxRecords={3} showHeader={false} />
            {getAllRecords().length > 3 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => navigate("/my-attendance")}
                  variant="link"
                >
                  View All {getAllRecords().length} Records →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
