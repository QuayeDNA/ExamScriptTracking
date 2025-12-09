import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, User, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { classAttendanceApi } from "@/api/classAttendance";

interface RecordingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  recordId: string;
}

export default function RecordingDetailsModal({
  open,
  onClose,
  recordId,
}: RecordingDetailsModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-record-details", recordId],
    queryFn: () => classAttendanceApi.getAttendanceRecordById(recordId),
    enabled: open && !!recordId,
  });

  const record = data?.record;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Attendance Recording Details
          </DialogTitle>
          <DialogDescription>
            View all students recorded in this session
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !record ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">Recording not found</p>
            <p className="text-sm text-muted-foreground">
              This recording may have been deleted
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recording Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Course
                </p>
                <p className="text-base font-semibold">
                  {record.courseName || "N/A"}
                  {record.courseCode && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({record.courseCode})
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Lecturer
                </p>
                <p className="text-base font-semibold">
                  {record.lecturerName || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Time
                </p>
                <p className="text-base">
                  {format(new Date(record.startTime), "PPp")}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  End Time
                </p>
                <p className="text-base">
                  {record.endTime
                    ? format(new Date(record.endTime), "PPp")
                    : "In Progress"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Students
                </p>
                <p className="text-base font-semibold">
                  <Badge variant="default">{record.totalStudents}</Badge>
                </p>
              </div>

              {record.session && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Device
                  </p>
                  <p className="text-base">
                    {record.session.deviceName || record.session.deviceId}
                  </p>
                </div>
              )}
            </div>

            {/* Students List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Students ({record.students?.length || 0})
              </h3>

              {!record.students || record.students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border rounded-lg">
                  <User className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No students recorded yet
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Index Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Scan Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {record.students.map((attendance, index) => (
                        <TableRow key={attendance.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">
                            {attendance.student.indexNumber}
                          </TableCell>
                          <TableCell>
                            {attendance.student.firstName}{" "}
                            {attendance.student.lastName}
                          </TableCell>
                          <TableCell>
                            {format(new Date(attendance.scanTime), "p")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>

            {record.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  {record.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
