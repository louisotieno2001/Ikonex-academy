import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { LoginPage, SignupPage, ApprovalPage, UserManagementPage } from "./modules/auth";
import { DashboardPage } from "./modules/dashboard";
import { ClassStreamsPage, ClassStreamDetailPage } from "./modules/class-streams";
import { StudentsPage, StudentDetailPage } from "./modules/students";
import { SubjectsPage } from "./modules/subjects";
import { AssessmentsPage } from "./modules/assessments";
import { ReportsPage } from "./modules/reports";
import { LogsPage } from "./modules/system";
import { AttendancePage } from "./modules/attendance";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/approval" element={<ApprovalPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="class-streams" element={<ClassStreamsPage />} />
        <Route path="class-streams/:id" element={<ClassStreamDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
}
