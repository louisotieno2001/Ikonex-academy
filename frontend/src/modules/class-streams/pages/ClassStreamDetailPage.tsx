import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { classStreamsApi } from "../../../api/classStreams";
import { reportsApi } from "../../../api/reports";
import { ArrowLeft, Users, BookOpen, GraduationCap, Award, BarChart2, Download, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { saveAs } from "../../../utils/saveAs";

export default function ClassStreamDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data, isLoading } = useQuery({
    queryKey: ["class-stream", id],
    queryFn: () => classStreamsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: reportData, isLoading: loadingReport } = useQuery({
    queryKey: ["class-report", id],
    queryFn: () => reportsApi.getClassReport(id!).then((r) => r.data),
    enabled: !!id,
  });

  const downloadPdf = async () => {
    try {
      const res = await reportsApi.getClassPdf(id!);
      saveAs(res.data, `class-report-${data?.name}.pdf`);
      toast.success("Report downloaded successfully");
    } catch (err) {
      toast.error("Failed to download report");
    }
  };

  if (isLoading) return (
    <div className="max-w-5xl space-y-6">
      <div className="h-6 w-32 skeleton rounded" />
      <div className="h-64 skeleton rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-96 skeleton rounded-2xl" />
        <div className="h-96 skeleton rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 bg-muted/20 rounded-3xl">
      <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
      <p className="text-lg font-bold">Class stream not found</p>
      <Link to="/dashboard/class-streams" className="btn-primary mt-4 py-2">Return to Classes</Link>
    </div>
  );

  const subjectAverages = reportData?.students?.reduce((acc: any, student: any) => {
    student.subjects.forEach((sub: any) => {
      if (!acc[sub.name]) acc[sub.name] = { name: sub.name, total: 0, count: 0 };
      acc[sub.name].total += sub.total;
      acc[sub.name].count += 1;
    });
    return acc;
  }, {});

  const chartData = subjectAverages ? Object.values(subjectAverages).map((s: any) => ({
    name: s.name,
    Average: Math.round(s.total / s.count)
  })) : [];

  const topStudents = reportData?.students?.slice(0, 3) || [];

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/class-streams" className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{data.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {data.studentCount ?? data.students?.length ?? 0} Students</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {data.classSubjects?.length || 0} Subjects</span>
            </div>
          </div>
        </div>
        <button onClick={downloadPdf} className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
          <Download className="w-4 h-4" />
          Export Performance Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Chart */}
          <div className="card-static p-6 bg-gradient-to-br from-brand-50/50 to-transparent dark:from-brand-900/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-brand-600" />
                  Subject Performance Analysis
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Average scores across all curriculum areas</p>
              </div>
            </div>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="Average" radius={[6, 6, 0, 0]} maxBarSize={45}>
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--accent)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 opacity-10 mb-2" />
                  <p className="text-sm italic">Record assessment scores to see analytics</p>
                </div>
              )}
            </div>
          </div>

          {/* Student Rankings */}
          <div className="card-static overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Performance Leaderboard
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Mean Score</th>
                    <th className="px-6 py-4 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData?.students?.map((s: any) => (
                    <tr key={s.studentId} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          s.position === 1 ? 'bg-amber-100 text-amber-700' :
                          s.position === 2 ? 'bg-slate-100 text-slate-700' :
                          s.position === 3 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {s.position}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/dashboard/students/${s.studentId}`} className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-brand-600 transition-colors">{s.studentName}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">{s.admissionNumber}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-brand-600">
                        {s.average.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="w-24 h-1.5 bg-muted rounded-full ml-auto overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${s.average >= 70 ? 'bg-emerald-500' : s.average >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${s.average}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!reportData?.students?.length && (
                <div className="p-12 text-center text-muted-foreground italic">No results processed yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Top Performers Podium */}
          <div className="card-static p-6 bg-brand-600 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
            <Award className="absolute -right-4 -top-4 w-32 h-32 opacity-10 rotate-12" />
            <h2 className="text-xl font-bold mb-6 relative z-10">Class Podium</h2>
            <div className="space-y-4 relative z-10">
              {topStudents.map((s: any, i: number) => (
                <div key={s.studentId} className="flex items-center gap-4 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                    i === 0 ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/30' : 
                    i === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-300 text-orange-950'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{s.studentName}</div>
                    <div className="text-[10px] opacity-80 uppercase tracking-widest">{s.average.toFixed(1)}% Score</div>
                  </div>
                </div>
              ))}
              {topStudents.length === 0 && <p className="text-sm opacity-80 text-center py-4">Ranking will appear here</p>}
            </div>
          </div>

          {/* Subject Assignments */}
          <div className="card-static p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Assigned Subjects
              </h2>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{data.classSubjects?.length || 0}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {data.classSubjects?.map((cs: any) => (
                <div key={cs.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">{cs.subject?.name}</span>
                </div>
              ))}
              {!data.classSubjects?.length && (
                <div className="text-center py-6 text-muted-foreground text-xs italic">No subjects assigned</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
