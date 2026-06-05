import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsApi, Subject } from "../../../api/subjects";
import { classStreamsApi } from "../../../api/classStreams";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, BookOpen, X, Check, ShieldCheck, Filter } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "sonner";

export default function Subjects() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.getAll().then((r) => r.data),
  });

  const { data: classes } = useQuery({
    queryKey: ["class-streams"],
    queryFn: () => classStreamsApi.getAll().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Subject>();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Subject>) => subjectsApi.create(data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["subjects"] }); 
      setShowForm(false); 
      reset(); 
      toast.success("Subject created successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create subject"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subject> }) => subjectsApi.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["subjects"] }); 
      setEditing(null); 
      reset(); 
      toast.success("Subject updated successfully");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
  });

  const onSubmit = (data: Subject) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (s: Subject) => { setEditing(s); reset(s); setShowForm(true); };
  const cancelForm = () => { setShowForm(false); setEditing(null); reset(); };

  const [assignClassId, setAssignClassId] = useState(isTeacher ? user?.assignedClassId || "" : "");
  const [assignSubjectIds, setAssignSubjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (isTeacher && user?.assignedClassId) {
      setAssignClassId(user.assignedClassId);
    }
  }, [isTeacher, user]);

  const assignMutation = useMutation({
    mutationFn: () => subjectsApi.assign(assignClassId, assignSubjectIds),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["class-streams"] }); 
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setShowAssign(false); 
      setAssignSubjectIds([]); 
      toast.success("Subjects assigned to class");
    },
  });

  const toggleAssignSubject = (id: string) => {
    setAssignSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage global curriculum and class assignments</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAssign(true)} 
            className="btn-secondary text-sm border-brand-200 hover:border-brand-300"
          >
            <Check className="w-4 h-4" />
            Assign to Class
          </button>
          {isAdmin && (
            <button 
              onClick={() => { cancelForm(); setShowForm(true); }} 
              className="btn-primary text-sm shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          )}
        </div>
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4 animate-slide-up border-brand-500/20 bg-brand-50/5">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-brand-700 font-bold">{editing ? "Edit Subject" : "Create New Subject"}</h2>
            <button type="button" onClick={cancelForm} className="btn-ghost text-xs p-1.5 hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Subject Name</label>
              <input className="input focus:ring-brand-500/20" {...register("name", { required: true })} placeholder="e.g. Mathematics" />
              {errors.name && <p className="text-[10px] text-destructive mt-1 font-medium">Name is required</p>}
            </div>
            <div>
              <label className="label">Code</label>
              <input className="input focus:ring-brand-500/20" {...register("code", { required: true })} placeholder="e.g. MATH" />
              {errors.code && <p className="text-[10px] text-destructive mt-1 font-medium">Code is required</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input focus:ring-brand-500/20" rows={2} {...register("description")} placeholder="Provide learning objectives or topics covered..." />
            </div>
          </div>
          <div className="flex gap-3 pt-4 justify-end">
            <button type="button" onClick={cancelForm} className="btn-secondary px-6">Cancel</button>
            <button type="submit" className="btn-primary px-8 shadow-md">
              {editing ? "Save Changes" : "Confirm Subject"}
            </button>
          </div>
        </form>
      )}

      {showAssign && (
        <div className="card p-6 space-y-4 animate-slide-up border-accent-500/20 bg-accent-50/5">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-accent-700 font-bold">Assign Subjects to Class</h2>
            <button onClick={() => setShowAssign(false)} className="btn-ghost text-xs p-1.5 hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="label">Target Class</label>
              <select 
                className="input focus:ring-accent-500/20 disabled:bg-muted" 
                value={assignClassId} 
                onChange={(e) => setAssignClassId(e.target.value)}
                disabled={isTeacher}
              >
                {!isTeacher && <option value="">Select class</option>}
                {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {isTeacher && <p className="text-[10px] text-muted-foreground mt-1">Locked to your assigned class</p>}
            </div>
            <div>
              <label className="label flex justify-between items-center">
                <span>Select Subjects</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-100 text-accent-700">{assignSubjectIds.length} Selected</span>
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-white shadow-inner">
                {subjects?.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 text-sm px-2 py-2 rounded-lg hover:bg-accent-50 transition-colors cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={assignSubjectIds.includes(s.id)}
                      onChange={() => toggleAssignSubject(s.id)}
                      className="w-4 h-4 rounded border-border text-accent-600 focus:ring-accent-500"
                    />
                    <div className="min-w-0">
                      <span className="text-foreground font-medium group-hover:text-accent-700 transition-colors">{s.name}</span>
                      <span className="text-muted-foreground ml-1.5 text-xs font-mono">({s.code})</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4 justify-end">
            <button onClick={() => setShowAssign(false)} className="btn-secondary px-6">Cancel</button>
            <button 
              onClick={() => assignMutation.mutate()} 
              className="btn-primary px-8 shadow-md bg-accent-600 hover:bg-accent-700" 
              disabled={!assignClassId || assignSubjectIds.length === 0}
            >
              <Check className="w-4 h-4" />
              Apply Assignments
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects?.map((s) => (
            <div key={s.id} className="card p-5 flex items-start justify-between group hover:border-brand-500/30 transition-all hover:shadow-md">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 shadow-sm">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-foreground">{s.name}</span>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                      {s.code}
                    </span>
                  </div>
                  {s.description ? (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{s.description}</div>
                  ) : (
                    <div className="text-[10px] italic text-muted-foreground/60 mt-1">No description provided</div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this subject?")) deleteMutation.mutate(s.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {subjects?.length === 0 && (
            <div className="col-span-full text-center py-16 card-static bg-muted/20">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-bold text-foreground">No subjects defined</p>
              <p className="text-xs text-muted-foreground mt-1">Administrators can add subjects to the curriculum.</p>
              {isAdmin && (
                <button onClick={() => setShowForm(true)} className="mt-4 btn-primary text-xs py-2">
                  Create First Subject
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
