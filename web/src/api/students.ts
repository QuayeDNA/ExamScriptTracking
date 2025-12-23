import { apiClient } from "@/lib/api-client";

export interface Student {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number;
  qrCode: string;
  createdAt: string;
}

export interface CreateStudentData {
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number;
}

export interface UpdateStudentData {
  indexNumber?: string;
  firstName?: string;
  lastName?: string;
  program?: string;
  level?: number;
}

export interface BulkCreateStudent {
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number;
}

export interface StudentsResponse {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StudentDetailResponse {
  student: Student & {
    attendances: Array<{
      id: string;
      entryTime: string;
      exitTime: string | null;
      submissionTime: string | null;
      status: string;
      examSession: {
        courseCode: string;
        courseName: string;
        examDate: string;
        venue: string;
      };
    }>;
  };
}

export interface BulkCreateResponse {
  message: string;
  success: Array<{ indexNumber: string; name: string }>;
  failed: Array<{ indexNumber: string; error: string }>;
}

export interface QRCodeResponse {
  qrCode: string;
  student: {
    id: string;
    indexNumber: string;
    name: string;
  };
}

export const studentsApi = {
  getStudents: async (filters?: {
    program?: string;
    level?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<StudentsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiClient.get<StudentsResponse>(
      `/students${queryString ? `?${queryString}` : ""}`
    );
  },

  getStudent: async (id: string): Promise<StudentDetailResponse> => {
    return apiClient.get<StudentDetailResponse>(`/students/${id}`);
  },

  createStudent: async (
    data: CreateStudentData
  ): Promise<{ message: string; student: Student }> => {
    return apiClient.post<{ message: string; student: Student }>(
      "/students",
      data
    );
  },

  updateStudent: async (
    id: string,
    data: UpdateStudentData
  ): Promise<{ message: string; student: Student }> => {
    return apiClient.put<{ message: string; student: Student }>(
      `/students/${id}`,
      data
    );
  },

  deleteStudent: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/students/${id}`);
  },

  bulkCreateStudents: async (
    students: BulkCreateStudent[]
  ): Promise<BulkCreateResponse> => {
    return apiClient.post<BulkCreateResponse>("/students/bulk", { students });
  },

  getQRCode: async (id: string): Promise<QRCodeResponse> => {
    return apiClient.get<QRCodeResponse>(`/students/${id}/qr-code`);
  },

  getStudentQR: async (indexNumber: string): Promise<Student> => {
    return apiClient.get<Student>(
      `/students/qr?indexNumber=${encodeURIComponent(indexNumber)}`
    );
  },

  getPrograms: async (): Promise<{ programs: string[] }> => {
    return apiClient.get<{ programs: string[] }>("/students/programs");
  },

  getLevels: async (): Promise<{ levels: number[] }> => {
    return apiClient.get<{ levels: number[] }>("/students/levels");
  },
};
