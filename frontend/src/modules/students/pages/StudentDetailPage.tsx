import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { studentsApi } from "../../../api/students";
import { assessmentsApi } from "../../../api/assessments";
import { reportsApi } from "../../../api/reports";
import { ArrowLeft, GraduationCap, Calendar, Users, Phone, Mail, ClipboardCheck, Award, TrendingUp, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "../../../utils/saveAs";

// Student profile — personal details, academic history, term performance, download report card
export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: () => studentsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ["student-report", id],
    queryFn: () => reportsApi.getStudentReport(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: assessments } = useQuery({
    queryKey: ["assessments", { studentId: id }],
    queryFn: () => assessmentsApi.getAll({ studentId: id! }).then((r) => r.data),
    enabled: !!id,
  });

  const downloadReportCard = async () => {
    try {
      const res = await reportsApi.getStudentPdf(id!);
      saveAs(res.data, `report-card-${student?.admissionNumber}.pdf`);
      toast.success("Report card downloaded");
    } catch (err) {
      toast.error("Failed to download report card");
    }
  };

  if (isLoading) return (
    <div className="max-w-4xl space-y-6">
      <div className="h-6 w-32 skeleton rounded" />
      <div className="h-64 skeleton rounded-2xl" />
      <div className="h-96 skeleton rounded-2xl" />
    </div>
  );

  if (!student) return (
    <div className="text-center py-12 text-muted-foreground">
      <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <p className="font-medium text-lg">Student profile not found</p>
      <Link to="/dashboard/students" className="btn-primary mt-4 py-2">Back to Students</Link>
    </div>
  );

  const scoreColor = (score: number, max: number = 100) => {
    const pct = (score / max) * 100;
    if (pct >= 70) return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800";
    if (pct >= 40) return "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800";
    return "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/dashboard/students" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </Link>
        <button onClick={downloadReportCard} className="btn-primary flex items-center gap-2 bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20">
          <Download className="w-4 h-4" />
          Download Report Card
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-static p-8 bg-gradient-to-br from-brand-50/50 to-transparent dark:from-brand-900/10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <div className="w-24 h-24 rounded-3xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0 shadow-inner">
                <GraduationCap className="w-12 h-12 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h1 className="text-3xl font-black text-foreground">{student.firstName} {student.lastName}</h1>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${student.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white dark:bg-ink-900 border border-border text-xs font-mono font-bold text-muted-foreground shadow-sm">
                    {student.admissionNumber}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white dark:bg-ink-900 border border-border text-xs font-bold text-brand-600 capitalize shadow-sm">
                    {student.gender}
                  </span>
                  {student.classStream?.name && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-bold shadow-sm">
                      {student.classStream.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {[
                { icon: Calendar, label: "Birth Date", value: new Date(student.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) },
                { icon: Users, label: "Parent/Guardian", value: student.parentName || "—" },
                { icon: Phone, label: "Contact Phone", value: student.parentPhone || "—" },
              ].map((item) => (
                <div key={item.label} className="group p-4 rounded-2xl bg-white/50 dark:bg-ink-950/50 border border-border/50 hover:border-brand-500/20 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="text-sm font-bold text-foreground truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-static overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-brand-600" />
                Detailed Academic History
              </h2>
            </div>
            {assessments && assessments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Period</th>
                      <th className="px-6 py-4">Assessment Type</th>
                      <th className="px-6 py-4 text-right">Score Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assessments.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{a.subject?.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono uppercase">{a.subject?.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-foreground capitalize">{a.term.replace("term", "Term ")}</div>
                          <div className="text-[10px] text-muted-foreground">{a.academicYear} Academic Year</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${a.type === "exam" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                            {a.type === "exam" ? "End of Term Exam" : "Continuous Assessment"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-xl font-mono text-sm font-black border-2 ${scoreColor(a.score, a.maxScore)}`}>
                            {a.score} <span className="mx-1 opacity-50 text-[10px] font-normal">/</span> {a.maxScore}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground italic">
                <ClipboardCheck className="w-12 h-12 mx-auto opacity-10 mb-4" />
                <p className="text-sm">No assessment results recorded for this student yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Performance Summary Card */}
          <div className="card-static p-8 bg-brand-600 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
            <Award className="absolute -right-6 -bottom-6 w-40 h-40 opacity-10 rotate-12" />
            <h2 className="text-xl font-black mb-8 relative z-10 tracking-tight">Term Performance</h2>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Class Position</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{report?.totals?.classPosition || "—"}</span>
                    <span className="text-sm font-bold opacity-60">/ {report?.totals?.totalStudents || 0}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="h-px bg-white/20"></div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Average Score</div>
                  <div className="text-lg font-black">{report?.totals?.average?.toFixed(1) || "0.0"}%</div>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${report?.totals?.average || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Marks</div>
                  <div className="text-lg font-black">{report?.totals?.totalMarks || 0}</div>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Subjects</div>
                  <div className="text-lg font-black">{report?.subjects?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-static p-6 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Subject Breakdown
            </h2>
            <div className="space-y-4">
              {report?.subjects?.map((s: any) => (
                <div key={s.subjectId} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground">{s.subjectName}</span>
                    <span className={`font-black ${s.grade === 'A' ? 'text-emerald-600' : 'text-brand-600'}`}>{s.grade}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${s.total >= 70 ? 'bg-emerald-500' : s.total >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${s.total}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {!report?.subjects?.length && (
                <p className="text-xs text-muted-foreground italic text-center py-4">No subjects recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
