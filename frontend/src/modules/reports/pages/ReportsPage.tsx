import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classStreamsApi } from "../../../api/classStreams";
import { studentsApi } from "../../../api/students";
import { reportsApi, GradingScale } from "../../../api/reports";
import { useState } from "react";
import { FileText, Download, Search, BarChart3, Settings, Plus, Save, Trash2, Award, Check, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "sonner";
import { saveAs } from "../../../utils/saveAs";

export default function Reports() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  const [activeTab, setActiveTab] = useState<"class" | "student" | "scales">("class");
  const [classId, setClassId] = useState(isTeacher ? (user?.assignedClasses?.[0] || "") : "");
  const [studentId, setStudentId] = useState("");
  const now = new Date();
  const defaultAcademicYear = now.getMonth() >= 8 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;

  const [term, setTerm] = useState("term1");
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);

  const [showScaleForm, setShowScaleForm] = useState(false);
  const [editingScale, setEditingScale] = useState<GradingScale | null>(null);
  const [newScale, setNewScale] = useState<Partial<GradingScale>>({ grade: "", lowerBound: 0, upperBound: 100, label: "", gradePoint: 0 });

  const { data: classes } = useQuery({
    queryKey: ["class-streams"],
    queryFn: () => classStreamsApi.getAll().then((r) => r.data),
  });

  const { data: classStudents } = useQuery({
    queryKey: ["students", classId],
    queryFn: () => studentsApi.getAll({ classStreamId: classId }).then((r) => r.data),
    enabled: !!classId,
  });

  const { data: classReport, refetch: refetchClass, isFetching: classLoading } = useQuery({
    queryKey: ["class-report", classId, term, academicYear],
    queryFn: () => reportsApi.getClassReport(classId, { term, academicYear }).then((r) => r.data),
    enabled: false,
  });

  const { data: studentReport, refetch: refetchStudent, isFetching: studentLoading } = useQuery({
    queryKey: ["student-report", studentId, term, academicYear],
    queryFn: () => reportsApi.getStudentReport(studentId, { term, academicYear }).then((r) => r.data),
    enabled: false,
  });

  const { data: scales } = useQuery({
    queryKey: ["grading-scales"],
    queryFn: () => reportsApi.getGradingScales().then((r) => r.data),
    enabled: isAdmin && activeTab === "scales",
  });

  const createScaleMutation = useMutation({
    mutationFn: (data: Partial<GradingScale>) => reportsApi.saveGradingScale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      setShowScaleForm(false);
      setNewScale({ grade: "", lowerBound: 0, upperBound: 100, label: "", gradePoint: 0 });
      toast.success("Grading scale created");
    },
    onError: () => toast.error("Failed to create grading scale"),
  });

  const updateScaleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradingScale> }) =>
      reportsApi.updateGradingScale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      setEditingScale(null);
      toast.success("Grading scale updated");
    },
    onError: () => toast.error("Failed to update grading scale"),
  });

  const deleteScaleMutation = useMutation({
    mutationFn: (id: string) => reportsApi.deleteGradingScale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      toast.success("Grading scale deleted");
    },
    onError: () => toast.error("Failed to delete grading scale"),
  });

  const generateClassPdf = async () => {
    try {
      const res = await reportsApi.getClassPdf(classId, { term, academicYear });
      saveAs(res.data, `class-report-${classId}.pdf`);
      toast.success("PDF generated");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const generateStudentPdf = async (sid: string) => {
    try {
      const res = await reportsApi.getStudentPdf(sid, { term, academicYear });
      saveAs(res.data, `report-card-${sid}.pdf`);
      toast.success("PDF generated");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate, analyze and export performance results.</p>
        </div>
        <div className="flex p-1 bg-muted rounded-xl gap-1">
          <button 
            onClick={() => setActiveTab("class")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'class' ? 'bg-background shadow-sm text-brand-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Class Analysis
          </button>
          <button 
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'student' ? 'bg-background shadow-sm text-brand-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Report Cards
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab("scales")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'scales' ? 'bg-background shadow-sm text-brand-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Settings className="w-3.5 h-3.5 inline mr-1.5" />
              Grading Scales
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === "class" && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="label">Select Class Stream</label>
                  <select 
                    className="input" 
                    value={classId} 
                    onChange={(e) => setClassId(e.target.value)}
                    disabled={isTeacher}
                  >
                    {!isTeacher && <option value="">Select class...</option>}
                    {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Term</label>
                  <select className="input" value={term} onChange={(e) => setTerm(e.target.value)}>
                    <option value="term1">First Term</option>
                    <option value="term2">Second Term</option>
                    <option value="term3">Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input className="input w-24" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => refetchClass()} disabled={!classId || classLoading} className="btn-primary">
                    <Search className="w-4 h-4" />
                    Process Data
                  </button>
                  <button onClick={generateClassPdf} disabled={!classId} className="btn-secondary">
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {classReport && (
              <div className="card-static overflow-hidden animate-slide-up border-brand-500/20">
                <div className="bg-brand-600 text-white p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">{classReport.classStream.name} - Performance Report</h2>
                    <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-bold">{term} &middot; {academicYear} Academic Year</p>
                  </div>
                  <BarChart3 className="w-10 h-10 opacity-20" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-left text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Student Identity</th>
                        {classReport.students[0]?.subjects?.map((s: any) => (
                          <th key={s.name} className="px-4 py-4 text-center">{s.name}</th>
                        ))}
                        <th className="px-6 py-4 text-right">Aggregate</th>
                        <th className="px-6 py-4 text-right">Mean</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {classReport.students.map((s: any) => (
                        <tr key={s.studentId} className="hover:bg-brand-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                              s.position === 1 ? "bg-amber-100 text-amber-700 shadow-sm" :
                              s.position === 2 ? "bg-slate-100 text-slate-700 shadow-sm" :
                              s.position === 3 ? "bg-orange-100 text-orange-700 shadow-sm" :
                              "bg-muted/50 text-muted-foreground"
                            }`}>
                              {s.position}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground group-hover:text-brand-600 transition-colors">{s.studentName}</div>
                            <div className="text-[10px] font-mono text-muted-foreground uppercase">{s.admissionNumber}</div>
                          </td>
                          {s.subjects?.map((sub: any) => (
                            <td key={sub.name} className="px-4 py-4 text-center">
                              <span className={`font-mono font-bold text-xs ${sub.total >= 70 ? 'text-emerald-600' : sub.total < 40 ? 'text-red-500' : 'text-foreground'}`}>
                                {sub.total}
                              </span>
                            </td>
                          ))}
                          <td className="px-6 py-4 text-right font-black text-brand-600">{s.totalMarks}</td>
                          <td className="px-6 py-4 text-right font-black text-foreground bg-muted/20">{s.average.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "student" && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="label">Select Class</label>
                  <select 
                    className="input" 
                    value={classId} 
                    onChange={(e) => setClassId(e.target.value)}
                    disabled={isTeacher}
                  >
                    {!isTeacher && <option value="">Select class...</option>}
                    {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="label">Select Student</label>
                  <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId}>
                    <option value="">Choose student...</option>
                    {classStudents?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => refetchStudent()} disabled={!studentId || studentLoading} className="btn-primary">
                    <FileText className="w-4 h-4" />
                    Preview Report
                  </button>
                  <button onClick={() => generateStudentPdf(studentId)} disabled={!studentId} className="btn-secondary">
                    <Download className="w-4 h-4" />
                    Print PDF
                  </button>
                </div>
              </div>
            </div>

            {studentReport && (
              <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
                <div className="card-static overflow-hidden border-accent-500/20">
                  <div className="bg-accent-600 text-white p-8 text-center relative">
                    <Award className="absolute left-6 top-6 w-12 h-12 opacity-20" />
                    <h2 className="text-2xl font-black tracking-tight">{studentReport.student.name}</h2>
                    <p className="text-sm font-bold opacity-80 mt-1">OFFICIAL REPORT CARD &middot; {studentReport.student.className}</p>
                    <div className="mt-4 inline-flex items-center gap-4 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold border border-white/20">
                      <span>ADM: {studentReport.student.admissionNumber}</span>
                      <span className="opacity-50">|</span>
                      <span>TERM: {studentReport.term.toUpperCase()}</span>
                      <span className="opacity-50">|</span>
                      <span>YEAR: {studentReport.academicYear}</span>
                    </div>
                  </div>

                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 text-left text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                          <th className="px-8 py-4">Subject Curriculum</th>
                          <th className="px-6 py-4 text-center">Exam (50%)</th>
                          <th className="px-6 py-4 text-center">CA (50%)</th>
                          <th className="px-6 py-4 text-center">Total Score</th>
                          <th className="px-8 py-4 text-center">Final Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {studentReport.subjects.map((s: any) => (
                          <tr key={s.subjectId} className="hover:bg-muted/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="font-bold text-foreground text-base">{s.subjectName}</div>
                              <div className="text-[10px] font-mono text-muted-foreground">{s.subjectId.code || 'CORE'}</div>
                            </td>
                            <td className="px-6 py-5 text-center font-mono font-medium">{s.examScore}</td>
                            <td className="px-6 py-5 text-center font-mono font-medium">{s.caScore}</td>
                            <td className="px-6 py-5 text-center font-mono font-black text-brand-600 text-base">{s.total}</td>
                            <td className="px-8 py-5 text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg shadow-sm border ${
                                s.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                s.grade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                s.grade === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {s.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/80 border-t-2 border-muted-foreground/20">
                          <td className="px-8 py-6">
                            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Overall Assessment</div>
                            <div className="text-sm font-bold text-foreground">Term Cumulative Performance</div>
                          </td>
                          <td colSpan={2}></td>
                          <td className="px-6 py-6 text-center">
                            <div className="text-xl font-black text-foreground">{studentReport.totals.totalMarks}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Agg. Points</div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="text-xl font-black text-accent-700">{studentReport.totals.average.toFixed(1)}%</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Mean Grade</div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="card-static p-6 flex items-center justify-between border-brand-500/20 bg-brand-50/30">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-1">Class Position</div>
                      <div className="text-3xl font-black text-brand-950">#{studentReport.totals.classPosition}</div>
                    </div>
                    <Award className="w-12 h-12 text-brand-600 opacity-20" />
                  </div>
                  <div className="card-static p-6 flex items-center justify-between border-emerald-500/20 bg-emerald-50/30">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Student Status</div>
                      <div className="text-xl font-black text-emerald-950">PROMOTED</div>
                    </div>
                    <Check className="w-12 h-12 text-emerald-600 opacity-20" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "scales" && isAdmin && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Grading Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">Define how percentages translate to academic grades.</p>
              </div>
              <button 
                onClick={() => { setShowScaleForm(true); setEditingScale(null); }} 
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Scale
              </button>
            </div>

            {showScaleForm && (
              <div className="card p-6 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between">
                  <h3 className="section-title">{editingScale ? "Edit Grading Scale" : "New Grading Scale"}</h3>
                  <button onClick={() => { setShowScaleForm(false); setEditingScale(null); }} className="btn-ghost text-xs p-1.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="label">Grade</label>
                    <input 
                      className="input" 
                      value={editingScale ? editingScale.grade : newScale.grade} 
                      onChange={(e) => {
                        if (editingScale) setEditingScale({ ...editingScale, grade: e.target.value });
                        else setNewScale({ ...newScale, grade: e.target.value });
                      }}
                      placeholder="e.g. A"
                    />
                  </div>
                  <div>
                    <label className="label">Lower Bound (%)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={editingScale ? editingScale.lowerBound : newScale.lowerBound} 
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (editingScale) setEditingScale({ ...editingScale, lowerBound: v });
                        else setNewScale({ ...newScale, lowerBound: v });
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Upper Bound (%)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={editingScale ? editingScale.upperBound : newScale.upperBound} 
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (editingScale) setEditingScale({ ...editingScale, upperBound: v });
                        else setNewScale({ ...newScale, upperBound: v });
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Grade Point</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input" 
                      value={editingScale ? editingScale.gradePoint : newScale.gradePoint} 
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (editingScale) setEditingScale({ ...editingScale, gradePoint: v });
                        else setNewScale({ ...newScale, gradePoint: v });
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Descriptor</label>
                    <input 
                      className="input" 
                      value={editingScale ? editingScale.label || "" : newScale.label || ""} 
                      onChange={(e) => {
                        if (editingScale) setEditingScale({ ...editingScale, label: e.target.value });
                        else setNewScale({ ...newScale, label: e.target.value });
                      }}
                      placeholder="e.g. Excellent"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      const data = editingScale || newScale;
                      if (editingScale) {
                        updateScaleMutation.mutate({ id: editingScale.id, data });
                      } else {
                        createScaleMutation.mutate(data);
                      }
                    }}
                    className="btn-primary"
                    disabled={!editingScale?.grade && !newScale.grade}
                  >
                    <Save className="w-4 h-4" />
                    {editingScale ? "Save Changes" : "Create Scale"}
                  </button>
                  <button onClick={() => { setShowScaleForm(false); setEditingScale(null); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scales?.map((scale) => (
                <div key={scale.id} className="card p-5 space-y-4 hover:border-brand-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center font-black text-xl text-brand-600">
                      {scale.grade}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Points</div>
                      <div className="text-lg font-black">{scale.gradePoint}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Range</div>
                        <div className="text-sm font-bold">{scale.lowerBound}% - {scale.upperBound}%</div>
                      </div>
                    </div>
                    {scale.label && (
                      <div className="text-xs text-muted-foreground mt-1 italic">{scale.label}</div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => { setEditingScale(scale); setShowScaleForm(true); }} 
                      className="btn-secondary flex-1 py-1.5 text-xs"
                    >
                      <Save className="w-3 h-3" />
                      Edit
                    </button>
                    <button 
                      onClick={() => { if (confirm("Delete this grading scale?")) deleteScaleMutation.mutate(scale.id); }}
                      className="btn-ghost text-destructive hover:bg-destructive/10 py-1.5 px-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {scales?.length === 0 && !showScaleForm && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Settings className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No grading scales configured</p>
                  <p className="text-xs mt-1">Add at least one scale to enable grade computation.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
