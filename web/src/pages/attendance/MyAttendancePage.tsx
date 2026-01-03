import { useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { getAllRecords } from "@/utils/attendanceStorage";

export function MyAttendancePage() {
  const navigate = useNavigate();
  const allRecords = getAllRecords();
  
  // Get student info from most recent record
  const latestRecord = allRecords[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="text-sm text-muted-foreground">
            💾 Stored locally on this device
          </div>
        </div>

        {/* Student Info Card */}
        {latestRecord && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {latestRecord.profilePictureUrl ? (
                  <img
                    src={latestRecord.profilePictureUrl}
                    alt={`${latestRecord.firstName} ${latestRecord.lastName}`}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                <div>
                  <CardTitle>
                    {latestRecord.firstName} {latestRecord.lastName}
                  </CardTitle>
                  <CardDescription>
                    {latestRecord.indexNumber} • {latestRecord.program} • Level {latestRecord.level}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{allRecords.length}</div>
                  <div className="text-xs text-muted-foreground">Total Sessions</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {new Set(allRecords.map(r => r.courseCode)).size}
                  </div>
                  <div className="text-xs text-muted-foreground">Courses</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {allRecords.filter(r => 
                      r.verificationMethod.startsWith('BIOMETRIC')
                    ).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Biometric</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-bold">
                    {new Date(latestRecord.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Latest</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔒</div>
              <div className="flex-1 space-y-2 text-sm">
                <p className="font-semibold text-blue-900">Your Data, Your Device</p>
                <p className="text-blue-800">
                  All attendance records are stored locally on this device. Your data is not sent to any server
                  and remains completely private. Clearing your browser data will delete this history.
                </p>
                <p className="text-blue-700">
                  💡 <strong>Tip:</strong> Export your records regularly as a backup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <AttendanceHistory showHeader={true} />
      </div>
    </div>
  );
}
