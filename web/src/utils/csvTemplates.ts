export const downloadExpectedStudentsTemplate = () => {
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
