import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, Student } from "../../../api/students";
import { classStreamsApi } from "../../../api/classStreams";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, GraduationCap, X, Filter } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

export default function Students() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "admin";

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [filterClass, setFilterClass] = useState(isTeacher ? (user?.assignedClasses?.[0] || "") : "");

  const { data: students, isLoading } = useQuery({
    queryKey: ["students", filterClass],
    queryFn: () => studentsApi.getAll(filterClass ? { classStreamId: filterClass } : undefined).then((r) => r.data),
  });

  const { data: classes } = useQuery({
    queryKey: ["class-streams"],
    queryFn: () => classStreamsApi.getAll().then((r) => r.data),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Student>();

  useEffect(() => {
    if (isTeacher && user?.assignedClasses?.length) {
      setValue("classStreamId", user.assignedClasses[0]);
    }
  }, [isTeacher, user, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Student>) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setShowForm(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) => studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setEditing(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const onSubmit = (data: Student) => {
    const payload = {
      ...data,
      classStreamId: data.classStreamId || (isTeacher ? user?.assignedClasses?.[0] : undefined),
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (s: Student) => {
    setEditing(s);
    reset({ ...s, dateOfBirth: s.dateOfBirth?.split("T")[0] || "" });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    reset();
    if (isTeacher) setValue("classStreamId", user?.assignedClasses?.[0] || "");
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher ? `Managing students for ${classes?.find(c => c.id === user?.assignedClasses?.[0])?.name || 'your class'}` : 'Manage student records and admissions'}
          </p>
        </div>
        <button onClick={() => { cancelForm(); setShowForm(true); }} className="btn-primary text-sm shadow-lg shadow-brand-500/20">
          <Plus className="w-4 h-4" />
          Register Student
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4 animate-slide-up border-brand-500/20 bg-brand-50/5 dark:bg-brand-900/5">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-brand-700 dark:text-brand-400 font-bold">{editing ? "Edit Student" : "Register New Student"}</h2>
            <button type="button" onClick={cancelForm} className="btn-ghost text-xs p-1.5 hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="label">Admission No.</label>
              <input className="input focus:ring-brand-500/20" {...register("admissionNumber", { required: true })} placeholder="e.g. 2024/001" />
              {errors.admissionNumber && <p className="text-[10px] text-destructive mt-1 font-medium">Admission number is required</p>}
            </div>
            <div>
              <label className="label">First Name</label>
              <input className="input focus:ring-brand-500/20" {...register("firstName", { required: true })} placeholder="John" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input focus:ring-brand-500/20" {...register("lastName", { required: true })} placeholder="Doe" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input focus:ring-brand-500/20" {...register("gender", { required: true })}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input focus:ring-brand-500/20" {...register("dateOfBirth", { required: true })} />
            </div>
            <div>
              <label className="label">Class Stream</label>
              <select 
                className="input focus:ring-brand-500/20 disabled:opacity-75 disabled:bg-muted" 
                {...register("classStreamId")} 
                disabled={isTeacher}
              >
                {!isTeacher && <option value="">Select Class</option>}
                {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {isTeacher && <p className="text-[10px] text-muted-foreground mt-1">Locked to your assigned class</p>}
            </div>
            <div className="sm:col-span-2 lg:col-span-3 h-px bg-border my-2"></div>
            <div>
              <label className="label">Parent/Guardian Name</label>
              <input className="input focus:ring-brand-500/20" {...register("parentName")} placeholder="Full Name" />
            </div>
            <div>
              <label className="label">Parent Phone</label>
              <input className="input focus:ring-brand-500/20" {...register("parentPhone")} placeholder="+254 7XX XXX XXX" />
            </div>
            <div>
              <label className="label">Parent Email</label>
              <input type="email" className="input focus:ring-brand-500/20" {...register("parentEmail")} placeholder="parent@email.com" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 justify-end">
            <button type="button" onClick={cancelForm} className="btn-secondary px-6">Cancel</button>
            <button type="submit" className="btn-primary px-8 shadow-md">
              {editing ? "Save Changes" : "Confirm Registration"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/30 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filter By:</span>
        </div>
        <select 
          className="input w-full sm:w-auto text-sm py-1.5 h-auto bg-background" 
          value={filterClass} 
          onChange={(e) => setFilterClass(e.target.value)}
          disabled={isTeacher}
        >
          {isAdmin && <option value="">All class streams</option>}
          {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-1 bg-brand-100 text-brand-700 rounded-md">
            {students?.length || 0} Total Records
          </span>
        </div>
      </div>

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
                  <th className="px-4 py-3">Adm No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students?.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.admissionNumber}</td>
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/students/${s.id}`} className="flex items-center gap-2 group">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                          <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {s.firstName} {s.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-ink capitalize">{s.gender}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.classStream?.name || <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{s.parentName || <span className="text-border">—</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(s)} className="btn-ghost text-xs p-1.5" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this student?")) deleteMutation.mutate(s.id); }}
                        className="btn-ghost text-xs p-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
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
          {students?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="w-10 h-10 mx-auto text-border mb-3" />
              <p className="font-medium">No students found</p>
              <p className="text-xs mt-1">Register a student to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
