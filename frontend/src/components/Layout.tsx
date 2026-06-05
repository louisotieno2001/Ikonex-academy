import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { clsx } from "clsx";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/class-streams", label: "Classes", icon: Users },
  { path: "/dashboard/students", label: "Students", icon: GraduationCap },
  { path: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { path: "/dashboard/assessments", label: "Assessments", icon: ClipboardCheck },
  { path: "/dashboard/reports", label: "Reports", icon: FileText },
  { path: "/dashboard/users", label: "Users", icon: Users, role: "admin" },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => !item.role || item.role === user?.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentNav = navItems.find(
    (item) => pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path + "/"))
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sidebar-foreground text-sm tracking-tight block leading-tight">Ikonex</span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Academy</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const active = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                  active
                    ? "bg-sidebar-accent/10 text-sidebar-accent font-medium"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted"
                )}
              >
                <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-sidebar-accent-foreground" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2">
            <div className="text-sm text-sidebar-foreground truncate font-medium">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            {currentNav && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-foreground font-medium">{currentNav.label}</span>
              </>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className="ml-auto p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
