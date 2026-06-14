import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — BugBox" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@northwind.dev");
  const [password, setPassword] = useState("Password123!");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) { void nav({ to: "/dashboard" }); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await login(email, password);
      void nav({ to: "/dashboard" });
    } catch (e: any) {
      setErr(e?.message ?? "Sign in failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">B</div>
          <div className="font-semibold text-lg tracking-tight">BugBox</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back to your team's tracker.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <Field label="Email"><input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></Field>
            <Field label="Password"><input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></Field>
            {err && <div className="text-sm text-danger">{err}</div>}
            <button disabled={busy} type="submit" className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div className="mt-4 text-xs text-muted-foreground">
            Demo: <code className="px-1 rounded bg-muted">admin@northwind.dev</code> /{" "}
            <code className="px-1 rounded bg-muted">Password123!</code>
          </div>
        </div>
        <div className="mt-4 text-sm text-center text-muted-foreground">
          No account? <Link to="/register" className="text-primary hover:underline">Create one</Link>
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>{children}</label>);
}
