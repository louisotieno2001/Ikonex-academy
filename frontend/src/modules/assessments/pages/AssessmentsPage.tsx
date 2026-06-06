import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentsApi, Assessment } from "../../../api/assessments";
import { studentsApi } from "../../../api/students";
import { subjectsApi } from "../../../api/subjects";
import { classStreamsApi } from "../../../api/classStreams";
import { useForm } from "react-hook-form";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ClipboardCheck, X } from "lucide-react";

// Assessment scores — record, edit, filter, and delete exam and continuous assessment marks
export default function Assessments() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const defaultAcademicYear = currentMonth >= 8 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

  const [filterTerm, setFilterTerm] = useState("term1");
  const [filterYear, setFilterYear] = useState(defaultAcademicYear);

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentsApi.getAll().then((r) => r.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAll().then((r) => r.data),
  });

  const { data: classes } = useQuery({
    queryKey: ["class-streams"],
    queryFn: () => classStreamsApi.getAll().then((r) => r.data),
  });

  const { data: assessments, isLoading } = useQuery({
    queryKey: ["assessments", { classStreamId: filterClass, subjectId: filterSubject, type: filterType, term: filterTerm, academicYear: filterYear }],
    queryFn: () => assessmentsApi.getAll({
      ...(filterSubject && { subjectId: filterSubject }),
      ...(filterType && { type: filterType }),
      ...(filterTerm && { term: filterTerm }),
      ...(filterYear && { academicYear: filterYear }),
      ...(filterClass && { classStreamId: filterClass }),
    }).then((r) => r.data),
  });

  const filteredAssessments = useMemo(() => {
    if (!assessments) return [];
    if (!searchQuery) return assessments;
    const q = searchQuery.toLowerCase();
    return assessments.filter((a) => {
      const name = a.student ? `${a.student.firstName} ${a.student.lastName}`.toLowerCase() : "";
      return name.includes(q);
    });
  }, [assessments, searchQuery]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!filterClass) return students;
    return students.filter((s) => s.classStreamId === filterClass);
  }, [students, filterClass]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Assessment>();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Assessment>) => assessmentsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assessments"] }); setShowForm(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assessment> }) => assessmentsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assessments"] }); setEditing(null); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assessmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assessments"] }),
  });

  const onSubmit = (data: Assessment) => {
    const payload = {
      ...data,
      score: Number(data.score),
      maxScore: Number(data.maxScore) || 100,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (a: Assessment) => {
    setEditing(a);
    reset({ ...a, score: Number(a.score), maxScore: Number(a.maxScore) });
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditing(null); reset(); };

  const scoreColor = (score: number, max: number = 100) => {
    const pct = (score / max) * 100;
    if (pct >= 70) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (pct >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">Record and manage student scores</p>
        </div>
        <button onClick={() => { cancelForm(); setShowForm(true); }} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Record Score
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select className="input w-auto text-sm" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">All classes</option>
          {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">All subjects</option>
          {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All types</option>
          <option value="exam">Exam</option>
          <option value="continuous_assessment">Continuous Assessment</option>
        </select>
        <select className="input w-auto text-sm" value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}>
          <option value="term1">Term 1</option>
          <option value="term2">Term 2</option>
          <option value="term3">Term 3</option>
        </select>
        <input className="input w-28 text-sm" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} placeholder="Year" />
        <input
          className="input w-40 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search student..."
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="section-title">{editing ? "Edit Assessment" : "Record New Score"}</h2>
            <button type="button" onClick={cancelForm} className="btn-ghost text-xs p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Student</label>
              <select className="input" {...register("studentId", { required: true })}>
                <option value="">Select student</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <select className="input" {...register("subjectId", { required: true })}>
                <option value="">Select subject</option>
                {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" {...register("type", { required: true })}>
                <option value="exam">Exam</option>
                <option value="continuous_assessment">Continuous Assessment</option>
              </select>
            </div>
            <div>
              <label className="label">Term</label>
              <select className="input" {...register("term", { required: true })}>
                <option value="term1">Term 1</option>
                <option value="term2">Term 2</option>
                <option value="term3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="label">Academic Year</label>
              <input className="input" {...register("academicYear", { required: true })} placeholder={defaultAcademicYear} />
            </div>
            <div>
              <label className="label">Score</label>
              <input type="number" className="input" {...register("score", { required: true, valueAsNumber: true })} min="0" max="100" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">{editing ? "Update" : "Record Score"}</button>
            <button type="button" onClick={cancelForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 skeleton rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="card-static overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssessments?.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{a.student ? `${a.student.firstName} ${a.student.lastName}` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.subject?.name}</td>
                    <td className="px-4 py-3">
                      <span className={a.type === "exam" ? "badge-info" : "badge-warning"}>
                        {a.type === "exam" ? "Exam" : "CA"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{a.term.replace("term", "Term ")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.academicYear}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${scoreColor(a.score, a.maxScore)}`}>
                        {a.score}/{a.maxScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(a)} className="btn-ghost text-xs p-1.5" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this assessment?")) deleteMutation.mutate(a.id); }}
                        className="btn-ghost text-xs p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAssessments?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No assessments recorded</p>
              <p className="text-xs mt-1">Use the filters above or record a new score.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
