import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card } from "@/components/AppShell";
import type { Project, Ticket, TicketPriority, TicketSeverity, TicketType, UserDto } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/tickets/new")({
  head: () => ({ meta: [{ title: "New ticket — BugBox" }] }),
  component: NewTicketPage,
});

const TYPES: TicketType[] = ["Bug","Feature","Task","Improvement","Incident","Refactor","Documentation"];
const PRIORITIES: TicketPriority[] = ["Low","Medium","High","Urgent"];
const SEVERITIES: TicketSeverity[] = ["Minor","Major","Critical","Blocker"];

function NewTicketPage() {
  const nav = useNavigate();
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/api/projects") });
  const users = useQuery({ queryKey: ["users"], queryFn: () => api<UserDto[]>("/api/users") });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("Bug");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [severity, setSeverity] = useState<TicketSeverity>("Major");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [environment, setEnv] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const body = {
        title, description, type, priority, severity,
        projectId: projectId || (projects.data?.[0]?.id ?? ""),
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        environment: environment || null,
        stepsToReproduce: steps || null,
        expectedResult: expected || null,
        actualResult: actual || null,
        technicalNotes: notes || null,
        estimatedHours: null, spentHours: null,
        duplicateOfTicketId: null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const created = await api<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(body) });
      void nav({ to: "/tickets/$id", params: { id: created.id } });
    } catch (e: any) { setErr(e?.message ?? "Could not create ticket."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="New ticket" subtitle="Capture the issue while it's fresh." />
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 space-y-4">
          <Field label="Title"><input className={inp} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, specific summary" /></Field>
          <Field label="Description"><textarea className={inp + " min-h-28"} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's happening? Why does it matter?" /></Field>
          {type === "Bug" && (
            <div className="space-y-3 rounded-md border border-border p-4 bg-background/50">
              <div className="text-xs font-medium text-muted-foreground">Bug reproduction</div>
              <Field label="Environment"><input className={inp} value={environment} onChange={(e) => setEnv(e.target.value)} placeholder="Production / Staging / Local" /></Field>
              <Field label="Steps to reproduce"><textarea className={inp + " min-h-24"} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="1. …  2. …  3. …" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expected"><textarea className={inp + " min-h-20"} value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
                <Field label="Actual"><textarea className={inp + " min-h-20"} value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
              </div>
            </div>
          )}
          <Field label="Technical notes"><textarea className={inp + " min-h-20"} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Stack traces, repro notes, anything that helps." /></Field>
          {err && <div className="text-sm text-danger">{err}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => nav({ to: "/tickets" })} className="rounded-md border border-border px-3 py-1.5 text-sm">Cancel</button>
            <button disabled={busy} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">{busy ? "Creating…" : "Create ticket"}</button>
          </div>
        </Card>
        <Card className="space-y-3 h-fit">
          <Field label="Project">
            <select className={inp} value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">Select project…</option>
              {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Type"><select className={inp} value={type} onChange={(e) => setType(e.target.value as TicketType)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority"><select className={inp} value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Severity"><select className={inp} value={severity} onChange={(e) => setSeverity(e.target.value as TicketSeverity)}>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
          <Field label="Assignee">
            <select className={inp} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {(users.data ?? []).filter((u) => u.isActive).map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </Field>
          <Field label={`Due date${priority === "Urgent" ? " (required for urgent)" : ""}`}>
            <input className={inp} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required={priority === "Urgent"} />
          </Field>
          <Field label="Tags (comma separated)"><input className={inp} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="frontend, regression" /></Field>
        </Card>
      </form>
    </>
  );
}

const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>{children}</label>);
}
