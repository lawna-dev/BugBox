import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader, EmptyState } from "@/components/AppShell";
import { PriorityBadge, SeverityBadge, StatusBadge, Tag, TypeBadge } from "@/components/Badge";
import type { Comment, Ticket, TicketStatus, UserDto } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { can, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/tickets/$id")({
  head: () => ({ meta: [{ title: "Ticket — BugBox" }] }),
  component: TicketDetail,
});

const STATUSES: TicketStatus[] = ["New","Triaged","InProgress","InReview","ReadyForQA","Done","Rejected","Duplicate"];

function TicketDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const ticket = useQuery({ queryKey: ["ticket", id], queryFn: () => api<Ticket>(`/api/tickets/${id}`) });
  const comments = useQuery({ queryKey: ["comments", id], queryFn: () => api<Comment[]>(`/api/tickets/${id}/comments`) });
  const users = useQuery({ queryKey: ["users"], queryFn: () => api<UserDto[]>("/api/users") });

  const updateStatus = useMutation({
    mutationFn: (status: TicketStatus) => api(`/api/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["ticket", id] }); void qc.invalidateQueries({ queryKey: ["tickets"] }); },
  });
  const del = useMutation({
    mutationFn: () => api(`/api/tickets/${id}`, { method: "DELETE" }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["tickets"] }); void nav({ to: "/tickets" }); },
  });
  const addComment = useMutation({
    mutationFn: (content: string) => api(`/api/tickets/${id}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["comments", id] }); setComment(""); },
  });
  const assignMutation = useMutation({
    mutationFn: async (assigneeId: string | null) => {
      if (!ticket.data) return;
      const t = ticket.data;
      await api(`/api/tickets/${id}`, { method: "PUT", body: JSON.stringify({
        title: t.title, description: t.description, type: t.type, priority: t.priority, severity: t.severity,
        projectId: t.projectId, assigneeId, reporterId: t.reporterId, dueDate: t.dueDate,
        environment: t.environment, stepsToReproduce: t.stepsToReproduce,
        expectedResult: t.expectedResult, actualResult: t.actualResult, technicalNotes: t.technicalNotes,
        estimatedHours: t.estimatedHours, spentHours: t.spentHours,
        duplicateOfTicketId: t.duplicateOfTicketId, tags: t.tags,
      })});
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["ticket", id] }); },
  });

  const [comment, setComment] = useState("");

  if (ticket.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (ticket.error || !ticket.data) return <EmptyState title="Ticket not found." hint="It may have been deleted." />;

  const t = ticket.data;
  const isBug = t.type === "Bug";

  return (
    <>
      <div className="mb-2 text-xs text-muted-foreground">
        <Link to="/tickets" className="hover:text-foreground">Tickets</Link> / <span className="tabular-nums">{t.ticketNumber}</span>
      </div>
      <PageHeader
        title={t.title}
        subtitle={`Reported by ${t.reporterName} · ${new Date(t.createdAt).toLocaleDateString()}`}
        actions={
          can(user?.role, "delete-ticket") ? (
            <button onClick={() => del.mutate()} className="rounded-md border border-danger/30 text-danger px-3 py-1.5 text-sm hover:bg-danger/10">Delete</button>
          ) : null
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={t.status} /><PriorityBadge priority={t.priority} /><SeverityBadge severity={t.severity} /><TypeBadge type={t.type} />
            {t.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.description || "No description provided."}</p>
          </div>
          {isBug && (
            <div className="space-y-3 rounded-md border border-border bg-background/40 p-4">
              <Detail label="Environment">{t.environment || "—"}</Detail>
              <Detail label="Steps to reproduce"><pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{t.stepsToReproduce || "—"}</pre></Detail>
              <div className="grid md:grid-cols-2 gap-3">
                <Detail label="Expected"><span className="text-sm text-muted-foreground whitespace-pre-wrap">{t.expectedResult || "—"}</span></Detail>
                <Detail label="Actual"><span className="text-sm text-muted-foreground whitespace-pre-wrap">{t.actualResult || "—"}</span></Detail>
              </div>
            </div>
          )}
          {t.technicalNotes && <Detail label="Technical notes"><span className="text-sm text-muted-foreground whitespace-pre-wrap">{t.technicalNotes}</span></Detail>}

          <div>
            <h3 className="text-sm font-semibold mb-3">Comments</h3>
            <div className="space-y-3">
              {(comments.data ?? []).map((c) => (
                <div key={c.id} className="rounded-md border border-border bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground mb-1"><span className="font-medium text-foreground">{c.authorName}</span> · {new Date(c.createdAt).toLocaleString()}</div>
                  <div className="text-sm whitespace-pre-wrap">{c.content}</div>
                </div>
              ))}
              {(comments.data?.length ?? 0) === 0 && <div className="text-sm text-muted-foreground">No comments yet.</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <input className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button disabled={!comment.trim() || addComment.isPending} onClick={() => addComment.mutate(comment.trim())} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm">Post</button>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-3">
            <Detail label="Project">{t.projectName ?? "—"}</Detail>
            <Detail label="Assignee">
              {can(user?.role, "assign-ticket") ? (
                <select className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  value={t.assigneeId ?? ""}
                  onChange={(e) => assignMutation.mutate(e.target.value || null)}>
                  <option value="">Unassigned</option>
                  {(users.data ?? []).filter((u) => u.isActive).map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              ) : (t.assigneeName ?? <span className="italic text-muted-foreground">Unassigned</span>)}
            </Detail>
            <Detail label="Reporter">{t.reporterName}</Detail>
            <Detail label="Status">
              <select className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                value={t.status}
                onChange={(e) => updateStatus.mutate(e.target.value as TicketStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </Detail>
            <Detail label="Due date">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</Detail>
            <Detail label="Resolved">{t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : "—"}</Detail>
            <Detail label="Updated">{new Date(t.updatedAt).toLocaleString()}</Detail>
          </Card>
        </div>
      </div>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
