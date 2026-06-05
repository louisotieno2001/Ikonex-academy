import { useQuery } from "@tanstack/react-query";
import { classStreamsApi } from "../../../api/classStreams";
import { studentsApi } from "../../../api/students";
import { subjectsApi } from "../../../api/subjects";
import { systemApi } from "../../../api/system";
import { Link } from "react-router-dom";
import { Users, GraduationCap, BookOpen, ArrowRight, Shield, Award, TrendingUp, FileText, Server, Activity, UserPlus, Database, Clock, List } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "../../../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  const { data: classes } = useQuery({ queryKey: ["class-streams"], queryFn: () => classStreamsApi.getAll().then((r) => r.data) });
  const { data: students } = useQuery({ queryKey: ["students"], queryFn: () => studentsApi.getAll().then((r) => r.data) });
  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: () => subjectsApi.getAll().then((r) => r.data) });
  const { data: systemStatus } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => systemApi.getStatus().then((r) => r.data),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const teacherClass = classes?.find(c => c.id === user?.assignedClasses?.[0]);
  const classStudents = students?.filter(s => s.classStreamId === user?.assignedClasses?.[0]) || [];

  const stats = isAdmin ? [
    { label: "Class Streams", value: classes?.length || 0, icon: Users, color: "bg-brand-500", href: "/dashboard/class-streams" },
    { label: "Total Students", value: students?.length || 0, icon: GraduationCap, color: "bg-accent-500", href: "/dashboard/students" },
    { label: "Subjects", value: subjects?.length || 0, icon: BookOpen, color: "bg-blue-500", href: "/dashboard/subjects" },
  ] : [
    { label: "My Class", value: teacherClass?.name || "Assigning...", icon: Shield, color: "bg-brand-500", href: `/dashboard/class-streams/${user?.assignedClasses?.[0]}` },
    { label: "My Students", value: classStudents.length, icon: Users, color: "bg-accent-500", href: "/dashboard/students" },
    { label: "Class Subjects", value: subjects?.length || 0, icon: BookOpen, color: "bg-blue-500", href: "/dashboard/subjects" },
  ];

  const classData = isAdmin ? classes?.map((c) => ({
    name: c.name,
    Students: c.studentCount || students?.filter((s) => s.classStreamId === c.id).length || 0,
  })) || [] : [];

  const COLORS = ['var(--primary)', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-title">Welcome back, {user?.firstName}!</h1>
        <p className="text-muted-foreground">Here's what's happening at Ikonex Academy today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.href} className="card p-5 flex items-center gap-4 group hover:ring-1 ring-brand-500/20">
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/10`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-foreground transition-all group-hover:translate-x-1 shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isAdmin && classData.length > 0 && (
            <div className="card-static p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Class Distribution</h2>
                  <p className="text-xs text-muted-foreground">Student enrollment across all streams</p>
                </div>
                <Users className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: 13, background: "var(--card)", color: "var(--card-foreground)" }}
                      cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    />
                    <Bar dataKey="Students" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {classData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {isTeacher && (
            <div className="card-static p-6 bg-gradient-to-br from-brand-500/5 to-transparent border-brand-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Teacher Overview</h2>
                  <p className="text-xs text-muted-foreground">Class performance and tasks</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Student Attendance</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold">98%</div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-3">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Scores Recorded</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold">Term 1</span>
                  </div>
                  <div className="text-2xl font-bold">85%</div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-3">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-brand-600 text-white flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <div className="text-sm font-medium opacity-90">Ready to process results?</div>
                  <Link to="/dashboard/reports" className="inline-flex items-center gap-2 mt-2 text-xs font-bold bg-white text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                    Generate Report Cards
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <FileText className="w-20 h-20 text-white/10 absolute -right-4 -bottom-4 rotate-12" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-static p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Register Student", href: "/dashboard/students", desc: "Add student to class", role: null },
                { label: "User Management", href: "/dashboard/users", desc: "Manage staff & roles", role: "admin" },
                { label: "Record Scores", href: "/dashboard/assessments", desc: "Enter exam/CA marks", role: null },
                { label: "Report Cards", href: "/dashboard/reports", desc: "Generate PDF reports", role: null },
              ].filter(a => !a.role || a.role === user?.role).map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted transition-all group"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">{action.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{action.desc}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-background transition-colors">
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      {isAdmin && systemStatus && (
        <div className="card-static p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">System Status</h2>
                <p className="text-xs text-muted-foreground">Live telemetry &middot; refreshes every 30s</p>
              </div>
            </div>
            <Link to="/dashboard/logs" className="btn-secondary text-xs">
              <List className="w-3.5 h-3.5" />
              View Logs
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Database className={`w-4 h-4 ${systemStatus.directus === 'connected' ? 'text-emerald-500' : 'text-red-500'}`} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Directus</span>
              </div>
              <div className={`text-sm font-bold ${systemStatus.directus === 'connected' ? 'text-emerald-600' : 'text-red-600'}`}>
                {systemStatus.directus === 'connected' ? 'Connected' : systemStatus.directus === 'error' ? 'Error' : 'Disconnected'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Uptime</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                {systemStatus.uptime.days > 0 && `${systemStatus.uptime.days}d `}
                {systemStatus.uptime.hours}h {systemStatus.uptime.minutes}m
              </div>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Users</span>
              </div>
              <div className="text-sm font-bold text-foreground">{systemStatus.counts.users} total</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{systemStatus.pendingUsers} pending approval</div>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-accent-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data</span>
              </div>
              <div className="text-sm font-bold text-foreground">{systemStatus.counts.students} students</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{systemStatus.counts.classes} classes</div>
            </div>
          </div>

          {systemStatus.recentSignups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Signups (7 days)</h3>
              </div>
              <div className="space-y-1">
                {systemStatus.recentSignups.map((signup) => (
                  <div key={signup.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-background border border-border text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">
                        {signup.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground truncate">{signup.name}</span>
                      <span className="text-muted-foreground hidden sm:inline">{signup.email}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-bold text-muted-foreground uppercase">{signup.role}</span>
                      <span className="text-muted-foreground">{new Date(signup.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
