import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { StickyNote } from "lucide-react";
import { AppPage } from "@/components/crm/AppPage";
import { ACT_ICON } from "@/components/crm/AdminOverview";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sales/activity")({
  head: () => ({
    meta: [
      { title: "Recent Activity Log — SYNTRAXS CRM" },
      { name: "description", content: "Chronological log of your calls, emails, WhatsApp messages and meetings." },
      { property: "og:title", content: "Recent Activity Log — SYNTRAXS CRM" },
      { property: "og:description", content: "Chronological log of your calls, emails, WhatsApp messages and meetings." },
    ],
  }),
  component: SalesActivityLog,
});

function SalesActivityLog() {
  const { activities, currentUser } = useCRM();

  const userActs = useMemo(() => {
    if (!currentUser) return [];
    return activities.filter(
      (a: any) =>
        a.userId === currentUser.id ||
        a.who?.toLowerCase() === currentUser.name?.toLowerCase() ||
        a.userName?.toLowerCase() === currentUser.name?.toLowerCase()
    );
  }, [activities, currentUser]);

  return (
    <AppPage title="Recent Activity Log" sub="Chronological record of calls, emails, WhatsApp & meetings">
      <div className="panel p-5">
        <ol className="relative ml-3 space-y-6 border-l border-border">
          {userActs.map((a: any, i: number) => {
            const I = ACT_ICON[a.type] || StickyNote;
            const timeStr = a.t || (a.timestamp ? new Date(a.timestamp).toLocaleString() : "Recently");

            return (
              <li key={a.id || i} className="relative pl-6">
                <span
                  className={cn(
                    "absolute -left-[13px] flex size-6 items-center justify-center rounded-full bg-surface ring-1",
                    a.type === "won" ? "text-success ring-success/40" : "text-primary ring-border-strong"
                  )}
                >
                  <I className="size-3" />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-[14px] font-semibold text-foreground">
                    {a.what || a.description}
                  </span>
                  <span className="num text-[12px] font-medium text-muted-foreground">{timeStr}</span>
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {a.who || "You"} · {a.meta || "CRM interaction"}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </AppPage>
  );
}
