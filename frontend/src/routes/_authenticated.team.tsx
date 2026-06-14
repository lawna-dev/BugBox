import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, PageHeader, EmptyState } from "@/components/AppShell";
import type { UserDto } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team — BugBox" }] }),
  component: TeamPage,
});

interface Workload {
  id: string; fullName: string; role: string;
  openAssigned: number; resolvedThisWeek: number;
}

function TeamPage() {
  const users = useQuery({ queryKey: ["users"], queryFn: () => api<UserDto[]>("/api/users") });
  const workload = useQuery({ queryKey: ["workload"], queryFn: () => api<Workload[]>("/api/reports/workload") });
  const wl = new Map((workload.data ?? []).map((w) => [w.id, w]));

  return (
    <>
      <PageHeader title="Team" subtitle="Who is on the case, and how loaded they are." />
      {(users.data?.length ?? 0) === 0 && <EmptyState title="No team members yet." />}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(users.data ?? []).map((u) => {
          const w = wl.get(u.id);
          return (
            <Card key={u.id}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{u.fullName[0]}</div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{u.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.role} · {u.email}</div>
                </div>
                <span className={`ml-auto text-[11px] rounded px-1.5 py-0.5 ring-1 ring-inset ${u.isActive ? "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30" : "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-700/40 dark:text-zinc-200 dark:ring-zinc-600"}`}>
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="rounded-md bg-muted/40 p-3"><div className="text-xs text-muted-foreground">Open assigned</div><div className="text-xl font-semibold mt-0.5">{w?.openAssigned ?? 0}</div></div>
                <div className="rounded-md bg-muted/40 p-3"><div className="text-xs text-muted-foreground">Resolved 7d</div><div className="text-xl font-semibold mt-0.5">{w?.resolvedThisWeek ?? 0}</div></div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
