import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — BugBox" }] }),
  component: RegisterPage,
});

const ROLES: Role[] = ["Developer", "QA", "ProductOwner", "TechLead", "Admin"];

function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("Developer");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      await register({ fullName, email, password, role });
      void nav({ to: "/dashboard" });
    } catch (e: any) {
      setErr(e?.message ?? "Registration failed.");
    } finally { setBusy(false); }
  }

  const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">B</div>
          <div className="font-semibold text-lg tracking-tight">BugBox</div>
        </div>
        <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <label className="block"><div className="text-xs font-medium text-muted-foreground mb-1">Full name</div>
            <input className={input} value={fullName} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="block"><div className="text-xs font-medium text-muted-foreground mb-1">Email</div>
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="block"><div className="text-xs font-medium text-muted-foreground mb-1">Password</div>
            <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <label className="block"><div className="text-xs font-medium text-muted-foreground mb-1">Confirm password</div>
            <input className={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>
          <label className="block"><div className="text-xs font-medium text-muted-foreground mb-1">Role</div>
            <select className={input} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select></label>
          {err && <div className="text-sm text-danger">{err}</div>}
          <button disabled={busy} type="submit" className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {busy ? "Creating…" : "Create account"}
          </button>
          <div className="text-sm text-center text-muted-foreground">
            Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
