import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Mail, MessageCircle, PhoneCall, Trophy, CalendarClock, StickyNote, ArrowRight } from "lucide-react";
import { AppPage } from "@/components/crm/AppPage";
import { Avatar, Kpi, KpiStrip, Meter, Section } from "@/components/crm/primitives";
import { RevenueArea } from "@/components/crm/charts";
import { inr, STATUS_META } from "@/lib/crm-data";
import { computeSixMonthTrajectory } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCRM } from "@/context/CRMContext";

export const ACT_ICON: Record<string, typeof Mail> = {
  call: PhoneCall,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: CalendarClock,
  won: Trophy,
  note: StickyNote,
};

export function AdminOverview() {
  const { leads, targets, activities, users } = useCRM();

  const wonLeads = leads.filter((l) => l.status === "won");
  const won = wonLeads.reduce((a, l) => a + (l.value || 0), 0);
  const monthlyTargets = targets.filter((t) => t.type === "monthly");
  const target = monthlyTargets.reduce((a, t) => a + (t.target || 0), 0);
  const realization = target > 0 ? Math.min(100, Math.round((won / target) * 100)) : 0;
  const salesUsers = users.filter((u) => u.role === "sales");
  const repCount = salesUsers.length;

  const trajectory = useMemo(() => computeSixMonthTrajectory(leads, targets), [leads, targets]);

  const funnelStages = ["new", "interested", "follow_up", "quotation_sent", "won"] as const;
  const funnel = funnelStages.map((s) => ({
    s,
    n: leads.filter((l) => l.status === s).length,
  }));
  const max = Math.max(1, ...funnel.map((f) => f.n));

  // Build team rows dynamically from real Firestore sales users
  const scorecardReps = salesUsers;
  const scorecard = scorecardReps.map((rep) => {
    const repTargetObj = targets.find((t) => (t.userId === rep.id || t.userId === rep.name) && t.type === "monthly");
    const repTarget = repTargetObj ? repTargetObj.target : 0;
    const repWon = leads.filter((l) => (l.assignedTo === rep.id || l.assignedToName === rep.name || l.rep === rep.name) && l.status === "won");
    const repAchieved = repWon.reduce((a, l) => a + (l.value || 0), 0);
    return {
      name: rep.name,
      target: repTarget,
      achieved: repAchieved,
    };
  });

  return (
    <AppPage
      title="Executive Overview"
      sub="Real-time pipeline pacer & revenue metrics"
      actions={
        <>
          <Link to="/admin/reports">
            <Button variant="outline">Analytics reports</Button>
          </Link>
          <Link to="/admin/leads">
            <Button>View leads</Button>
          </Link>
        </>
      }
    >
      <KpiStrip>
        <Kpi label="Total pipeline leads" value={String(leads.length)} delta={8.4} context="Active across stages" />
        <Kpi label="Won revenue" value={inr(won)} delta={12.1} context={`${wonLeads.length} deals closed`} />
        <Kpi label="Target realization" value={`${realization}%`} context={`${inr(Math.max(0, target - won))} to target`}>
          <Meter value={realization} />
        </Kpi>
        <Kpi label="Sales representatives" value={`${repCount} active`} context="Live team members" />
      </KpiStrip>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Section
          title="Revenue pacing"
          sub="Won revenue vs. monthly target, 6 months"
          action={
            <span className="flex items-center gap-3 text-[12px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-primary" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-0 w-3 border-t border-dashed border-muted-foreground" />Target</span>
            </span>
          }
        >
          <div className="mb-3 flex flex-wrap gap-6 text-[12px]">
            <div><div className="eyebrow">Current</div><div className="num mt-1 text-[19px] font-bold text-foreground">{inr(won)}</div></div>
            <div><div className="eyebrow">Target</div><div className="num mt-1 text-[19px] font-bold text-foreground">{inr(target)}</div></div>
            <div><div className="eyebrow">Gap</div><div className="num mt-1 text-[19px] font-bold text-warning">{inr(Math.max(0, target - won))}</div></div>
          </div>
          <RevenueArea data={trajectory} />
        </Section>
        <Section title="Pipeline funnel" sub="Leads by stage">
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.s}>
                <div className="mb-1 flex justify-between text-[12.5px]">
                  <span className="num font-medium text-foreground">{STATUS_META[f.s]?.label || f.s}</span>
                  <span className="num font-semibold text-foreground">
                    {f.n}
                    {i > 0 && funnel[i - 1].n > 0 && (
                      <span className="ml-2 font-medium text-muted-foreground">{Math.round((f.n / funnel[i - 1].n) * 100)}%</span>
                    )}
                  </span>
                </div>
                <div className="h-6 rounded bg-muted">
                  <div
                    className={cn("h-full rounded animate-grow-x", f.s === "won" ? "bg-success" : "bg-primary")}
                    style={{ width: `${Math.max(4, (f.n / max) * 100)}%`, opacity: 1 - i * 0.13, animationDelay: `${i * 80}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Section
          title="Monthly quota scorecard"
          action={<Link to="/admin/team" className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">Team view <ArrowRight className="size-3" /></Link>}
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">Rep</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Target</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Achieved</th>
                  <th className="w-[35%] px-4 py-2.5 font-semibold">Realization</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {scorecard.map((r) => {
                  const p = r.target > 0 ? Math.round((r.achieved / r.target) * 100) : 0;
                  return (
                    <tr key={r.name} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-2.5"><span className="flex items-center gap-2.5 text-foreground"><Avatar name={r.name} /><span className="font-semibold text-foreground text-[13.5px]">{r.name}</span></span></td>
                      <td className="num px-2 text-right font-medium text-muted-foreground">{inr(r.target)}</td>
                      <td className="num px-2 text-right font-semibold text-foreground">{inr(r.achieved)}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <Meter value={p} tone={p >= 100 ? "success" : p >= 70 ? "primary" : "warning"} />
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
        <Section title="Recent pipeline engagements" bodyClass="p-0">
          <ActivityList items={activities.length > 0 ? activities : undefined} />
        </Section>
      </div>
    </AppPage>
  );
}

export function ActivityList({ items }: { items?: any[] }) {
  const list = items || [];
  if (list.length === 0) {
    return <div className="p-4 text-center text-[13px] text-muted-foreground font-medium">No recent pipeline engagements logged.</div>;
  }

  return (
    <ul className="divide-y divide-border">
      {list.slice(0, 7).map((a, i) => {
        const I = ACT_ICON[a.type] || StickyNote;
        return (
          <li key={a.id || i} className="flex gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
            <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border", a.type === "won" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground")}>
              <I className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-foreground">{a.what || a.description}</div>
              <div className="text-[12px] text-muted-foreground">{a.who || a.userName || "Team member"} · {a.meta || "Activity"}</div>
            </div>
            <span className="num shrink-0 text-[12px] font-medium text-muted-foreground">{a.t || (a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
          </li>
        );
      })}
    </ul>
  );
}
