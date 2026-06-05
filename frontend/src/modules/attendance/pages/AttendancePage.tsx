import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, AttendanceRecord } from "../../../api/attendance";
import { classStreamsApi } from "../../../api/classStreams";
import { studentsApi } from "../../../api/students";
import { useState, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Check, X, Save, Calendar, Filter, History, ChevronDown, ChevronUp, Search, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const now = new Date();
  const defaultYear = now.getMonth() >= 8 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;

  const [classId, setClassId] = useState(isAdmin ? "" : (user?.assignedClasses?.[0] || ""));
  const [markDate, setMarkDate] = useState(now.toISOString().split("T")[0]);
  const [term, setTerm] = useState("term1");
  const [academicYear, setAcademicYear] = useState(defaultYear);
  const [isLastDay, setIsLastDay] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "present" | "absent">>({});
  const [showHistory, setShowHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");

  const { data: classes } = useQuery({
    queryKey: ["class-streams"],
    queryFn: () => classStreamsApi.getAll().then((r) => r.data),
  });

  const { data: classStudents } = useQuery({
    queryKey: ["students", classId],
    queryFn: () => studentsApi.getAll({ classStreamId: classId }).then((r) => r.data),
    enabled: !!classId,
  });

  const { data: existingRecords } = useQuery({
    queryKey: ["attendance", classId, markDate, term, academicYear],
    queryFn: () => attendanceApi.getAll({
      ...(classId && { classStreamId: classId }),
      ...(markDate && { date: markDate }),
      ...(term && { term }),
      ...(academicYear && { academicYear }),
    }).then((r) => r.data),
    enabled: !!classId,
  });

  const { data: historyRecords } = useQuery({
    queryKey: ["attendance", "history", classId, term, academicYear],
    queryFn: () => attendanceApi.getAll({
      ...(classId && { classStreamId: classId }),
      ...(term && { term }),
      ...(academicYear && { academicYear }),
    }).then((r) => r.data),
    enabled: !!classId,
  });

  const { data: attendanceStats } = useQuery({
    queryKey: ["attendance", "stats", classId, term, academicYear],
    queryFn: () => attendanceApi.getStats({
      ...(classId && { classStreamId: classId }),
      ...(term && { term }),
      ...(academicYear && { academicYear }),
    }).then((r) => r.data),
    enabled: !!classId,
  });

  useMemo(() => {
    if (existingRecords && existingRecords.length > 0 && classStudents) {
      const map: Record<string, "present" | "absent"> = {};
      existingRecords.forEach((r) => {
        map[r.studentId] = r.status;
      });
      classStudents.forEach((s: any) => {
        if (!map[s.id]) map[s.id] = "present";
      });
      const lastDay = existingRecords.some((r) => r.isLastDay);
      setIsLastDay(lastDay);
      setAttendanceMap(map);
    } else if (classStudents) {
      const map: Record<string, "present" | "absent"> = {};
      classStudents.forEach((s: any) => { map[s.id] = "present"; });
      setAttendanceMap(map);
      setIsLastDay(false);
    }
  }, [existingRecords, classStudents]);

  const markMutation = useMutation({
    mutationFn: (data: Parameters<typeof attendanceApi.mark>[0]) => attendanceApi.mark(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(`Saved ${res.data.marked} attendance records`);
    },
    onError: () => toast.error("Failed to save attendance"),
  });

  const handleSave = () => {
    if (!classId) { toast.error("Select a class"); return; }
    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    markMutation.mutate({ classStreamId: classId, date: markDate, term, academicYear, records, isLastDay });
  };

  const toggleStatus = (studentId: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const markAll = (status: "present" | "absent") => {
    const map: Record<string, "present" | "absent"> = {};
    classStudents?.forEach((s: any) => { map[s.id] = status; });
    setAttendanceMap(map);
  };

  const filteredHistory = useMemo(() => {
    if (!historyRecords) return [];
    let result = historyRecords;
    if (historySearch) {
      const q = historySearch.toLowerCase();
      result = result.filter((r) => {
        const name = r.student ? `${r.student.firstName} ${r.student.lastName}`.toLowerCase() : "";
        return name.includes(q);
      });
    }
    if (historyDate) {
      result = result.filter((r) => r.date === historyDate);
    }
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [historyRecords, historySearch, historyDate]);

  const uniqueDates = useMemo(() => {
    if (!historyRecords) return [];
    return [...new Set(historyRecords.map((r) => r.date))].sort().reverse();
  }, [historyRecords]);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">Mark and track student attendance</p>
        </div>
        {attendanceStats && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Attendance Rate</div>
              <div className={`text-lg font-bold ${attendanceStats.percentage >= 75 ? "text-emerald-600" : attendanceStats.percentage >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {attendanceStats.percentage}%
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Present</div>
              <div className="text-lg font-bold text-emerald-600">{attendanceStats.present}</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Absent</div>
              <div className="text-lg font-bold text-red-500">{attendanceStats.absent}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap gap-4 items-end">
          {isAdmin && (
            <div className="flex-1 min-w-[180px]">
              <label className="label">Class Stream</label>
              <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Select class...</option>
                {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Term</label>
            <select className="input" value={term} onChange={(e) => setTerm(e.target.value)}>
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="term3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input w-28" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-500"
              checked={isLastDay}
              onChange={(e) => setIsLastDay(e.target.checked)}
            />
            <span className="text-sm font-medium">Mark as Last Day of Term</span>
          </label>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => markAll("present")} className="btn-ghost text-xs text-emerald-600 hover:bg-emerald-50">
              <Check className="w-3.5 h-3.5" />
              All Present
            </button>
            <button onClick={() => markAll("absent")} className="btn-ghost text-xs text-red-500 hover:bg-red-50">
              <X className="w-3.5 h-3.5" />
              All Absent
            </button>
            <button onClick={handleSave} disabled={!classId || markMutation.isPending} className="btn-primary text-sm">
              <Save className="w-4 h-4" />
              {markMutation.isPending ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      </div>

      {classId && classStudents && (
        <div className="card-static overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{classStudents.length} Students</span>
              <span className="text-muted-foreground text-xs">on {markDate}</span>
            </div>
            {isLastDay && (
              <span className="badge-warning text-xs">
                <Shield className="w-3 h-3" />
                Last Day
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3 w-12">#</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Admission No.</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classStudents.map((s: any, idx: number) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="px-6 py-3 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="px-6 py-3 text-muted-foreground font-mono text-xs">{s.admissionNumber}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => toggleStatus(s.id)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            attendanceMap[s.id] === "present"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                              : "bg-muted text-muted-foreground border border-border hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 inline mr-1" />
                          Present
                        </button>
                        <button
                          onClick={() => toggleStatus(s.id)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            attendanceMap[s.id] === "absent"
                              ? "bg-red-100 text-red-700 border border-red-200 shadow-sm"
                              : "bg-muted text-muted-foreground border border-border hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          }`}
                        >
                          <X className="w-3.5 h-3.5 inline mr-1" />
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!classId && (
        <div className="card-static p-12 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-medium">Select a class to start marking attendance</p>
          <p className="text-xs mt-1">Choose a class stream above to load students.</p>
        </div>
      )}

      {classId && (
        <div className="card-static overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-4 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Attendance History ({filteredHistory.length} records)</span>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showHistory && (
            <div>
              <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="input pl-8 text-sm w-full"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search student..."
                  />
                </div>
                <select className="input w-auto text-sm" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)}>
                  <option value="">All dates</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Marked By</th>
                      <th className="px-4 py-3">Last Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredHistory.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs">{r.date}</td>
                        <td className="px-4 py-2.5 font-medium">
                          {r.student ? `${r.student.firstName} ${r.student.lastName}` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={r.status === "present" ? "badge-success" : "badge-danger"}>
                            {r.status === "present" ? "Present" : "Absent"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {r.marker ? `${r.marker.firstName} ${r.marker.lastName}` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {r.isLastDay ? (
                            <span className="badge-warning text-xs">Last Day</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No attendance records found for the selected filters.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
