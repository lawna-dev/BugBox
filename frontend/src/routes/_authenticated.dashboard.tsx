import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, EmptyState, PageHeader } from "@/components/AppShell";
import { PriorityBadge, SeverityBadge, StatusBadge } from "@/components/Badge";
import type { Ticket } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BugBox" }] }),
  component: Dashboard,
});

interface Summary {
  openTickets: number; criticalIssues: number; overdueTickets: number;
  recentResolved: number; avgResolutionHours: number; resolutionRate: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byProject: { project: string; open: number }[];
}
interface CriticalRow {
  id: string; ticketNumber: string; title: string; project: string;
  assignee: string | null; severity: string; priority: string; status: string; dueDate: string | null;
}

function Dashboard() {
  const { user } = useAuth();
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => api<Summary>("/api/dashboard/summary") });
  const critical = useQuery({ queryKey: ["critical"], queryFn: () => api<CriticalRow[]>("/api/dashboard/critical-issues") });
  const myTickets = useQuery({
    queryKey: ["tickets"], queryFn: () => api<Ticket[]>("/api/tickets"),
    select: (t) => t.filter((x) => x.assigneeId === user?.id).slice(0, 6),
  });

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.fullName.split(" ")[0] ?? ""}`} subtitle="Here's what's happening across your team today." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Open tickets"      value={summary.data?.openTickets} />
        <Stat label="Critical issues"   value={summary.data?.criticalIssues} accent="danger" />
        <Stat label="Overdue"           value={summary.data?.overdueTickets} accent="warning" />
        <Stat label="Resolved (7d)"     value={summary.data?.recentResolved} accent="success" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Critical issues</h2>
            <Link to="/tickets" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {critical.data && critical.data.length === 0 ? (
            <EmptyState title="No critical issues." hint="The team can breathe for now." />
          ) : (
            <div className="divide-y divide-border -mx-5">
              {(critical.data ?? []).slice(0, 6).map((t) => (
                <Link key={t.id} to="/tickets/$id" params={{ id: t.id }} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{t.ticketNumber}</span>
                  <span className="flex-1 text-sm truncate">{t.title}</span>
                  <SeverityBadge severity={t.severity as any} />
                  <PriorityBadge priority={t.priority as any} />
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Tickets by status</h2>
          <ul className="space-y-2">
            {(summary.data?.byStatus ?? []).map((s) => (
              <li key={s.status} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.status}</span>
                <span className="tabular-nums font-medium">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My assigned tickets</h2>
            <Link to="/tickets" className="text-xs text-primary hover:underline">All tickets</Link>
          </div>
          {myTickets.data && myTickets.data.length === 0 ? (
            <EmptyState title="Your queue is empty." hint="Suspicious, but nice." />
          ) : (
            <div className="divide-y divide-border -mx-5">
              {(myTickets.data ?? []).map((t) => (
                <Link key={t.id} to="/tickets/$id" params={{ id: t.id }} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{t.ticketNumber}</span>
                  <span className="flex-1 text-sm truncate">{t.title}</span>
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Open by project</h2>
          <ul className="space-y-2">
            {(summary.data?.byProject ?? []).map((p) => (
              <li key={p.project} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{p.project}</span>
                <span className="tabular-nums font-medium">{p.open}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold mb-1">Resolution rate</h2>
          <div className="text-3xl font-semibold mt-2">{summary.data?.resolutionRate ?? "—"}%</div>
        </Card>
        <Card>
          <h2 className="font-semibold mb-1">Avg. resolution</h2>
          <div className="text-3xl font-semibold mt-2">{summary.data ? `${summary.data.avgResolutionHours}h` : "—"}</div>
        </Card>
        <Card>
          <h2 className="font-semibold mb-1">Chaos level</h2>
          <div className="text-3xl font-semibold mt-2">
            {summary.data ? Math.min(100, (summary.data.criticalIssues * 12) + summary.data.overdueTickets * 4) : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Urgent + overdue pressure index.</div>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | undefined; accent?: "danger" | "warning" | "success" }) {
  const color = accent === "danger" ? "text-danger" : accent === "warning" ? "text-warning" : accent === "success" ? "text-success" : "text-foreground";
  return (
    <Card>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value ?? "—"}</div>
    </Card>
  );
}
