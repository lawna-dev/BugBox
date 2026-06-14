import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, EmptyState, Card } from "@/components/AppShell";
import { PriorityBadge, SeverityBadge, StatusBadge, TypeBadge, Tag } from "@/components/Badge";
import type { Project, Ticket, TicketPriority, TicketSeverity, TicketStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/tickets/")({
  head: () => ({ meta: [{ title: "Tickets — BugBox" }] }),
  component: TicketsPage,
});

function TicketsPage() {
  const { user } = useAuth();
  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => api<Ticket[]>("/api/tickets") });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/api/projects") });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [overdue, setOverdue] = useState(false);

  const rows = useMemo(() => {
    const list = tickets.data ?? [];
    const now = Date.now();
    return list.filter((t) => {
      if (q && !`${t.title} ${t.description} ${t.ticketNumber}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (status && t.status !== status) return false;
      if (priority && t.priority !== priority) return false;
      if (severity && t.severity !== severity) return false;
      if (project && t.projectId !== project) return false;
      if (onlyMine && t.assigneeId !== user?.id) return false;
      if (overdue && !(t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== "Done")) return false;
      return true;
    });
  }, [tickets.data, q, status, priority, severity, project, onlyMine, overdue, user?.id]);

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle={`${rows.length} of ${tickets.data?.length ?? 0} tickets`}
        actions={<Link to="/tickets/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">＋ New</Link>}
      />
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <input className={inp + " md:col-span-2"} placeholder="Search title, number or description…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={inp} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {(["New","Triaged","InProgress","InReview","ReadyForQA","Done","Rejected","Duplicate"] as TicketStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={inp} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All priorities</option>
            {(["Low","Medium","High","Urgent"] as TicketPriority[]).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className={inp} value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All severities</option>
            {(["Minor","Major","Critical","Blocker"] as TicketSeverity[]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={inp} value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">All projects</option>
            {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> My tickets only</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} /> Overdue only</label>
        </div>
      </Card>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Ticket</th>
              <th className="text-left font-medium px-4 py-2.5">Title</th>
              <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Project</th>
              <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">Type</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Priority</th>
              <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">Severity</th>
              <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">Assignee</th>
              <th className="text-left font-medium px-4 py-2.5 hidden xl:table-cell">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-muted/40">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{t.ticketNumber}</td>
                <td className="px-4 py-2.5">
                  <Link to="/tickets/$id" params={{ id: t.id }} className="font-medium hover:text-primary">{t.title}</Link>
                  {t.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">{t.tags.slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
                  )}
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">{t.projectName}</td>
                <td className="px-4 py-2.5 hidden lg:table-cell"><TypeBadge type={t.type} /></td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5 hidden md:table-cell"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-2.5 hidden lg:table-cell"><SeverityBadge severity={t.severity} /></td>
                <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground">{t.assigneeName ?? <span className="italic">Unassigned</span>}</td>
                <td className="px-4 py-2.5 hidden xl:table-cell text-muted-foreground tabular-nums">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6"><EmptyState title="No matching tickets found." hint="Try adjusting your filters." /></div>
        )}
      </div>
    </>
  );
}

const inp = "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40";
