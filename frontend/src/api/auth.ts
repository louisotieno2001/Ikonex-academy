import apiClient from "./client";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  suspend?: boolean;
  assignedClasses?: string[];
  date_created?: string;
}

export const authApi = {
  login: (data: LoginData) => apiClient.post("/auth/login", data),
  register: (data: RegisterData) => apiClient.post("/auth/register", data),
  getMe: () => apiClient.get("/auth/me"),
  updateMe: (data: Partial<User>) => apiClient.patch("/auth/me", data),
  listUsers: () => apiClient.get<User[]>("/auth/users"),
  updateUserRole: (id: string, data: { role?: string; assignedClasses?: string[] }) =>
    apiClient.patch<User>(`/auth/users/${id}/role`, data),
  toggleSuspend: (id: string) => apiClient.patch<{ id: string; suspend: boolean }>(`/auth/users/${id}/suspend`),
  deleteUser: (id: string) => apiClient.delete(`/auth/users/${id}`),
};
