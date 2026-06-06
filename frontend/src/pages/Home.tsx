// Landing page — hero, features showcase, and CTA for unauthenticated visitors
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { GraduationCap, BookOpen, Users, BarChart3, Shield, ArrowRight, Sun, Moon } from "lucide-react";

export default function Home() {
  const { token } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-foreground text-lg tracking-tight">Ikonex Academy</span>
          </Link>
          <nav className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {token ? (
              <Link to="/dashboard" className="btn-primary text-sm">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link to="/signup" className="btn-primary text-sm">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-ink-900 dark:via-ink-950 dark:to-ink-900" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              School Management,{" "}
              <span className="text-brand-500">Simplified</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-xl">
              A modern platform for managing students, classes, assessments, and reports.
              Streamline your academic workflow with Ikonex Academy.
            </p>
            <div className="flex gap-3 mt-8">
              {token ? (
                <Link to="/dashboard" className="btn-primary">
                  <BarChart3 className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-primary px-6">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/login" className="btn-secondary px-6">Sign In</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">Everything you need</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Manage your school's academic operations from one centralized platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Student Records", desc: "Maintain comprehensive student profiles with admission details, contacts, and academic history." },
              { icon: BookOpen, title: "Class Management", desc: "Organize class streams, assign subjects, and track student distribution across classes." },
              { icon: GraduationCap, title: "Subjects & Curriculum", desc: "Define subjects, assign them to classes, and manage your academic curriculum." },
              { icon: BarChart3, title: "Assessments & Scoring", desc: "Record exam and continuous assessment scores with flexible grading options." },
              { icon: Shield, title: "Report Cards", desc: "Generate detailed report cards and class performance reports with automated grading." },
              { icon: Users, title: "Parent Portal", desc: "Keep parents informed with access to student performance and attendance data." },
            ].map((feature) => (
              <div key={feature.title} className="card p-6">
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-card-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-500 dark:bg-brand-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to streamline your school?</h2>
          <p className="mt-3 text-brand-100 dark:text-brand-200 max-w-lg mx-auto">
            Get started with Ikonex Academy and transform the way you manage academic operations.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            {token ? (
              <Link to="/dashboard" className="btn bg-white text-brand-700 border-white hover:bg-brand-50 px-6">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/signup" className="btn bg-white text-brand-700 border-white hover:bg-brand-50 px-6">
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Ikonex Academy. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-500" />
            <span className="font-medium text-foreground">Ikonex</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
