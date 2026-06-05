import apiClient from "./client";

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export const subjectsApi = {
  getAll: () => apiClient.get<Subject[]>("/subjects"),
  getById: (id: string) => apiClient.get<Subject>(`/subjects/${id}`),
  create: (data: Partial<Subject>) => apiClient.post<Subject>("/subjects", data),
  update: (id: string, data: Partial<Subject>) => apiClient.put<Subject>(`/subjects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/subjects/${id}`),
  assign: (classStreamId: string, subjectIds: string[]) =>
    apiClient.post("/subjects/assign", { classStreamId, subjectIds }),
  unassign: (classStreamId: string, subjectId: string) =>
    apiClient.delete(`/subjects/assign/${classStreamId}/${subjectId}`),
};
