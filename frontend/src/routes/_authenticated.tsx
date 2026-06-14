import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({ component: AuthenticatedLayout });

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) void nav({ to: "/login" }); }, [user, loading, nav]);
  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  return <AppShell><Outlet /></AppShell>;
}
