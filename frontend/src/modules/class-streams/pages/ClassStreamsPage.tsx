import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classStreamsApi, ClassStream } from "../../../api/classStreams";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Users, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

export default function ClassStreams() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassStream | null>(null);

  const { data: streams, isLoading } = useQuery({
    queryKey: ["class-streams"],
    queryFn: () => classStreamsApi.getAll().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassStream>();

  const createMutation = useMutation({
    mutationFn: (data: Partial<ClassStream>) => classStreamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-streams"] });
      setShowForm(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassStream> }) => classStreamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-streams"] });
      setEditing(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classStreamsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["class-streams"] }),
  });

  const onSubmit = (data: ClassStream) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (s: ClassStream) => {
    setEditing(s);
    reset(s);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    reset();
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Class Streams</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage classes and view student distribution</p>
        </div>
        {isAdmin && (
          <button onClick={() => { cancelForm(); setShowForm(true); }} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="section-title">{editing ? "Edit Class" : "New Class Stream"}</h2>
            <button type="button" onClick={cancelForm} className="btn-ghost text-xs p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Class Name</label>
              <input className="input" {...register("name", { required: true })} placeholder="e.g. Form 1A" />
              {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="label">Code</label>
              <input className="input" {...register("code", { required: true })} placeholder="e.g. F1A" />
              {errors.code && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description (optional)</label>
              <textarea className="input" rows={2} {...register("description")} placeholder="e.g. First Form stream A" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">
              {editing ? "Update Class" : "Create Class"}
            </button>
            <button type="button" onClick={cancelForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {streams?.map((s) => (
            <div key={s.id} className="card p-4 flex items-center justify-between group">
              <Link to={`/dashboard/class-streams/${s.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.code}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {s.studentCount ?? s.students?.length ?? 0} student{(s.studentCount ?? s.students?.length ?? 0) !== 1 ? "s" : ""}
                    {s.description && <span className="mx-1.5">&middot;</span>}
                    {s.description && <span>{s.description}</span>}
                  </div>
                </div>
              </Link>
              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(s)} className="btn-ghost text-xs p-1.5" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this class?")) deleteMutation.mutate(s.id); }}
                    className="btn-ghost text-xs p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {streams?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No class streams yet</p>
              <p className="text-xs mt-1">Create your first class to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
