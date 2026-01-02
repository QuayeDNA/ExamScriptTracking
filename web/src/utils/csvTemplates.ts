// Generic student CSV template - used for both bulk imports and expected students
export const downloadStudentTemplate = (
  filename: string = "student_import_template.csv"
) => {
  const csv = `indexNumber,firstName,lastName,program,option,department,level
BT/ITS/24/001,Kwame,Mensah,Information Technology,Software Option,Computer Science,100
BT/ITS/24/002,Ama,Owusu,Information Technology,Networking Option,Computer Science,100
BT/ITS/24/003,Kofi,Appiah,Information Technology,Software Option,Computer Science,100
BT/ITS/24/004,Abena,Asante,Information Technology,,Computer Science,100
BT/ITS/24/005,Yaw,Boateng,Business Administration,Accounting Option,Business,200`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Exam session CSV template for bulk imports
export const downloadExamSessionTemplate = (
  filename: string = "exam_sessions_template.csv"
) => {
  const csv = `courseCode,courseName,lecturerId,lecturerName,department,faculty,venue,examDate
CS101,Introduction to Computer Science,LEC001,Dr. Kwame Nkrumah,Computer Science Department,Faculty of Computing & Information Systems,Room 101,2025-01-15T09:00:00.000Z
MATH201,Calculus II,LEC002,Prof. Yaa Asantewaa,Mathematics Department,Faculty of Applied Sciences,Room 205,2025-01-16T14:30:00.000Z
ENG301,Advanced English Literature,LEC003,Dr. Kofi Annan,English Department,Faculty of Arts,Room 312,2025-01-17T11:15:00.000Z
BUS150,Business Management,LEC004,Dr. Ama Ata Aidoo,Business Administration,Faculty of Business,Hall B,2025-01-18T08:00:00.000Z`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Alias for backward compatibility with expected students feature
export const downloadExpectedStudentsTemplate = () => {
  downloadStudentTemplate("expected_students_template.csv");
};

export interface ParsedStudent {
  indexNumber: string;
  firstName?: string;
  lastName?: string;
  program?: string;
  option?: string;
  department?: string;
  level?: number;
}

export const parseStudentCSV = (row: Record<string, string>): ParsedStudent => {
  return {
    indexNumber: row.indexNumber || row.IndexNumber || row.index_number,
    firstName: row.firstName || row.FirstName || row.first_name,
    lastName: row.lastName || row.LastName || row.last_name,
    program: row.program || row.Program,
    option: row.option || row.Option,
    department: row.department || row.Department,
    level: row.level
      ? parseInt(row.level)
      : row.Level
      ? parseInt(row.Level)
      : undefined,
  };
};

export interface ParsedExamSession {
  courseCode: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  department: string;
  faculty: string;
  venue: string;
  examDate: string;
}

export const parseExamSessionCSV = (
  row: Record<string, string>
): ParsedExamSession | null => {
  // Validate required fields
  const courseCode = row.courseCode || row.CourseCode || row.course_code;
  const courseName = row.courseName || row.CourseName || row.course_name;
  const lecturerId = row.lecturerId || row.LecturerId || row.lecturer_id;
  const lecturerName =
    row.lecturerName || row.LecturerName || row.lecturer_name;
  const department = row.department || row.Department;
  const faculty = row.faculty || row.Faculty;
  const venue = row.venue || row.Venue;
  const examDate = row.examDate || row.ExamDate || row.exam_date;

  // Skip rows with missing required fields
  if (
    !courseCode ||
    !courseName ||
    !lecturerId ||
    !lecturerName ||
    !department ||
    !faculty ||
    !venue ||
    !examDate
  ) {
    return null;
  }

  return {
    courseCode: courseCode.trim(),
    courseName: courseName.trim(),
    lecturerId: lecturerId.trim(),
    lecturerName: lecturerName.trim(),
    department: department.trim(),
    faculty: faculty.trim(),
    venue: venue.trim(),
    examDate: examDate.trim(),
  };
};
