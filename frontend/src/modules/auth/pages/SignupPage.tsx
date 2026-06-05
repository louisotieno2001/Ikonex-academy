import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authApi } from "../../../api/auth";
import { GraduationCap, Mail, Lock, User, UserPlus, Eye, EyeOff, ArrowRight } from "lucide-react";

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>();

  const onSubmit = async (data: SignupForm) => {
    try {
      setError("");
      setLoading(true);
      await authApi.register(data);
      navigate("/approval");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-ink-900 dark:via-ink-950 dark:to-ink-900">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Register for Ikonex Academy</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card-static p-6 space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className="input pl-10" {...register("firstName", { required: "Required" })} placeholder="John" />
                </div>
                {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className="input pl-10" {...register("lastName", { required: "Required" })} placeholder="Doe" />
                </div>
                {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" className="input pl-10" {...register("email", { required: "Email is required" })} placeholder="you@school.com" />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} className="input pl-10 pr-10" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Registering...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </span>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-800 dark:to-brand-950 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Join Ikonex Academy</h2>
          <p className="text-brand-100/80 leading-relaxed">
            Register your account and start managing students, assessments, and reports. An administrator will approve your access.
          </p>
          <div className="mt-10 flex items-center justify-center gap-2 text-brand-200/70 text-sm">
            <ArrowRight className="w-4 h-4" />
            <span>Approval required for access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
