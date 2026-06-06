import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, User } from "../../../api/auth";
import { classStreamsApi } from "../../../api/classStreams";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  MoreVertical
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Admin user management — approve pending users, assign roles and classes, suspend/delete
export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [approveClasses, setApproveClasses] = useState<Record<string, string[]>>({});

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => authApi.listUsers().then((res) => res.data),
  });

  const { data: classes } = useQuery({
    queryKey: ["class-streams"],
    queryFn: () => classStreamsApi.getAll().then((res) => res.data),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role, assignedClasses }: { id: string; role: string; assignedClasses?: string[] }) =>
      authApi.updateUserRole(id, { role, assignedClasses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update user");
    },
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: (id: string) => authApi.toggleSuspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status toggled");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
  });

  const handleApprove = (user: User) => {
    const selected = approveClasses[user.id] || [];
    updateRoleMutation.mutate({ id: user.id, role: "teacher", assignedClasses: selected });
  };

  const toggleApproveClass = (userId: string, classId: string) => {
    setApproveClasses(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(classId)
        ? current.filter(id => id !== classId)
        : [...current, classId];
      return { ...prev, [userId]: updated };
    });
  };

  const toggleTeacherClass = (userId: string, classId: string, currentClasses: string[] = []) => {
    const updated = currentClasses.includes(classId)
      ? currentClasses.filter(id => id !== classId)
      : [...currentClasses, classId];
    updateRoleMutation.mutate({ id: userId, role: "teacher", assignedClasses: updated });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading users...</div>;

  const pendingUsers = users?.filter(u => u.role === 'pending') || [];
  const activeUsers = users?.filter(u => u.role !== 'pending') || [];

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-muted-foreground">Approve, manage, and assign roles to system users.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <div className="px-3 py-1.5 text-xs font-medium rounded-md bg-background shadow-sm">
            Total Users: {users?.length || 0}
          </div>
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Pending Approvals ({pendingUsers.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="card p-5 border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="badge badge-warning">Pending</span>
                </div>
                <h3 className="font-bold text-foreground">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-3 mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Assign Classes (optional)</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto border border-border rounded-lg p-2 bg-white">
                    {classes?.map((c) => {
                      const checked = (approveClasses[user.id] || []).includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1 transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleApproveClass(user.id, c.id)}
                            className="w-3.5 h-3.5 rounded border-border text-brand-600 focus:ring-brand-500"
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(user)}
                    className="btn-primary flex-1 py-2 text-sm"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button 
                    onClick={() => deleteUserMutation.mutate(user.id)}
                    className="btn-secondary text-destructive hover:bg-destructive/10 border-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-600" />
          Active Personnel
        </h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-4 font-semibold text-sm">User</th>
                  <th className="p-4 font-semibold text-sm">Role</th>
                  <th className="p-4 font-semibold text-sm">Assignment</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                        className="text-xs bg-muted border-none rounded-md px-2 py-1 focus:ring-1 ring-brand-500"
                        disabled={user.role === 'admin' && users?.filter(u => u.role === 'admin').length === 1}
                      >
                        <option value="admin">Administrator</option>
                        <option value="teacher">Teacher</option>
                        <option value="staff">Staff</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {user.role === 'teacher' ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {classes?.map((c) => {
                            const checked = (user.assignedClasses || []).includes(c.id);
                            return (
                              <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTeacherClass(user.id, c.id, user.assignedClasses)}
                                  className="w-3 h-3 rounded border-border text-brand-600 focus:ring-brand-500"
                                />
                                {c.name}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Global Access</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.suspend ? (
                        <span className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                          <UserX className="w-3 h-3" />
                          Suspended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => toggleSuspendMutation.mutate(user.id)}
                        className={`p-2 rounded-md transition-colors ${user.suspend ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                        title={user.suspend ? "Activate" : "Suspend"}
                      >
                        {user.suspend ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this user?")) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
