import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, PageHeader, EmptyState } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({ meta: [{ title: "Projects — BugBox" }] }),
  component: ProjectsPage,
});

interface ProjectHealth {
  id: string; name: string; clientName: string; status: string;
  openTickets: number; criticalTickets: number; overdueTickets: number;
  health: "Healthy" | "AtRisk" | "Critical";
}

function ProjectsPage() {
  const health = useQuery({ queryKey: ["project-health"], queryFn: () => api<ProjectHealth[]>("/api/reports/project-health") });

  return (
    <>
      <PageHeader title="Projects" subtitle="Health at a glance across every active engagement." />
      {health.data && health.data.length === 0 && <EmptyState title="No projects yet." />}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(health.data ?? []).map((p) => (
          <Link key={p.id} to="/projects/$id" params={{ id: p.id }}>
            <Card className="hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.clientName}</div>
                </div>
                <HealthDot health={p.health} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <Stat label="Open" value={p.openTickets} />
                <Stat label="Critical" value={p.criticalTickets} tone="danger" />
                <Stat label="Overdue" value={p.overdueTickets} tone="warning" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" | "warning" }) {
  const color = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-md bg-muted/40 py-2">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function HealthDot({ health }: { health: "Healthy" | "AtRisk" | "Critical" }) {
  const label = health === "AtRisk" ? "At risk" : health;
  const cls = health === "Healthy"
    ? "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30"
    : health === "AtRisk"
      ? "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30"
      : "bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30";
  return <span className={`text-xs font-medium rounded-md px-2 py-0.5 ring-1 ring-inset ${cls}`}>{label}</span>;
}
