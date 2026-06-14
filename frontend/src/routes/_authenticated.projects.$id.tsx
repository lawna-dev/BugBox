import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, PageHeader, EmptyState } from "@/components/AppShell";
import { PriorityBadge, SeverityBadge, StatusBadge } from "@/components/Badge";
import type { Project, Ticket } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Project — BugBox" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const project = useQuery({ queryKey: ["project", id], queryFn: () => api<Project>(`/api/projects/${id}`) });
  const tickets = useQuery({
    queryKey: ["tickets"], queryFn: () => api<Ticket[]>("/api/tickets"),
    select: (list) => list.filter((t) => t.projectId === id),
  });

  if (project.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!project.data) return <EmptyState title="Project not found." />;

  return (
    <>
      <div className="mb-2 text-xs text-muted-foreground"><Link to="/projects" className="hover:text-foreground">Projects</Link> / {project.data.name}</div>
      <PageHeader title={project.data.name} subtitle={`${project.data.clientName} · ${project.data.status}`} />
      <Card className="mb-5"><p className="text-sm text-muted-foreground">{project.data.description || "No description."}</p></Card>
      <h2 className="font-semibold mb-3">Tickets</h2>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <tr><th className="text-left font-medium px-4 py-2.5">Number</th><th className="text-left font-medium px-4 py-2.5">Title</th><th className="text-left font-medium px-4 py-2.5">Status</th><th className="text-left font-medium px-4 py-2.5">Priority</th><th className="text-left font-medium px-4 py-2.5">Severity</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(tickets.data ?? []).map((t) => (
              <tr key={t.id} className="hover:bg-muted/40">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{t.ticketNumber}</td>
                <td className="px-4 py-2.5"><Link to="/tickets/$id" params={{ id: t.id }} className="hover:text-primary font-medium">{t.title}</Link></td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-2.5"><SeverityBadge severity={t.severity} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(tickets.data?.length ?? 0) === 0 && <div className="p-6"><EmptyState title="No tickets in this project yet." /></div>}
      </div>
    </>
  );
}
