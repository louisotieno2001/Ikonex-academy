import apiClient from "./client";

export interface Assessment {
  id: string;
  studentId: string;
  subjectId: string;
  term: string;
  academicYear: string;
  type: "exam" | "continuous_assessment";
  score: number;
  maxScore: number;
  remarks?: string;
  student?: any;
  subject?: { id: string; name: string; code: string };
  createdAt: string;
}

export const assessmentsApi = {
  getAll: (params?: Record<string, string>) =>
    apiClient.get<Assessment[]>("/assessments", { params }),
  getById: (id: string) => apiClient.get<Assessment>(`/assessments/${id}`),
  create: (data: Partial<Assessment>) => apiClient.post<Assessment>("/assessments", data),
  update: (id: string, data: Partial<Assessment>) => apiClient.put<Assessment>(`/assessments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/assessments/${id}`),
};
