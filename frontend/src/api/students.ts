// Students API — CRUD operations for student records
import apiClient from "./client";

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address?: string;
  phoneNumber?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  medicalInfo?: string;
  isActive: boolean;
  enrollmentDate?: string;
  classStreamId?: string;
  classStream?: { id: string; name: string; code: string };
  createdAt: string;
}

export const studentsApi = {
  getAll: (params?: { classStreamId?: string }) =>
    apiClient.get<Student[]>("/students", { params }),
  getById: (id: string) => apiClient.get<Student>(`/students/${id}`),
  create: (data: Partial<Student>) => apiClient.post<Student>("/students", data),
  update: (id: string, data: Partial<Student>) => apiClient.put<Student>(`/students/${id}`, data),
  delete: (id: string) => apiClient.delete(`/students/${id}`),
};
