import { useQuery } from "@tanstack/react-query";
import { systemApi, SystemLog } from "../../../api/system";
import { useState } from "react";
import { AlertCircle, Info, AlertTriangle, RefreshCw, Filter, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const LEVEL_ICONS = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
};

const LEVEL_COLORS = {
  info: "bg-blue-100 text-blue-700 border-blue-200",
  warn: "bg-amber-100 text-amber-700 border-amber-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

// System audit logs — filterable event log with levels and auto-refresh
export default function LogsPage() {
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["system-logs", levelFilter, actionFilter],
    queryFn: () =>
      systemApi
        .getLogs({
          limit: 200,
          ...(levelFilter && { level: levelFilter }),
          ...(actionFilter && { action: actionFilter }),
        })
        .then((r) => r.data),
    refetchInterval: 15000,
  });

  const actions = logs ? [...new Set(logs.map((l) => l.action))].sort() : [];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="page-title">System Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">Audit trail of all system events with timestamps.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="input text-xs py-1.5 w-auto"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input text-xs py-1.5 w-auto max-w-[200px]"
          >
            <option value="">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button onClick={() => refetch()} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="card-static overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading logs...</div>
        ) : !logs || logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Filter className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">No log entries found</p>
            <p className="text-xs mt-1">Try clearing your filters or wait for new events.</p>
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log: SystemLog) => {
              const Icon = LEVEL_ICONS[log.level] || Info;
              return (
                <div key={log.id} className="px-6 py-3.5 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-brand-600">{log.action}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{log.level}</span>
                    </div>
                    <div className="text-sm text-foreground mt-0.5">{log.description}</div>
                    {log.userId && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">User: {log.userId}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}