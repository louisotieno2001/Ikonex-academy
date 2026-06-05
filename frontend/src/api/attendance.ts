import apiClient from "./client";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classStreamId: string;
  date: string;
  status: "present" | "absent";
  term: string;
  academicYear: string;
  isLastDay: boolean;
  markedBy?: string;
  student?: { id: string; firstName: string; lastName: string; admissionNumber: string };
  classStream?: { id: string; name: string };
  marker?: { id: string; firstName: string; lastName: string };
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export const attendanceApi = {
  getAll: (params?: Record<string, string>) =>
    apiClient.get<AttendanceRecord[]>("/attendance", { params }),
  getDates: (params?: Record<string, string>) =>
    apiClient.get<{ classStreamId: string; date: string; isLastDay: boolean }[]>("/attendance/dates", { params }),
  getStats: (params?: Record<string, string>) =>
    apiClient.get<AttendanceStats>("/attendance/stats", { params }),
  mark: (data: {
    classStreamId: string;
    date: string;
    term: string;
    academicYear: string;
    records: { studentId: string; status: "present" | "absent" }[];
    isLastDay?: boolean;
  }) => apiClient.post<{ success: boolean; marked: number; totalStudents: number }>("/attendance/mark", data),
};
