import { useState, useMemo } from "react";
import { Calendar, Download, Trash2, Filter, X, TrendingUp } from "lucide-react";
import {
  getAllRecords,
  getFilteredRecords,
  getAttendanceStats,
  getUniqueCourses,
  exportToCSV,
  clearAllRecords,
  formatVerificationMethod,
  getMethodIcon,
  type LocalAttendanceRecord,
  type AttendanceFilter,
} from "@/utils/attendanceStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AttendanceHistoryProps {
  compact?: boolean;
  maxRecords?: number;
  showHeader?: boolean;
}

export function AttendanceHistory({ 
  compact = false, 
  maxRecords,
  showHeader = true 
}: AttendanceHistoryProps) {
  const [filter, setFilter] = useState<AttendanceFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const allRecords = getAllRecords();
  const filteredRecords = useMemo(() => {
    const records = getFilteredRecords(filter);
    return maxRecords ? records.slice(0, maxRecords) : records;
  }, [filter, maxRecords]);

  const stats = getAttendanceStats();
  const uniqueCourses = getUniqueCourses();

  const handleExport = () => {
    try {
      exportToCSV(filteredRecords);
      toast.success(`Exported ${filteredRecords.length} attendance records`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export");
    }
  };

  const handleClearAll = () => {
    clearAllRecords();
    setShowClearDialog(false);
    toast.success("Attendance history cleared");
    window.location.reload();
  };

  const handleResetFilters = () => {
    setFilter({});
    toast.success("Filters reset");
  };

  const groupedRecords = useMemo(() => {
    const groups: Record<string, LocalAttendanceRecord[]> = {};
    
    filteredRecords.forEach(record => {
      const date = new Date(record.sessionDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });
    
    return groups;
  }, [filteredRecords]);

  // Empty state
  if (allRecords.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Attendance History</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Your attendance records will appear here after you mark attendance for the first time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>My Attendance History</CardTitle>
                <CardDescription>
                  {stats.totalSessions} session{stats.totalSessions !== 1 ? 's' : ''} recorded locally on this device
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={filteredRecords.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Stats */}
          {!compact && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{stats.totalSessions}</div>
                  <div className="text-xs text-muted-foreground">Total Sessions</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{Object.keys(stats.byCourse).length}</div>
                  <div className="text-xs text-muted-foreground">Courses</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {stats.byMethod['BIOMETRIC_FACE'] || stats.byMethod['BIOMETRIC_FINGERPRINT'] || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Biometric</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {stats.latestSession ? 
                      new Date(stats.latestSession.timestamp).toLocaleDateString() : 
                      'N/A'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Latest</div>
                </div>
              </div>
            </CardContent>
          )}

          {/* Filters */}
          {showFilters && (
            <CardContent className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={filter.courseCode || "all"}
                    onValueChange={(value) => 
                      setFilter({ ...filter, courseCode: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {uniqueCourses.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filter.startDate || ''}
                    onChange={(e) => setFilter({ ...filter, startDate: e.target.value || undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filter.endDate || ''}
                    onChange={(e) => setFilter({ ...filter, endDate: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredRecords.length} of {allRecords.length} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowClearDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All History
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            No records match your filters. Try adjusting your filter criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords).map(([date, records]) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">{date}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Profile Picture */}
                      {!compact && record.profilePictureUrl && (
                        <img
                          src={record.profilePictureUrl}
                          alt={`${record.firstName} ${record.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {record.courseCode}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {record.courseName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{record.venue}</span>
                          <span>•</span>
                          <span>
                            {new Date(record.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>•</span>
                          <span>{record.lecturerName}</span>
                        </div>
                      </div>

                      {/* Method Badge */}
                      <Badge variant="secondary" className="shrink-0">
                        <span className="mr-1">{getMethodIcon(record.verificationMethod)}</span>
                        {formatVerificationMethod(record.verificationMethod)}
                        {record.confidence && (
                          <span className="ml-1 text-xs">
                            ({(record.confidence * 100).toFixed(0)}%)
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Attendance History?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {allRecords.length} attendance records from this device.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              💡 <strong>Tip:</strong> Export your records to CSV first as a backup before clearing.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
