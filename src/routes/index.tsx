import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCRM } from "@/context/CRMContext";
import { LoginScreen } from "@/components/crm/LoginScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — SYNTRAXS Technologies CRM" },
      { name: "description", content: "Sign in to the SYNTRAXS enterprise CRM workspace for leads, sales performance and customer relationships." },
      { property: "og:title", content: "SYNTRAXS Technologies — Enterprise CRM" },
      { property: "og:description", content: "One intelligent workspace for managing leads, sales performance and customer relationships." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootIndex,
});

function RootIndex() {
  const { currentUser, loading } = useCRM();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (currentUser) {
      navigate({
        to: currentUser.role === "admin" ? "/admin/overview" : "/sales/pipeline",
        replace: true,
      });
    }
  }, [currentUser, loading, navigate, mounted]);

  // Keep SSR and initial client hydration identical to eliminate hydration mismatch
  if (mounted && currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return <LoginScreen />;
}
