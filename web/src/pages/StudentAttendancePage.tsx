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
import { CheckCircle2, XCircle, Clock, Loader2, MapPin, AlertTriangle } from "lucide-react";

interface SessionInfo {
  id: string;
  courseCode: string;
  courseName?: string;
  lecturerName?: string;
  startTime: string;
  notes?: string;
}

interface ValidationResponse {
  valid: boolean;
  session?: SessionInfo;
  distanceFromVenue?: number;
  requiresLocation?: boolean;
  error?: string;
  requiredRadius?: number;
}

export function StudentAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const linkToken = searchParams.get("token");

  const [indexNumber, setIndexNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [linkValid, setLinkValid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requiresLocation, setRequiresLocation] = useState(false);
  const [distanceFromVenue, setDistanceFromVenue] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getStudentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let message = "Failed to get your location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out.";
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

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
      setGettingLocation(true);
      try {
        // Try to get student location first (non-blocking)
        let studentLocation: { lat: number; lng: number } | undefined;
        try {
          studentLocation = await getStudentLocation();
        } catch (error) {
          console.warn("Could not get student location:", error);
          // Don't fail yet - backend will indicate if location is required
        }
        setGettingLocation(false);

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${API_URL}/api/class-attendance/links/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token: linkToken,
            studentLocation 
          }),
        });

        const data: ValidationResponse = await response.json();

        if (!response.ok || !data.valid) {
          setLinkValid(false);
          setLocationError(data.error || "Invalid link");
          
          if (data.distanceFromVenue !== undefined && data.requiredRadius !== undefined) {
            toast.error(
              `You are ${data.distanceFromVenue.toFixed(0)}m away. Must be within ${data.requiredRadius}m.`
            );
          } else {
            toast.error(data.error || "This attendance link is invalid");
          }
          return;
        }

        setSessionInfo(data.session!);
        setLinkValid(true);
        setRequiresLocation(data.requiresLocation || false);
        setDistanceFromVenue(data.distanceFromVenue || null);
        
        if (data.distanceFromVenue !== undefined) {
          toast.success(`Location verified: ${data.distanceFromVenue.toFixed(0)}m from venue`);
        }
      } catch (error) {
        console.error("Failed to verify link:", error);
        toast.error("Failed to verify attendance link");
        setLinkValid(false);
        setLocationError(error instanceof Error ? error.message : "Verification failed");
      } finally {
        setVerifying(false);
        setGettingLocation(false);
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
            <h2 className="text-xl font-semibold">
              {gettingLocation ? "Getting Your Location..." : "Verifying Link..."}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {gettingLocation 
                ? "Please allow location access to continue"
                : "Please wait while we verify your attendance link"
              }
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!linkValid || !sessionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-4">
            {requiresLocation ? (
              <AlertTriangle className="h-16 w-16 text-orange-500" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
            <h2 className="text-2xl font-bold">
              {requiresLocation ? "Location Required" : "Invalid Link"}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {locationError || "This attendance link is invalid, expired, or has reached its maximum usage limit."}
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
              Your attendance for <strong>{sessionInfo.courseCode}</strong> has been successfully recorded.
            </p>
            <div className="w-full mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Course Details:</p>
              <p className="text-sm text-muted-foreground mt-1">
                {sessionInfo.courseName || sessionInfo.courseCode}
              </p>
              {sessionInfo.lecturerName && (
                <p className="text-sm text-muted-foreground">
                  Lecturer: {sessionInfo.lecturerName}
                </p>
              )}
              {distanceFromVenue !== null && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Distance from venue: {distanceFromVenue.toFixed(0)}m
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
            <h2 className="text-xl font-bold">{sessionInfo.courseCode}</h2>
            {sessionInfo.courseName && (
              <p className="text-sm text-muted-foreground">{sessionInfo.courseName}</p>
            )}
            {sessionInfo.lecturerName && (
              <p className="text-sm text-muted-foreground mt-1">
                Lecturer: {sessionInfo.lecturerName}
              </p>
            )}
          </div>

          {/* Location Status */}
          {distanceFromVenue !== null && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Location verified: {distanceFromVenue.toFixed(0)}m from venue
              </span>
            </div>
          )}

          {/* Session Time */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Started: {new Date(sessionInfo.startTime).toLocaleString()}
            </span>
          </div>

          {/* Form */}
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
