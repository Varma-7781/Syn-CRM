import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/crm/AppShell";
import { useCRM } from "@/context/CRMContext";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { currentUser, loading } = useCRM();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!currentUser) {
      navigate({ to: "/login", replace: true });
    } else if (currentUser.role !== "admin") {
      navigate({ to: "/sales/pipeline", replace: true });
    }
  }, [currentUser, loading, navigate, mounted]);

  // During SSR and initial client hydration before mount, show loader to match DOM exactly
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <AppShell role="admin">
      <Outlet />
    </AppShell>
  );
}
