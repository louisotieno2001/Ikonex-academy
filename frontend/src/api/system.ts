// System API — server status and activity logs
import apiClient from "./client";

export interface SystemStatus {
  directus: "connected" | "disconnected" | "error";
  uptime: { days: number; hours: number; minutes: number; totalSeconds: number };
  counts: { users: number; students: number; classes: number; logs: number };
  pendingUsers: number;
  recentSignups: Array<{ id: string; name: string; email: string; role: string; date: string }>;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  action: string;
  description: string;
  level: "info" | "warn" | "error";
  userId: string | null;
  timestamp: string;
}

export const systemApi = {
  getStatus: () => apiClient.get<SystemStatus>("/system/status"),
  getLogs: (params?: { limit?: number; level?: string; action?: string }) =>
    apiClient.get<SystemLog[]>("/system/logs", { params }),
};