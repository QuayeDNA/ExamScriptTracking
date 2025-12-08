import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examSessionsApi } from "@/api/examSessions";
import {
  ArrowLeft,
  Download,
  Upload,
  RefreshCw,
  Users,
  CheckCircle2,
  UserCheck,
  UserX,
  AlertCircle,
  Trash2,
} from "lucide-react";
import Papa from "papaparse";

export default function BatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch exam session with attendances
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["examSession", id],
    queryFn: () => examSessionsApi.getExamSession(id!),
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Fetch expected students
  const { data: expectedStudentsData } = useQuery({
    queryKey: ["expectedStudents", id],
    queryFn: () => examSessionsApi.getExpectedStudents(id!),
    enabled: !!id,
  });

  // Fetch attendance summary
  const { data: summaryData } = useQuery({
    queryKey: ["attendanceSummary", id],
    queryFn: () => examSessionsApi.getAttendanceSummary(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  // Mutation for adding expected students
  const addExpectedStudentsMutation = useMutation({
    mutationFn: (
      students: Array<{
        indexNumber: string;
        firstName?: string;
        lastName?: string;
        program?: string;
        level?: number;
      }>
    ) => examSessionsApi.addExpectedStudents(id!, students),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expectedStudents", id] });
      queryClient.invalidateQueries({ queryKey: ["attendanceSummary", id] });
      queryClient.invalidateQueries({ queryKey: ["examSession", id] });
      setUploadError(null);

      // Show success message with stats
      alert(
        `✅ Upload Complete!\n\n` +
          `• ${data.added} students added to exam session\n` +
          `• ${data.newStudentRecordsCreated} new student records created with QR codes\n` +
          `• ${data.existingStudentRecords} existing student records found\n\n` +
          `All students can now scan QR codes for attendance.`
      );
    },
  });

  // Mutation for removing expected student
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) =>
      examSessionsApi.removeExpectedStudent(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expectedStudents", id] });
      queryClient.invalidateQueries({ queryKey: ["attendanceSummary", id] });
      queryClient.invalidateQueries({ queryKey: ["examSession", id] });
    },
  });

  // Mutation for ending session
  const endSessionMutation = useMutation({
    mutationFn: () => examSessionsApi.endExamSession(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["examSession", id] });
      queryClient.invalidateQueries({ queryKey: ["examSessions"] });
      alert(
        `✅ Session Ended!\n\n` +
          `The exam session has been marked as SUBMITTED.\n` +
          `All ${data.examSession.scriptsCount} scripts have been recorded.`
      );
    },
    onError: (error: Error) => {
      alert(`Failed to end session: ${error.message}`);
    },
  });

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadError(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const students = (results.data as Record<string, string>[])
            .map((row) => {
              const student = {
                indexNumber:
                  row.indexNumber || row.IndexNumber || row.index_number,
                firstName: row.firstName || row.FirstName || row.first_name,
                lastName: row.lastName || row.LastName || row.last_name,
                program: row.program || row.Program,
                level: row.level
                  ? parseInt(row.level)
                  : row.Level
                  ? parseInt(row.Level)
                  : undefined,
              };
              console.log("Parsed row:", row, "→", student);
              return student;
            })
            .filter((student) => student.indexNumber?.trim().length > 0);

          console.log("All parsed students:", students);

          if (students.length === 0) {
            setUploadError(
              "No valid students found in CSV file. Required column: indexNumber. Optional: firstName, lastName, program, level"
            );
            setUploading(false);
            return;
          }
          addExpectedStudentsMutation.mutate(students, {
            onSettled: () => setUploading(false),
            onError: (error: Error) => {
              setUploadError(error.message || "Failed to upload students");
            },
          });
        },
        error: (error) => {
          setUploadError(`CSV parsing error: ${error.message}`);
          setUploading(false);
        },
      });

      // Reset input
      event.target.value = "";
    },
    [addExpectedStudentsMutation]
  );

  const downloadTemplate = () => {
    const csv = `indexNumber,firstName,lastName,program,level
20230001,Kwame,Mensah,Computer Science,300
20230002,Ama,Owusu,Information Technology,300
20230003,Kofi,Appiah,Software Engineering,200
20230004,Abena,Asante,Computer Science,300
20230005,Yaw,Boateng,Cyber Security,400
20230006,Akosua,Osei,Data Science,300
20230007,Kwesi,Agyeman,Information Technology,200
20230008,Adjoa,Mensah,Computer Science,300
20230009,Kojo,Darko,Software Engineering,300
20230010,Efua,Frimpong,Computer Science,400
20230011,Kwabena,Nkrumah,Information Technology,300
20230012,Adwoa,Gyasi,Data Science,200
20230013,Yaa,Bonsu,Computer Science,300
20230014,Kwaku,Amponsah,Software Engineering,400
20230015,Esi,Ofosu,Cyber Security,300
20230016,Kofi,Asiedu,Information Technology,300
20230017,Ama,Sarpong,Computer Science,200
20230018,Kwame,Boakye,Data Science,300
20230019,Abena,Ansah,Software Engineering,300
20230020,Yaw,Amoako,Computer Science,400`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expected_students_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !sessionData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const session = sessionData.examSession;
  const stats = session.stats || {
    expectedStudents: 0,
    totalAttended: 0,
    submitted: 0,
    present: 0,
    attendanceRate: "0",
  };

  const expectedStudents = expectedStudentsData?.expectedStudents || [];
  const attendances = session.attendances || [];
  const notYetArrived = summaryData?.summary?.notYetArrived || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/sessions")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {session.courseCode} - {session.courseName}
                  </h1>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-semibold ${
                      session.status === "NOT_STARTED"
                        ? "bg-gray-100 text-gray-800"
                        : session.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : session.status === "SUBMITTED"
                        ? "bg-green-100 text-green-800"
                        : session.status === "IN_TRANSIT"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {session.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Batch: {session.batchQrCode} • {session.venue} •{" "}
                  {new Date(session.examDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {session.status === "IN_PROGRESS" && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to end this exam session?\n\n" +
                          "This will:\n" +
                          "• Mark all scripts as collected\n" +
                          "• Update status to SUBMITTED\n" +
                          "• Close the session for new entries"
                      )
                    ) {
                      endSessionMutation.mutate();
                    }
                  }}
                  disabled={endSessionMutation.isPending}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {endSessionMutation.isPending ? "Ending..." : "End Session"}
                </button>
              )}
              <button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["examSession", id],
                  })
                }
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.expectedStudents}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attended</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {stats.totalAttended}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.submitted}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.attendanceRate}%
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Upload CSV Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Expected Students ({expectedStudents.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload CSV"}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{uploadError}</p>
              </div>
            )}

            {addExpectedStudentsMutation.isSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  Successfully added {addExpectedStudentsMutation.data.added}{" "}
                  students
                </p>
              </div>
            )}

            {/* Expected Students List */}
            {expectedStudents.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Index Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expectedStudents.map((item) => {
                      const hasAttended = attendances.some(
                        (a) => a.student.indexNumber === item.indexNumber
                      );
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.indexNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.firstName && item.lastName
                              ? `${item.firstName} ${item.lastName}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.program && item.level
                              ? `${item.program} - Level ${item.level}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hasAttended ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Present
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Not Yet Arrived
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() =>
                                removeStudentMutation.mutate(item.id)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendances */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Attendances ({attendances.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exit Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendances.map((attendance) => (
                  <tr key={attendance.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {attendance.student.indexNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.student.firstName}{" "}
                      {attendance.student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.entryTime
                        ? new Date(attendance.entryTime).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.exitTime
                        ? new Date(attendance.exitTime).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.submissionTime
                        ? new Date(
                            attendance.submissionTime
                          ).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.status === "SUBMITTED" && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Submitted
                        </span>
                      )}
                      {attendance.status === "PRESENT" && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Present
                        </span>
                      )}
                      {attendance.status === "LEFT_WITHOUT_SUBMITTING" && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Left
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Not Yet Arrived */}
        {notYetArrived.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserX className="w-5 h-5 text-gray-500" />
                Not Yet Arrived ({notYetArrived.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notYetArrived.map((student) => (
                  <div
                    key={student.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <p className="font-medium text-gray-900">
                      {student.indexNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {student.program} - Level {student.level}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
