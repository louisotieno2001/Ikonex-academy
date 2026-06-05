import { Link } from "react-router-dom";
import { GraduationCap, Clock, Mail, ArrowLeft } from "lucide-react";

export default function ApprovalPage() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-ink-900 dark:via-ink-950 dark:to-ink-900">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Account Pending Approval</h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Your account has been registered successfully and is awaiting administrator approval.
            You will be notified once your access has been granted.
          </p>

          <div className="card-static p-5 mt-8 text-left space-y-3">
            <h2 className="font-semibold text-foreground text-sm">What happens next?</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>An administrator reviews your registration details</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Your account is approved and activated</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>You can sign in and access the system</span>
              </div>
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>Contact your administrator for status updates</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/login" className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-800 dark:to-brand-950 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Almost There!</h2>
          <p className="text-brand-100/80 leading-relaxed">
            Your registration is complete. The admin team will review and activate your account shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
