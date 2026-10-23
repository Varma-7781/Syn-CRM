import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppPage } from "@/components/crm/AppPage";
import { Meter, Section } from "@/components/crm/primitives";
import { inr } from "@/lib/crm-data";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sales/quota")({
  head: () => ({
    meta: [
      { title: "Quota & Target History — NexLead CRM" },
      { name: "description", content: "Your monthly targets against what you achieved." },
      { property: "og:title", content: "Quota & Target History — NexLead CRM" },
      { property: "og:description", content: "Your monthly targets against what you achieved." },
    ],
  }),
  component: Quota,
});

function Quota() {
  const { currentUser, targets, leads } = useCRM();

  const history = useMemo(() => {
    if (!currentUser) return [];

    const userTargets = targets.filter(
      (t) =>
        t.userId === currentUser.id ||
        t.userId?.toLowerCase() === currentUser.name?.toLowerCase() ||
        t.userId === currentUser.email
    );

    if (userTargets.length === 0) return [];

    const repLeads = leads.filter(
      (l) =>
        l.assignedTo === currentUser.id ||
        l.assignedToName?.toLowerCase() === currentUser.name?.toLowerCase() ||
        l.rep?.toLowerCase() === currentUser.name?.toLowerCase() ||
        l.assignedTo === currentUser.email
    );
    const wonTotal = repLeads.filter((l) => l.status === "won").reduce((a, l) => a + (l.value || 0), 0);

    return userTargets.map((t) => ({
      period: t.period,
      type: t.type,
      target: t.target,
      achieved: wonTotal || t.achieved || 0,
    }));
  }, [targets, leads, currentUser]);

  const max = Math.max(1, ...history.flatMap((q) => [q.target, q.achieved]));
  const metCount = history.filter((q) => q.achieved >= q.target).length;

  return (
    <AppPage title="Quota & Target History" sub={`${metCount} of ${history.length} periods at or above target`}>
      <Section title="Target vs. achieved" sub="Bar = achieved · tick = target">
        <div className="flex h-56 items-end gap-3 sm:gap-6">
          {history.map((q, i) => {
            const hit = q.achieved >= q.target;
            return (
              <div key={q.period + i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="relative flex w-full max-w-14 flex-1 items-end">
                  <div
                    className="absolute inset-x-0 h-[2px] bg-foreground/60"
                    style={{ bottom: `${Math.min(100, (q.target / max) * 100)}%` }}
                  />
                  <div
                    className={cn(
                      "w-full origin-bottom rounded-t animate-rise",
                      hit ? "bg-success/80" : "bg-primary/70"
                    )}
                    style={{ height: `${Math.min(100, (q.achieved / max) * 100)}%`, animationDelay: `${i * 70}ms` }}
                  />
                </div>
                <span className="num text-[11.5px] font-medium text-muted-foreground">{q.period}</span>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="History" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Period</th>
                <th className="px-2 py-2.5 text-right font-semibold">Target</th>
                <th className="px-2 py-2.5 text-right font-semibold">Achieved</th>
                <th className="w-[35%] px-4 py-2.5 font-semibold">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {[...history].reverse().map((q, i) => {
                const p = q.target > 0 ? Math.round((q.achieved / q.target) * 100) : 0;
                return (
                  <tr key={q.period + i} className="hover:bg-secondary/40 transition-colors">
                    <td className="num px-4 py-2.5 font-medium text-foreground">{q.period}</td>
                    <td className="num px-2 text-right font-medium text-muted-foreground">{inr(q.target)}</td>
                    <td className="num px-2 text-right font-semibold text-foreground">{inr(q.achieved)}</td>
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Meter value={p} tone={p >= 100 ? "success" : "primary"} />
                        <span className="num w-10 text-right text-[12.5px] font-semibold text-foreground">{p}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </AppPage>
  );
}
