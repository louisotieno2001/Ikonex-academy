import apiClient from "./client";

export interface ClassStream {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  students?: any[];
  studentCount?: number;
  classSubjects?: any[];
  createdAt: string;
}

export const classStreamsApi = {
  getAll: () => apiClient.get<ClassStream[]>("/class-streams"),
  getById: (id: string) => apiClient.get<ClassStream>(`/class-streams/${id}`),
  create: (data: Partial<ClassStream>) => apiClient.post<ClassStream>("/class-streams", data),
  update: (id: string, data: Partial<ClassStream>) => apiClient.put<ClassStream>(`/class-streams/${id}`, data),
  delete: (id: string) => apiClient.delete(`/class-streams/${id}`),
};
