import { createFileRoute } from "@tanstack/react-router";
import { AdminOverview } from "@/components/crm/AdminOverview";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Executive Overview — SYNTRAXS CRM" },
      { name: "description", content: "Pipeline, revenue pacing and team quota at a glance." },
      { property: "og:title", content: "Executive Overview — SYNTRAXS CRM" },
      { property: "og:description", content: "Pipeline, revenue pacing and team quota at a glance." },
    ],
  }),
  component: AdminOverview,
});
