import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/AppShell";
import { useTheme } from "@/lib/theme";
import { API_BASE } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — BugBox" }] }),
  component: SettingsPage,
});

const KEY = "bugbox.prefs";
interface Prefs { defaultView: "List" | "Kanban"; showResolved: boolean; defaultPriority: "Low" | "Medium" | "High" | "Urgent"; }
const defaults: Prefs = { defaultView: "List", showResolved: true, defaultPriority: "Medium" };

function SettingsPage() {
  const { theme, set } = useTheme();
  const [prefs, setPrefs] = useState<Prefs>(defaults);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(KEY);
    if (raw) try { setPrefs({ ...defaults, ...JSON.parse(raw) }); } catch {}
  }, []);

  function update<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }

  const inp = "rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <>
      <PageHeader title="Settings" subtitle="Personal preferences for your BugBox experience." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="space-y-4">
          <h2 className="font-semibold">Display</h2>
          <Row label="Theme">
            <select className={inp} value={theme} onChange={(e) => set(e.target.value as "light" | "dark")}>
              <option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </Row>
          <Row label="Default ticket view">
            <select className={inp} value={prefs.defaultView} onChange={(e) => update("defaultView", e.target.value as Prefs["defaultView"])}>
              <option>List</option><option>Kanban</option>
            </select>
          </Row>
          <Row label="Show resolved tickets">
            <select className={inp} value={prefs.showResolved ? "yes" : "no"} onChange={(e) => update("showResolved", e.target.value === "yes")}>
              <option value="yes">Yes</option><option value="no">No</option>
            </select>
          </Row>
          <Row label="Default ticket priority">
            <select className={inp} value={prefs.defaultPriority} onChange={(e) => update("defaultPriority", e.target.value as Prefs["defaultPriority"])}>
              <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
            </select>
          </Row>
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">API</h2>
          <div className="text-sm text-muted-foreground">Connected to:</div>
          <code className="block text-sm rounded-md bg-muted px-3 py-2 break-all">{API_BASE}</code>
          <p className="text-xs text-muted-foreground">Configure with <code className="px-1 rounded bg-muted">VITE_API_BASE_URL</code> in your <code>.env.local</code>.</p>
        </Card>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm">{label}</div>
      <div>{children}</div>
    </div>
  );
}
