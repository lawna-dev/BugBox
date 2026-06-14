import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — BugBox" }] }),
  component: ReportsPage,
});

interface Summary {
  byPriority: { priority: string; count: number }[];
  byStatus: { status: string; count: number }[];
  avgResolutionHours: number; resolutionRate: number; recentResolved: number;
}
interface Workload { id: string; fullName: string; role: string; openAssigned: number; resolvedThisWeek: number; }
interface Health { id: string; name: string; openTickets: number; criticalTickets: number; overdueTickets: number; health: string; }

function ReportsPage() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => api<Summary>("/api/dashboard/summary") });
  const workload = useQuery({ queryKey: ["workload"], queryFn: () => api<Workload[]>("/api/reports/workload") });
  const health = useQuery({ queryKey: ["project-health"], queryFn: () => api<Health[]>("/api/reports/project-health") });

  const maxLoad = Math.max(1, ...(workload.data ?? []).map((w) => w.openAssigned));

  return (
    <>
      <PageHeader title="Reports" subtitle="Trends, distribution and health of ongoing work." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h2 className="font-semibold mb-4">Workload by assignee</h2>
          <ul className="space-y-2">
            {(workload.data ?? []).map((w) => (
              <li key={w.id} className="text-sm">
                <div className="flex justify-between mb-1"><span>{w.fullName}</span><span className="text-muted-foreground tabular-nums">{w.openAssigned}</span></div>
                <div className="h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(w.openAssigned / maxLoad) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Priority distribution</h2>
          <ul className="space-y-2">
            {(summary.data?.byPriority ?? []).map((p) => (
              <li key={p.priority} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{p.priority}</span><span className="tabular-nums font-medium">{p.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Status distribution</h2>
          <ul className="space-y-2">
            {(summary.data?.byStatus ?? []).map((s) => (
              <li key={s.status} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.status}</span><span className="tabular-nums font-medium">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Project health</h2>
          <ul className="space-y-2">
            {(health.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <span className={`text-xs rounded px-2 py-0.5 ring-1 ring-inset ${
                  p.health === "Healthy" ? "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30"
                  : p.health === "AtRisk" ? "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30"
                  : "bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30"
                }`}>{p.health === "AtRisk" ? "At risk" : p.health}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold mb-1">Avg. resolution time</h2>
          <div className="text-3xl font-semibold mt-1">{summary.data ? `${summary.data.avgResolutionHours}h` : "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">Across all resolved tickets.</div>
        </Card>
        <Card>
          <h2 className="font-semibold mb-1">Resolved last 7 days</h2>
          <div className="text-3xl font-semibold mt-1">{summary.data?.recentResolved ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">Resolution rate {summary.data?.resolutionRate ?? "—"}%.</div>
        </Card>
      </div>
    </>
  );
}
