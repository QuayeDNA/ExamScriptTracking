/**
 * Student Self-Service Attendance Marking Page
 * 
 * Flow:
 * 1. Student visits /attend/[token] or enters 5-digit code
 * 2. System validates the link token
 * 3. Student enters their index number
 * 4. System looks up student by index number
 * 5. System marks attendance
 * 6. Device fingerprint prevents duplicate submissions
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { classAttendanceApi } from '@/api/classAttendance';
import { hasDeviceMarkedAttendance, markDeviceAttendance } from '@/lib/deviceFingerprint';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  MapPin, 
  Clock, 
  GraduationCap,
  AlertCircle,
  User,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'validate' | 'enter-index' | 'marking' | 'success' | 'error';

interface SessionInfo {
  id: string;
  courseCode: string;
  courseName: string;
  lecturerName?: string;
  venue?: string;
  startTime: string;
  status: string;
  expectedStudentCount: number;
}

export default function MarkAttendancePage() {
  const { token } = useParams<{ token: string }>();
  
  const [step, setStep] = useState<Step>('validate');
  const [tokenInput, setTokenInput] = useState(token || '');
  const [indexNumber, setIndexNumber] = useState('');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [marking, setMarking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Request location if needed
  useEffect(() => {
    if (step === 'enter-index' && sessionInfo) {
      requestLocation();
    }
  }, [step, sessionInfo]);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLocationError(null);
    } catch (err) {
      console.warn('Location access denied or failed:', err);
      setLocationError('Location access is required for attendance marking');
      // Don't block the flow, location is optional for some links
    }
  };

  const handleValidateLink = useCallback(async (linkToken: string) => {
    if (!linkToken || linkToken.length !== 5) {
      setError('Please enter a valid 5-digit attendance code');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // Use fetch directly to avoid any authentication issues
      const API_URL = import.meta.env.VITE_API_URL ?? "";
      const baseURL = API_URL ? `${API_URL}/api` : "/api";
      const params = new URLSearchParams();
      if (location?.lat) params.append('lat', location.lat.toString());
      if (location?.lng) params.append('lng', location.lng.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`${baseURL}/class-attendance/links/${linkToken}/validate${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && data.data) {
        const session = data.data;
        
        // Check if device has already marked attendance
        if (hasDeviceMarkedAttendance(session.id)) {
          setError('You have already marked attendance for this session from this device.');
          setStep('error');
          return;
        }

        setSessionInfo(session);
        setStep('enter-index');
      } else {
        throw new Error(data.error || 'Invalid link response');
      }
    } catch (err: unknown) {
      console.error('Validation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid or expired attendance link';
      setError(errorMessage);
      setStep('error');
    } finally {
      setValidating(false);
    }
  }, [location]);

  // Validate link on mount if token is provided
  useEffect(() => {
    if (token) {
      handleValidateLink(token);
    }
  }, [token, handleValidateLink]);

  const handleLookupStudent = async () => {
    if (!indexNumber.trim()) {
      setError('Please enter your index number');
      return;
    }

    setLookingUp(true);
    setError(null);

    try {
      const student = await classAttendanceApi.lookupStudentByIndex(indexNumber.trim());
      setStudentName(`${student.firstName} ${student.lastName}`);
      setStep('marking');
      
      // Automatically mark attendance after lookup
      await handleMarkAttendance(student.id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Student not found';
      setError(errorMessage);
    } finally {
      setLookingUp(false);
    }
  };

  const handleMarkAttendance = async (id: string) => {
    if (!sessionInfo || !tokenInput) {
      setError('Session information is missing');
      return;
    }

    setMarking(true);
    setError(null);

    try {
      // Use fetch directly to avoid any authentication issues
      const API_URL = import.meta.env.VITE_API_URL ?? "";
      const baseURL = API_URL ? `${API_URL}/api` : "/api";
      
      const response = await fetch(`${baseURL}/class-attendance/self-mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkToken: tokenInput,
          studentId: id,
          location: location || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success) {
        // Mark device as having submitted
        markDeviceAttendance(sessionInfo.id);
        
        setStep('success');
        toast.success('Attendance marked successfully!', {
          description: 'Your attendance has been recorded. Awaiting lecturer confirmation.',
        });
      } else {
        throw new Error(data.message || 'Failed to mark attendance');
      }
    } catch (err: unknown) {
      console.error('Mark attendance error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark attendance';
      setError(errorMessage);
      setStep('error');
      toast.error('Failed to mark attendance', {
        description: errorMessage,
      });
    } finally {
      setMarking(false);
    }
  };

  const handleRetry = () => {
    setStep('validate');
    setError(null);
    setIndexNumber('');
    setStudentName(null);
    setTokenInput('');
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Mark Your Attendance
          </h1>
          <p className="text-muted-foreground">
            Enter the attendance code and your index number to mark your attendance
          </p>
        </div>

        {/* Validate Link Step */}
        {step === 'validate' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Enter Attendance Code
              </CardTitle>
              <CardDescription>
                Enter the 5-digit code provided by your lecturer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Attendance Code</Label>
                <Input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="12345"
                  value={tokenInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setTokenInput(value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && tokenInput.length === 5) {
                      handleValidateLink(tokenInput);
                    }
                  }}
                  className="text-center text-2xl font-mono tracking-widest"
                  disabled={validating}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 5-digit code
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => handleValidateLink(tokenInput)}
                disabled={validating || tokenInput.length !== 5}
                className="w-full"
                size="lg"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Enter Index Number Step */}
        {step === 'enter-index' && sessionInfo && (
          <div className="space-y-4">
            {/* Session Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Course</p>
                    <p className="text-lg font-semibold">
                      {sessionInfo.courseCode} - {sessionInfo.courseName}
                    </p>
                  </div>

                  {sessionInfo.lecturerName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lecturer</p>
                      <p className="text-base">{sessionInfo.lecturerName}</p>
                    </div>
                  )}

                  {sessionInfo.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Venue</p>
                        <p className="text-base">{sessionInfo.venue}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                      <p className="text-base">{formatTime(sessionInfo.startTime)}</p>
                    </div>
                  </div>

                  <div>
                    <Badge variant="outline" className="text-sm">
                      Status: {sessionInfo.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Index Number Entry Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Enter Your Index Number
                </CardTitle>
                <CardDescription>
                  Enter your student index number to mark attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationError && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {locationError}. Attendance marking may still work without location.
                    </AlertDescription>
                  </Alert>
                )}

                {location && (
                  <Alert>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      Location verified: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="indexNumber">Index Number</Label>
                  <Input
                    id="indexNumber"
                    type="text"
                    placeholder="e.g., 20210001"
                    value={indexNumber}
                    onChange={(e) => setIndexNumber(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && indexNumber.trim()) {
                        handleLookupStudent();
                      }
                    }}
                    disabled={lookingUp || marking}
                    className="text-lg"
                    autoFocus
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('validate');
                      setIndexNumber('');
                      setError(null);
                    }}
                    disabled={lookingUp || marking}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleLookupStudent}
                    disabled={lookingUp || marking || !indexNumber.trim()}
                    className="flex-1"
                    size="lg"
                  >
                    {lookingUp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      'Mark Attendance'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Marking Step */}
        {step === 'marking' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Marking Attendance...</h3>
                  {studentName && (
                    <p className="text-muted-foreground">
                      Recording attendance for <strong>{studentName}</strong>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === 'success' && sessionInfo && (
          <Card className="border-green-500">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Attendance Marked Successfully!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your attendance has been recorded for this session.
                  </p>
                  {studentName && (
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {studentName}
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="space-y-2 text-sm text-left bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="font-medium">Course:</p>
                    <p className="text-muted-foreground">
                      {sessionInfo.courseCode} - {sessionInfo.courseName}
                    </p>
                  </div>
                  {sessionInfo.lecturerName && (
                    <div>
                      <p className="font-medium">Lecturer:</p>
                      <p className="text-muted-foreground">{sessionInfo.lecturerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">Time:</p>
                    <p className="text-muted-foreground">{formatTime(new Date().toISOString())}</p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your attendance is pending lecturer confirmation. You will be notified once confirmed.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <Card className="border-destructive">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Unable to Mark Attendance</h3>
                  {error && (
                    <p className="text-muted-foreground">{error}</p>
                  )}
                </div>
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
