import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppPage } from "@/components/crm/AppPage";
import { Kpi, KpiStrip, Meter, Section } from "@/components/crm/primitives";
import { Bars, CHART_COLORS, Donut, RevenueArea } from "@/components/crm/charts";
import { inr } from "@/lib/crm-data";
import { useCRM } from "@/context/CRMContext";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue Analytics — SYNTRAXS CRM" },
      { name: "description", content: "Revenue trajectory, rep contribution and acquisition sources." },
      { property: "og:title", content: "Revenue Analytics — SYNTRAXS CRM" },
      { property: "og:description", content: "Revenue trajectory, rep contribution and acquisition sources." },
    ],
  }),
  component: Revenue,
});

function Revenue() {
  const { leads, users } = useCRM();

  const wonLeads = useMemo(() => leads.filter((l) => l.status === "won"), [leads]);
  const revenueYTD = useMemo(() => wonLeads.reduce((a, l) => a + (l.value || 0), 0), [wonLeads]);
  const avgDealSize = wonLeads.length > 0 ? Math.round(revenueYTD / wonLeads.length) : 510000;
  const pendingPaymentLeads = useMemo(() => leads.filter((l) => l.status === "pending_payment"), [leads]);
  const pendingPayment = useMemo(
    () => pendingPaymentLeads.reduce((a, l) => a + (l.value || 0), 0),
    [pendingPaymentLeads]
  );
  const pipelineValue = useMemo(
    () => leads.filter((l) => l.status !== "lost" && l.status !== "won").reduce((a, l) => a + (l.value || 0), 0),
    [leads]
  );

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
      return [
        { name: "Referral", value: 38 },
        { name: "Inbound", value: 26 },
        { name: "Outbound", value: 18 },
        { name: "Events", value: 11 },
        { name: "Partners", value: 7 },
      ];
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
        lakh: Math.round(repWon / 100000),
      };
    });
  }, [leads, users]);

  const quotationVal = useMemo(() => {
    return leads.filter((l) => l.status === "quotation_sent").reduce((a, l) => a + (l.value || 0), 0) || 5420000;
  }, [leads]);

  return (
    <AppPage title="Revenue Analytics" sub="Where revenue comes from, and how fast it's growing">
      <KpiStrip>
        <Kpi label="Revenue YTD" value={inr(revenueYTD || 19200000)} delta={22.4} />
        <Kpi label="Avg. deal size" value={inr(avgDealSize)} delta={6.0} />
        <Kpi label="Pending payment" value={inr(pendingPayment || 2840000)} context={`${pendingPaymentLeads.length || 7} invoices`} />
        <Kpi label="Pipeline value" value={inr(pipelineValue || 11400000)} delta={-3.1} />
      </KpiStrip>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Section title="Six-month trajectory" sub="Is growth keeping pace with target?">
          <RevenueArea height={260} />
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
            {[
              ["Collection efficiency", 86],
              ["Quotation → won", 42],
              ["Follow-ups on time", 74],
              ["Lead response < 1h", 61],
            ].map(([k, v]) => (
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
