import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, PageHeader, EmptyState } from "@/components/AppShell";
import { PriorityBadge, SeverityBadge, Tag } from "@/components/Badge";
import { KANBAN_COLUMNS, STATUS_LABEL, type Ticket, type TicketStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/kanban")({
  head: () => ({ meta: [{ title: "Kanban — BugBox" }] }),
  component: KanbanPage,
});

function KanbanPage() {
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => api<Ticket[]>("/api/tickets") });

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      api(`/api/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["tickets"] }); },
  });

  return (
    <>
      <PageHeader title="Kanban" subtitle="Drag with status dropdowns. Status updates persist via the API." />
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {KANBAN_COLUMNS.map((col) => {
          const items = (tickets.data ?? []).filter((t) => t.status === col);
          return (
            <div key={col} className="rounded-lg border border-border bg-card/60 p-2 min-h-[400px]">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{STATUS_LABEL[col]}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{items.length}</div>
              </div>
              <div className="space-y-2 mt-1">
                {items.length === 0 && <div className="text-xs text-muted-foreground px-2 py-3">Empty</div>}
                {items.map((t) => (
                  <Card key={t.id} className="!p-3 hover:border-primary/40 transition-colors">
                    <Link to="/tickets/$id" params={{ id: t.id }} className="text-sm font-medium hover:text-primary line-clamp-2">{t.title}</Link>
                    <div className="text-[11px] text-muted-foreground mt-1">{t.projectName}</div>
                    <div className="flex flex-wrap gap-1 mt-2"><PriorityBadge priority={t.priority} /><SeverityBadge severity={t.severity} /></div>
                    {t.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{t.tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{t.assigneeName ?? "Unassigned"}</span>
                      <select
                        className="rounded border border-border bg-background px-1 py-0.5 text-[11px]"
                        value={t.status}
                        onChange={(e) => move.mutate({ id: t.id, status: e.target.value as TicketStatus })}
                      >
                        {KANBAN_COLUMNS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {(tickets.data?.length ?? 0) === 0 && <div className="mt-6"><EmptyState title="No tickets yet." hint="Enjoy the silence while it lasts." /></div>}
    </>
  );
}
