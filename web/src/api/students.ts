import { apiClient } from "@/lib/api-client";

export interface Student {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number;
  qrCode: string;
  profilePicture: string;
  biometricEnrolledAt?: string;
  biometricProvider?: string;
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
  qrCodeUrl: string;
  student: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
  };
}

export interface BiometricEnrollmentLinkResponse {
  enrollmentLink: {
    token: string;
    url: string;
    expiresAt: string;
    studentName: string;
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
    data: CreateStudentData,
    profilePicture: File
  ): Promise<{ message: string; student: Student }> => {
    const formData = new FormData();
    formData.append("indexNumber", data.indexNumber);
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("program", data.program);
    formData.append("level", data.level.toString());
    formData.append("profilePicture", profilePicture);

    return apiClient.post<{ message: string; student: Student }>(
      "/students",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  updateStudent: async (
    id: string,
    data: UpdateStudentData,
    profilePicture?: File
  ): Promise<{ message: string; student: Student }> => {
    const formData = new FormData();
    if (data.indexNumber !== undefined)
      formData.append("indexNumber", data.indexNumber);
    if (data.firstName !== undefined)
      formData.append("firstName", data.firstName);
    if (data.lastName !== undefined) formData.append("lastName", data.lastName);
    if (data.program !== undefined) formData.append("program", data.program);
    if (data.level !== undefined)
      formData.append("level", data.level.toString());
    if (profilePicture) formData.append("profilePicture", profilePicture);

    return apiClient.put<{ message: string; student: Student }>(
      `/students/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
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

  exportStudentsPDF: async (filters?: {
    program?: string;
    level?: string;
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();

    // Use axios directly for blob response
    const response = await apiClient
      .getClient()
      .get(`/students/export/pdf${queryString ? `?${queryString}` : ""}`, {
        responseType: "blob",
      });
    return response.data;
  },

  generateBiometricEnrollmentLink: async (
    studentId: string,
    hoursValid: number = 24
  ): Promise<BiometricEnrollmentLinkResponse> => {
    return apiClient.post<BiometricEnrollmentLinkResponse>(
      `/students/${studentId}/biometric-enrollment-link`,
      { hoursValid }
    );
  },
};
