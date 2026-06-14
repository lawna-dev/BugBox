import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
}
