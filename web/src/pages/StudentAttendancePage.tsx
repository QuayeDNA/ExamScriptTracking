/**
 * Student Self-Service Attendance Page
 * Allows students to mark attendance via shared link
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

interface LinkInfo {
  courseCode: string;
  courseName?: string;
  lecturerName?: string;
  expiresAt: string;
  maxUses?: number;
  usesCount: number;
}

export function StudentAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const linkToken = searchParams.get("token");

  const [indexNumber, setIndexNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [linkValid, setLinkValid] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!linkToken) {
      toast.error("Invalid link - no token provided");
      setVerifying(false);
      setLinkValid(false);
      return;
    }

    // Verify link validity
    const verifyLinkData = async () => {
      setVerifying(true);
      try {
        // TODO: Replace with actual API call when backend endpoint is ready
        // const response = await fetch(`${process.env.VITE_API_URL}/api/class-attendance/links/verify?token=${linkToken}`);
        // const data = await response.json();
        
        // Placeholder response for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData: LinkInfo = {
          courseCode: "CS101",
          courseName: "Data Structures",
          lecturerName: "Dr. Smith",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          maxUses: 100,
          usesCount: 45,
        };

        setLinkInfo(mockData);
        setLinkValid(true);
      } catch (error) {
        console.error("Failed to verify link:", error);
        toast.error("Failed to verify attendance link");
        setLinkValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyLinkData();
  }, [linkToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!indexNumber.trim()) {
      toast.error("Please enter your index number");
      return;
    }

    if (!linkToken) {
      toast.error("Invalid attendance link");
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await fetch(`${process.env.VITE_API_URL}/api/class-attendance/links/mark`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ linkToken, indexNumber: indexNumber.toUpperCase() }),
      // });
      
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      toast.success("Attendance recorded successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to record attendance";
      console.error("Failed to record attendance:", error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Verifying Link...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we verify your attendance link
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!linkValid || !linkInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <h2 className="text-2xl font-bold">Invalid Link</h2>
            <p className="text-sm text-muted-foreground text-center">
              This attendance link is invalid, expired, or has reached its maximum usage limit.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="mt-4"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h2 className="text-2xl font-bold">Attendance Recorded!</h2>
            <p className="text-sm text-muted-foreground text-center">
              Your attendance for <strong>{linkInfo.courseCode}</strong> has been successfully recorded.
            </p>
            <div className="w-full mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Course Details:</p>
              <p className="text-sm text-muted-foreground mt-1">
                {linkInfo.courseName || linkInfo.courseCode}
              </p>
              {linkInfo.lecturerName && (
                <p className="text-sm text-muted-foreground">
                  Lecturer: {linkInfo.lecturerName}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(linkInfo.expiresAt) < new Date();
  const isMaxUsed = linkInfo.maxUses ? linkInfo.usesCount >= linkInfo.maxUses : false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your index number to record your attendance
            </p>
          </div>

          {/* Course Info */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Active Session
              </span>
            </div>
            <h2 className="text-xl font-bold">{linkInfo.courseCode}</h2>
            {linkInfo.courseName && (
              <p className="text-sm text-muted-foreground">{linkInfo.courseName}</p>
            )}
            {linkInfo.lecturerName && (
              <p className="text-sm text-muted-foreground mt-1">
                Lecturer: {linkInfo.lecturerName}
              </p>
            )}
          </div>

          {/* Link Status */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Expires: {new Date(linkInfo.expiresAt).toLocaleString()}
            </span>
          </div>

          {linkInfo.maxUses && (
            <div className="text-sm text-muted-foreground">
              Usage: {linkInfo.usesCount} / {linkInfo.maxUses}
            </div>
          )}

          {/* Warning if expired or max used */}
          {(isExpired || isMaxUsed) && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">
                {isExpired ? "This link has expired" : "This link has reached maximum usage"}
              </p>
            </div>
          )}

          {/* Form */}
          {!isExpired && !isMaxUsed && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="indexNumber">Index Number</Label>
                <Input
                  id="indexNumber"
                  type="text"
                  placeholder="e.g., 2020001"
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value.toUpperCase())}
                  disabled={loading}
                  className="uppercase"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !indexNumber.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Present
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Exam Script Tracking System
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Student Self-Service Attendance
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
