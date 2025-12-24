import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examSessionsApi, type BatchStatus } from "@/api/examSessions";
import type { ExpectedStudent, MobileExamSession } from "@/types/mobile";
import { toast } from "sonner";

// Hook for loading batch details with expected students
export const useMobileBatchDetails = (batchId: string | undefined) => {
  const queryClient = useQueryClient();

  const {
    data: sessionData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["mobile-batch-details", batchId],
    queryFn: async () => {
      if (!batchId) throw new Error("No batch ID provided");

      const [sessionResponse, studentsResponse] = await Promise.all([
        examSessionsApi.getExamSession(batchId),
        examSessionsApi.getExpectedStudents(batchId),
      ]);

      // Transform the data to match mobile app structure
      const session = sessionResponse.examSession;
      const expectedStudents = studentsResponse.expectedStudents.map(
        (student): ExpectedStudent => ({
          ...student,
          attendanceRecords: student.attendance
            ? [
                {
                  id: student.attendance.id,
                  action: student.attendance.submissionTime
                    ? "SUBMISSION"
                    : student.attendance.exitTime
                    ? "EXIT"
                    : "ENTRY",
                  timestamp:
                    student.attendance.submissionTime ||
                    student.attendance.exitTime ||
                    student.attendance.entryTime,
                },
              ]
            : [],
          status: student.attendance?.submissionTime
            ? "SUBMITTED"
            : "NOT_SUBMITTED",
        })
      );

      return {
        examSession: {
          ...session,
          expectedStudents,
        } as MobileExamSession,
      };
    },
    enabled: !!batchId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BatchStatus }) =>
      examSessionsApi.updateExamSessionStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["mobile-batch-details", batchId],
      });
    },
    onError: (error: unknown) => {
      const err = error as { error?: string };
      toast.error("Failed to update status", {
        description: err.error || "An error occurred",
      });
    },
  });

  return {
    sessionData,
    isLoading,
    refetch,
    updateStatusMutation,
  };
};

// Hook for managing batch status updates
export const useBatchStatusUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BatchStatus }) =>
      examSessionsApi.updateExamSessionStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["mobile-batch-details", variables.id],
      });
    },
    onError: (error: unknown) => {
      const err = error as { error?: string };
      toast.error("Failed to update status", {
        description: err.error || "An error occurred",
      });
    },
  });
};

// Hook for filtering students
export const useStudentFilter = (
  students: ExpectedStudent[],
  filter: "ALL" | "PRESENT" | "SUBMITTED" | "NOT_YET"
) => {
  return useCallback(() => {
    if (!students) return [];

    switch (filter) {
      case "PRESENT":
        return students.filter((student) =>
          student.attendanceRecords?.some((record) => record.action === "ENTRY")
        );
      case "SUBMITTED":
        return students.filter((student) => student.status === "SUBMITTED");
      case "NOT_YET":
        return students.filter(
          (student) =>
            !student.attendanceRecords?.some(
              (record) => record.action === "ENTRY"
            )
        );
      default:
        return students;
    }
  }, [students, filter]);
};

// Hook for calculating attendance statistics
export const useAttendanceStats = (students: ExpectedStudent[]) => {
  return useCallback(() => {
    if (!students) return { total: 0, present: 0, submitted: 0, absent: 0 };

    const present = students.filter((s) =>
      s.attendanceRecords?.some((r) => r.action === "ENTRY")
    ).length;

    const submitted = students.filter((s) => s.status === "SUBMITTED").length;

    const absent = students.length - present;

    return {
      total: students.length,
      present,
      submitted,
      absent,
    };
  }, [students]);
};
