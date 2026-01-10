/**
 * Student Self-Service Attendance Marking Page
 * 
 * IMPROVEMENTS:
 * - Single unified component handles both URL token and manual entry
 * - No authentication required (uses fetch directly)
 * - Mobile-first responsive design
 * - Progressive enhancement with location
 * - Better error handling and user feedback
 * - Optimistic UI updates
 * - Automatic form progression
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
import { Progress } from '@/components/ui/progress';
import { hasDeviceMarkedAttendance, markDeviceAttendance } from '@/lib/deviceFingerprint';
import { publicAttendanceApi } from '@/utils/publicAttendanceAPi';
import { studentsApi } from '@/api/students';
import { getFileUrl } from '@/lib/api-client';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Clock,
  GraduationCap,
  AlertCircle,
  User,
  Hash,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'input' | 'validating' | 'details' | 'verify' | 'submitting' | 'success' | 'error';

interface SessionInfo {
  id: string;
  courseCode: string;
  courseName: string;
  lecturerName?: string;
  venue?: string;
  startTime: string;
}

interface StudentInfo {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  program?: string;
  level?: number;
  profilePicture?: string;
}

export default function MarkAttendancePage() {
  const { token: urlToken } = useParams<{ token: string }>();
  
  // Form state
  const [token, setToken] = useState(urlToken || '');
  const [indexNumber, setIndexNumber] = useState('');
  
  // UI state
  const [step, setStep] = useState<Step>(urlToken ? 'validating' : 'input');
  const [progress, setProgress] = useState(0);
  const [verifying, setVerifying] = useState(false);
  
  // Data state
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | null>(null);
  const [imageError, setImageError] = useState(false);

  // Request location when on details step
  useEffect(() => {
    if (step === 'details') {
      requestLocation();
    }
  }, [step]);

  // Update progress bar
  useEffect(() => {
    const progressMap = {
      'input': 0,
      'validating': 25,
      'details': 50,
      'verify': 75,
      'submitting': 90,
      'success': 100,
      'error': 0
    };
    setProgress(progressMap[step]);
  }, [step]);

  /**
   * Request user location
   */
  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('pending');

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
      setLocationStatus('granted');
    } catch (err) {
      console.warn('Location access denied:', err);
      setLocationStatus('denied');
      // Continue without location - it may be optional
    }
  };

  /**
   * Validate attendance link token
   */
  const validateToken = useCallback(async (linkToken: string) => {
    setStep('validating');
    setError(null);

    try {
      const result = await publicAttendanceApi.validateLink(linkToken, location || undefined);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid or expired link');
      }

      // Check device fingerprint
      if (hasDeviceMarkedAttendance(result.data.id)) {
        throw new Error('You have already marked attendance for this session from this device');
      }

      setSession(result.data);
      setStep('details');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate link';
      setError(message);
      setStep('error');
      toast.error('Validation Failed', { description: message });
    }
  }, [location]);

  // Auto-progress when URL token is present
  useEffect(() => {
    if (urlToken && step === 'validating') {
      validateToken(urlToken);
    }
  }, [urlToken, step, validateToken]);

  /**
   * Verify student with full details
   */
  const verifyStudent = async (index: string): Promise<StudentInfo> => {
    try {
      const studentData = await studentsApi.getStudentQR(index.trim());
      return studentData;
    } catch (error: unknown) {
      const err = error as { error?: string };
      throw new Error(err.error || 'Student not found or QR code not available');
    }
  };

  /**
   * Mark attendance
   */
  const markAttendance = async (studentId: string) => {
    const result = await publicAttendanceApi.markAttendance(token, studentId, location || undefined);

    if (!result.success) {
      throw new Error(result.error || 'Failed to mark attendance');
    }

    return result.data;
  };

  /**
   * Handle student verification
   */
  const handleVerify = async () => {
    if (!indexNumber.trim()) {
      setError('Please enter your index number');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const studentData = await verifyStudent(indexNumber.trim());
      setStudent(studentData);
      setStep('verify');
      toast.success('Student verified!', {
        description: `${studentData.firstName} ${studentData.lastName}`
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify student';
      setError(message);
      toast.error('Verification Failed', { description: message });
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate token
    if (!token || token.length !== 5) {
      setError('Please enter a valid 5-digit code');
      return;
    }

    // If we don't have session yet, validate first
    if (!session) {
      await validateToken(token);
      return;
    }

    // Validate student verification
    if (!student) {
      setError('Please verify your student information first');
      return;
    }

    setStep('submitting');

    try {
      // Mark attendance
      await markAttendance(student.id);

      // Record in device storage
      markDeviceAttendance(session.id);

      setStep('success');
      toast.success('Success!', {
        description: 'Your attendance has been recorded'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark attendance';
      setError(message);
      setStep('error');
      toast.error('Error', { description: message });
    }
  };

  /**
   * Handle retry
   */
  const handleRetry = () => {
    setStep('input');
    setError(null);
    setToken(urlToken || '');
    setIndexNumber('');
    setStudent(null);
    setSession(null);
    setLocation(null);
    setLocationStatus(null);
    setImageError(false);
  };

  /**
   * Format date/time
   */
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Mobile-optimized container */}
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-8">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Mark Attendance
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {step === 'verify' ? 'Confirm your details and submit attendance' : session ? 'Enter your index number to verify your identity' : 'Enter your attendance code to begin'}
          </p>
        </div>

        {/* Progress bar */}
        {step !== 'input' && step !== 'error' && (
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Code</span>
              <span>Verify</span>
              <span>Submit</span>
              <span>Complete</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Card className="border-2">
          {/* Input Form - Shows when no session or on retry */}
          {(step === 'input' || (step === 'details' && !session)) && (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Hash className="h-5 w-5" />
                  Attendance Code
                </CardTitle>
                <CardDescription className="text-sm">
                  Enter the 5-digit code from your lecturer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-base">Code</Label>
                  <Input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="•••••"
                    value={token}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setToken(value);
                    }}
                    className="text-center text-3xl sm:text-4xl font-mono tracking-[0.5em] h-16 sm:h-20"
                    autoFocus
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    {token.length}/5 digits
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={token.length !== 5}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  Continue
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </form>
          )}

          {/* Validating State */}
          {step === 'validating' && (
            <CardContent className="py-12 sm:py-16">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto text-primary" />
                <div>
                  <p className="text-lg sm:text-xl font-semibold">Validating Code...</p>
                  <p className="text-sm text-muted-foreground mt-1">Please wait</p>
                </div>
              </div>
            </CardContent>
          )}

          {/* Details Form - Shows after successful validation */}
          {step === 'details' && session && (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-5 w-5" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Session Info */}
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Course</p>
                    <p className="text-sm sm:text-base font-semibold">
                      {session.courseCode}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {session.courseName}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    {session.lecturerName && (
                      <div>
                        <p className="text-muted-foreground">Lecturer</p>
                        <p className="font-medium">{session.lecturerName}</p>
                      </div>
                    )}
                    {session.venue && (
                      <div>
                        <p className="text-muted-foreground">Venue</p>
                        <p className="font-medium">{session.venue}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(session.startTime)}</span>
                  </div>
                </div>

                {/* Location Status */}
                {locationStatus && (
                  <Alert variant={locationStatus === 'granted' ? 'default' : 'warning'}>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {locationStatus === 'granted' && (
                        <>Location verified • {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}</>
                      )}
                      {locationStatus === 'denied' && (
                        <>Location access denied. Attendance may require manual verification.</>
                      )}
                      {locationStatus === 'pending' && (
                        <>Requesting location access...</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Index Number Input */}
                <div className="space-y-2">
                  <Label htmlFor="indexNumber" className="text-base">Index Number</Label>
                  <Input
                    id="indexNumber"
                    type="text"
                    placeholder="e.g., 20210001"
                    value={indexNumber}
                    onChange={(e) => setIndexNumber(e.target.value.toUpperCase())}
                    className="text-lg h-12"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your student index number
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetry}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleVerify}
                    disabled={!indexNumber.trim() || verifying}
                    className="flex-1 h-12 text-base"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          )}

          {/* Verify Student Step */}
          {step === 'verify' && session && student && (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-5 w-5" />
                  Confirm Your Details
                </CardTitle>
                <CardDescription className="text-sm">
                  Please confirm this is you before marking attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-border shadow-md">
                      {imageError ? (
                        <User className="w-12 h-12 text-gray-400" />
                      ) : (
                        <img
                          src={getFileUrl(student.profilePicture || "")}
                          alt={`${student.firstName} ${student.lastName}`}
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {student.firstName} {student.lastName}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Index Number:</span>
                        <Badge variant="secondary">{student.indexNumber}</Badge>
                      </div>

                      {student.program && (
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Program:</span>
                          <span>{student.program}</span>
                        </div>
                      )}

                      {student.level && (
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="font-medium">Level:</span>
                          <Badge variant="outline">Level {student.level}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Session Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Course</p>
                    <p className="font-semibold">
                      {session.courseCode} • {session.courseName}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">Time</p>
                    <p>{formatTime(session.startTime)}</p>
                  </div>
                  {session.venue && (
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">Venue</p>
                      <p>{session.venue}</p>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('details');
                      setStudent(null);
                      setImageError(false);
                    }}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base"
                  >
                    Submit Attendance
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </form>
          )}

          {/* Submitting State */}
          {step === 'submitting' && (
            <CardContent className="py-12 sm:py-16">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto text-primary" />
                <div>
                  <p className="text-lg sm:text-xl font-semibold">Marking Attendance...</p>
                  {student && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {student.firstName} {student.lastName}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          )}

          {/* Success State */}
          {step === 'success' && session && student && (
            <CardContent className="py-8 sm:py-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    Attendance Marked!
                  </h3>
                  <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1">
                    {student.firstName} {student.lastName}
                  </Badge>
                </div>

                <Separator />

                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Course</p>
                    <p className="font-semibold">
                      {session.courseCode} • {session.courseName}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Marked At</p>
                    <p>{formatTime(new Date().toISOString())}</p>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm text-left">
                    Your attendance is pending lecturer confirmation. 
                    You'll be notified once it's verified.
                  </AlertDescription>
                </Alert>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      ✅ All Done!
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You can now safely close this tab or window.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          {/* Error State */}
          {step === 'error' && (
            <CardContent className="py-8 sm:py-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />
                </div>
                
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    Something Went Wrong
                  </h3>
                  {error && (
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleRetry}
                  className="w-full h-12"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Having trouble? Contact your lecturer for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}