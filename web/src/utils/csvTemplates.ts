export const downloadExpectedStudentsTemplate = () => {
  const csv = `indexNumber,firstName,lastName,program,level
BT/ITS/24/001,Kwame,Mensah,Information Technology,100
BT/ITS/24/002,Ama,Owusu,Information Technology,100
BT/ITS/24/003,Kofi,Appiah,Information Technology,100
BT/ITS/24/004,Abena,Asante,Information Technology,100
BT/ITS/24/005,Yaw,Boateng,Information Technology,100`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expected_students_template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

export interface ParsedStudent {
  indexNumber: string;
  firstName?: string;
  lastName?: string;
  program?: string;
  level?: number;
}

export const parseStudentCSV = (row: Record<string, string>): ParsedStudent => {
  return {
    indexNumber: row.indexNumber || row.IndexNumber || row.index_number,
    firstName: row.firstName || row.FirstName || row.first_name,
    lastName: row.lastName || row.LastName || row.last_name,
    program: row.program || row.Program,
    level: row.level
      ? parseInt(row.level)
      : row.Level
      ? parseInt(row.Level)
      : undefined,
  };
};
