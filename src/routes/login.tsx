import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/crm/LoginScreen";

export const Route = createFileRoute("/login")({
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
  component: LoginScreen,
});
