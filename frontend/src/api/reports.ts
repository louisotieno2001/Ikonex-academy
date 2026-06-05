import apiClient from "./client";

export interface GradingScale {
  id: string;
  grade: string;
  lowerBound: number;
  upperBound: number;
  label: string;
  gradePoint: number;
}

export const reportsApi = {
  getGradingScales: () => apiClient.get<GradingScale[]>("/reports/grading-scales"),
  saveGradingScale: (data: Partial<GradingScale>) =>
    apiClient.post<GradingScale>("/reports/grading-scales", data),
  updateGradingScale: (id: string, data: Partial<GradingScale>) =>
    apiClient.put<GradingScale>(`/reports/grading-scales/${id}`, data),
  deleteGradingScale: (id: string) =>
    apiClient.delete(`/reports/grading-scales/${id}`),
  getStudentReport: (studentId: string, params?: Record<string, string>) =>
    apiClient.get(`/reports/student/${studentId}`, { params }),
  getClassReport: (classStreamId: string, params?: Record<string, string>) =>
    apiClient.get(`/reports/class/${classStreamId}`, { params }),
  getStudentPdf: (studentId: string, params?: Record<string, string>) =>
    apiClient.get(`/reports/student/${studentId}/pdf`, { params, responseType: "blob" }),
  getClassPdf: (classStreamId: string, params?: Record<string, string>) =>
    apiClient.get(`/reports/class/${classStreamId}/pdf`, { params, responseType: "blob" }),
};
