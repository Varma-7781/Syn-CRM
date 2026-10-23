import { createFileRoute } from "@tanstack/react-router";
import { SalesCockpit } from "@/components/crm/SalesCockpit";

export const Route = createFileRoute("/sales/")({
  head: () => ({
    meta: [
      { title: "My Lead Pipeline — NexLead CRM" },
      { name: "description", content: "Your assigned leads, follow-ups and quota in one sales cockpit." },
      { property: "og:title", content: "My Lead Pipeline — NexLead CRM" },
      { property: "og:description", content: "Your assigned leads, follow-ups and quota in one sales cockpit." },
    ],
  }),
  component: SalesCockpit,
});
