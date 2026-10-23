import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppPage } from "@/components/crm/AppPage";
import { Kpi, KpiStrip, Meter, Section } from "@/components/crm/primitives";
import { Bars, CHART_COLORS, Donut, RevenueArea } from "@/components/crm/charts";
import { inr } from "@/lib/crm-data";
import { computeSixMonthTrajectory } from "@/utils/helpers";
import { useCRM } from "@/context/CRMContext";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue Analytics — NexLead CRM" },
      { name: "description", content: "Revenue trajectory, rep contribution and acquisition sources." },
      { property: "og:title", content: "Revenue Analytics — NexLead CRM" },
      { property: "og:description", content: "Revenue trajectory, rep contribution and acquisition sources." },
    ],
  }),
  component: Revenue,
});

function Revenue() {
  const { leads, users, targets } = useCRM();

  const wonLeads = useMemo(() => leads.filter((l) => l.status === "won"), [leads]);
  const revenueYTD = useMemo(() => wonLeads.reduce((a, l) => a + (l.value || 0), 0), [wonLeads]);
  const avgDealSize = wonLeads.length > 0 ? Math.round(revenueYTD / wonLeads.length) : 0;
  const pendingPaymentLeads = useMemo(() => leads.filter((l) => l.status === "pending_payment"), [leads]);
  const pendingPayment = useMemo(
    () => pendingPaymentLeads.reduce((a, l) => a + (l.value || 0), 0),
    [pendingPaymentLeads]
  );
  const pipelineLeads = useMemo(
    () => leads.filter((l) => l.status !== "lost" && l.status !== "won"),
    [leads]
  );
  const pipelineValue = useMemo(
    () => pipelineLeads.reduce((a, l) => a + (l.value || 0), 0),
    [pipelineLeads]
  );

  const trajectory = useMemo(() => computeSixMonthTrajectory(leads, targets), [leads, targets]);

  // Dynamic acquisition origin breakdown
  const originData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || "Inbound";
      counts[src] = (counts[src] || 0) + 1;
    });

    const total = leads.length || 1;
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return [{ name: "No Data", value: 100 }];
    }

    return entries
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
      }))
      .slice(0, 5);
  }, [leads]);

  // Dynamic rep contribution
  const repContribution = useMemo(() => {
    const salesUsers = users.filter((u) => u.role === "sales");
    if (salesUsers.length === 0) {
      return [];
    }

    return salesUsers.map((u) => {
      const repWon = leads
        .filter((l) => (l.assignedTo === u.id || l.assignedToName === u.name || l.rep === u.name) && l.status === "won")
        .reduce((a, l) => a + (l.value || 0), 0);
      return {
        n: u.name.split(" ")[0],
        lakh: Math.round((repWon / 100000) * 10) / 10,
      };
    });
  }, [leads, users]);

  const quotationLeads = useMemo(() => leads.filter((l) => l.status === "quotation_sent"), [leads]);
  const quotationVal = useMemo(() => {
    return quotationLeads.reduce((a, l) => a + (l.value || 0), 0);
  }, [quotationLeads]);

  // Dynamic operational metrics
  const collectionEfficiency =
    revenueYTD + pendingPayment > 0
      ? Math.round((revenueYTD / (revenueYTD + pendingPayment)) * 100)
      : 100;

  const quotationToWon =
    wonLeads.length + quotationLeads.length > 0
      ? Math.round((wonLeads.length / (wonLeads.length + quotationLeads.length)) * 100)
      : (wonLeads.length > 0 ? 100 : 0);

  const completedFollowUps = leads.filter((l) => l.followUpStatus === "completed").length;
  const totalFollowUps = leads.filter((l) => !!l.nextFollowUp || !!l.followUpStatus).length;
  const followUpsOnTime =
    totalFollowUps > 0
      ? Math.round((completedFollowUps / totalFollowUps) * 100)
      : 100;

  const activePipelineRatio =
    leads.length > 0
      ? Math.round((pipelineLeads.length / leads.length) * 100)
      : 0;

  const operationalGauges = [
    ["Collection efficiency", collectionEfficiency],
    ["Quotation → won", quotationToWon],
    ["Follow-ups on time", followUpsOnTime],
    ["Active pipeline ratio", activePipelineRatio],
  ] as const;

  return (
    <AppPage title="Revenue Analytics" sub="Where revenue comes from, and how fast it's growing">
      <KpiStrip>
        <Kpi label="Revenue YTD" value={inr(revenueYTD)} delta={22.4} />
        <Kpi label="Avg. deal size" value={inr(avgDealSize)} delta={6.0} />
        <Kpi label="Pending payment" value={inr(pendingPayment)} context={`${pendingPaymentLeads.length} invoices`} />
        <Kpi label="Pipeline value" value={inr(pipelineValue)} delta={-3.1} />
      </KpiStrip>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Section title="Six-month trajectory" sub="Is growth keeping pace with target?">
          <RevenueArea height={260} data={trajectory} />
        </Section>
        <Section title="Acquisition origin" sub="Which channels win deals?">
          <Donut data={originData} />
          <ul className="mt-3 space-y-2">
            {originData.map((o, i) => (
              <li key={o.name} className="flex items-center gap-2 text-[13px]">
                <span className="size-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="flex-1 text-muted-foreground font-medium">{o.name}</span>
                <span className="num font-semibold text-foreground">{o.value}%</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Rep contribution" sub="Share of won revenue (₹ in Lakhs)">
          <Bars data={repContribution} x="n" y="lakh" />
        </Section>
        <Section title="Operational gauges">
          <div className="space-y-5">
            {operationalGauges.map(([k, v]) => (
              <div key={k as string}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="font-medium text-foreground">{k}</span>
                  <span className="num font-semibold text-foreground">{v}%</span>
                </div>
                <Meter
                  value={v as number}
                  tone={(v as number) > 80 ? "success" : (v as number) > 60 ? "primary" : "warning"}
                />
              </div>
            ))}
            <div className="text-[12.5px] text-muted-foreground font-medium">
              Capital allocated to open quotations: <span className="num font-bold text-foreground">{inr(quotationVal)}</span>
            </div>
          </div>
        </Section>
      </div>
    </AppPage>
  );
}
