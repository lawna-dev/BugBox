import type { TicketPriority, TicketSeverity, TicketStatus, TicketType } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const base = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, string> = {
    New:        "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
    Triaged:    "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
    InProgress: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
    InReview:   "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
    ReadyForQA: "bg-cyan-100 text-cyan-800 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30",
    Done:       "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
    Rejected:   "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-700/40 dark:text-zinc-200 dark:ring-zinc-600",
    Duplicate:  "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-700/40 dark:text-zinc-200 dark:ring-zinc-600",
  };
  return <span className={`${base} ${map[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, string> = {
    Low:    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    Medium: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
    High:   "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30",
    Urgent: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
  };
  return <span className={`${base} ${map[priority]}`}>{priority}</span>;
}

export function SeverityBadge({ severity }: { severity: TicketSeverity }) {
  const map: Record<TicketSeverity, string> = {
    Minor:    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    Major:    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
    Critical: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
    Blocker:  "bg-red-600 text-white ring-red-700 dark:bg-red-500 dark:text-white dark:ring-red-400",
  };
  return <span className={`${base} ${map[severity]}`}>{severity}</span>;
}

export function TypeBadge({ type }: { type: TicketType }) {
  return <span className={`${base} bg-muted text-muted-foreground ring-border`}>{type}</span>;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground ring-1 ring-inset ring-border">{children}</span>;
}
