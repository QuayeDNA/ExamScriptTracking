// Generic student CSV template - used for both bulk imports and expected students
export const downloadStudentTemplate = (filename: string = "student_import_template.csv") => {
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
