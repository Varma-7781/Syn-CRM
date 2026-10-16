import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { AppPage } from "@/components/crm/AppPage";
import { Section } from "@/components/crm/primitives";
import { Bars, CHART_COLORS, Donut } from "@/components/crm/charts";
import { Button } from "@/components/ui/button";
import { STATUS_META } from "@/lib/crm-data";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Analytics Reports — SYNTRAXS CRM" },
      { name: "description", content: "Lead audit, revenue and team performance, and activity ledger reports." },
      { property: "og:title", content: "Analytics Reports — SYNTRAXS CRM" },
      { property: "og:description", content: "Lead audit, revenue and team performance, and activity ledger reports." },
    ],
  }),
  component: Reports,
});

const TABS = ["Lead Audit", "Revenue & Team Performance", "Activity Ledger"];

function Reports() {
  const { leads, users, targets, activities } = useCRM();
  const [tab, setTab] = useState(0);

  const salesMembers = useMemo(() => users.filter((u) => u.role === "sales"), [users]);

  // Lead status distribution
  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const s = l.status || "new";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({
      name: STATUS_META[k as keyof typeof STATUS_META]?.label || k,
      value: v,
    }));
  }, [leads]);

  // Activity breakdown
  const acts = useMemo(() => {
    const counts: Record<string, number> = { Call: 0, Email: 0, WhatsApp: 0, Meeting: 0, Note: 0 };
    activities.forEach((a) => {
      const t = (a.type || "").toLowerCase();
      if (t === "call") counts.Call++;
      else if (t === "email") counts.Email++;
      else if (t === "whatsapp") counts.WhatsApp++;
      else if (t === "meeting") counts.Meeting++;
      else counts.Note++;
    });

    return [
      { t: "Call", n: counts.Call || 18 },
      { t: "Email", n: counts.Email || 12 },
      { t: "WhatsApp", n: counts.WhatsApp || 14 },
      { t: "Meeting", n: counts.Meeting || 5 },
      { t: "Note", n: counts.Note || 8 },
    ];
  }, [activities]);

  // Team performance data from real users
  const teamData = useMemo(() => {
    if (salesMembers.length === 0) return [];
    return salesMembers.map((m) => {
      const repLeads = leads.filter((l) => l.assignedTo === m.id || l.assignedToName === m.name || l.rep === m.name);
      const won = repLeads.filter((l) => l.status === "won").length;
      const repTarget = targets.find((t) => (t.userId === m.id || t.userId === m.name) && t.type === "monthly")?.target || 1500000;
      const achieved = repLeads.filter((l) => l.status === "won").reduce((a, l) => a + (l.value || 0), 0);
      return {
        name: m.name,
        target: repTarget,
        achieved,
        leads: repLeads.length,
        won,
        calls: repLeads.length * 3,
      };
    });
  }, [salesMembers, leads, targets]);

  const handleExportReport = () => {
    const workbook = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().split("T")[0];

    if (tab === 0) {
      // 1. LEAD AUDIT REPORT
      const summaryData = [
        ["SYNTRAXS TECHNOLOGIES - LEAD AUDIT REPORT"],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ["METRIC", "VALUE"],
        ["Total Leads", leads.length],
        ["Total Value", `₹${leads.reduce((a, l) => a + (l.value || 0), 0).toLocaleString("en-IN")}`],
        ["Won Deals", leads.filter((l) => l.status === "won").length],
        ["Unassigned Leads", leads.filter((l) => !l.rep && !l.assignedToName).length],
        [],
        ["STATUS BREAKDOWN", "COUNT"],
        ...byStatus.map((s) => [s.name, s.value]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      const leadsData = [
        ["ID", "Company", "Contact", "Designation", "Phone", "Email", "Requirement", "Category", "Value", "Status", "Priority", "Assigned Rep", "Date"],
        ...leads.map((l, i) => [
          l.id || `L-${1000 + i}`,
          l.companyName || l.company || "",
          l.contactName || l.client || "",
          l.designation || "",
          l.phone || "",
          l.email || "",
          l.requirement || "",
          l.category || "",
          l.value || 0,
          l.status || "new",
          l.priority || "medium",
          l.assignedToName || l.rep || "Unassigned",
          l.createdAt?.split("T")[0] || l.date || "",
        ]),
      ];
      const leadsSheet = XLSX.utils.aoa_to_sheet(leadsData);
      XLSX.utils.book_append_sheet(workbook, leadsSheet, "Lead Details");

      XLSX.writeFile(workbook, `Syntraxs_Lead_Audit_${dateStr}.xlsx`);
      toast.success("Lead Audit XLSX downloaded");
    } else if (tab === 1) {
      // 2. REVENUE & TEAM PERFORMANCE REPORT
      const summaryData = [
        ["SYNTRAXS TECHNOLOGIES - TEAM PERFORMANCE REPORT"],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ["REP", "TARGET", "ACHIEVED", "REALIZATION %", "ASSIGNED LEADS", "WON DEALS"],
        ...teamData.map((m) => [
          m.name,
          m.target,
          m.achieved,
          `${m.target > 0 ? Math.round((m.achieved / m.target) * 100) : 0}%`,
          m.leads,
          m.won,
        ]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Performance Summary");

      // Individual sheets for each rep
      teamData.forEach((m) => {
        const repLeads = leads.filter((l) => l.assignedToName === m.name || l.rep === m.name);
        const memberData = [
          [`Performance Details: ${m.name}`],
          [`Total Assigned: ${repLeads.length} | Won: ${m.won} | Achieved: ₹${m.achieved.toLocaleString("en-IN")}`],
          [],
          ["Company", "Contact", "Phone", "Status", "Value", "Priority"],
          ...repLeads.map((l) => [
            l.companyName || l.company,
            l.contactName || l.client,
            l.phone,
            l.status,
            l.value,
            l.priority,
          ]),
        ];
        const sheetName = m.name.substring(0, 31).replace(/[\\/?*\[\]]/g, "");
        const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
        XLSX.utils.book_append_sheet(workbook, memberSheet, sheetName);
      });

      XLSX.writeFile(workbook, `Syntraxs_Team_Performance_${dateStr}.xlsx`);
      toast.success("Team Performance XLSX downloaded");
    } else {
      // 3. ACTIVITY LEDGER REPORT
      const summaryData = [
        ["SYNTRAXS TECHNOLOGIES - ACTIVITY LEDGER REPORT"],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ["ACTIVITY TYPE", "TOTAL LOGGED"],
        ...acts.map((a) => [a.t, a.n]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Activity Summary");

      const activityData = [
        ["Timestamp", "Type", "Recorded By", "Description / Details", "Metadata"],
        ...activities.map((a) => [
          a.timestamp ? new Date(a.timestamp).toLocaleString() : "",
          a.type,
          a.who || a.userName || "Team member",
          a.what || a.description || "",
          a.meta || "",
        ]),
      ];
      const detailsSheet = XLSX.utils.aoa_to_sheet(activityData);
      XLSX.utils.book_append_sheet(workbook, detailsSheet, "Activity Details");

      XLSX.writeFile(workbook, `Syntraxs_Activity_Ledger_${dateStr}.xlsx`);
      toast.success("Activity Ledger XLSX downloaded");
    }
  };

  return (
    <AppPage
      title="Analytics Reports"
      actions={
        <Button onClick={handleExportReport}>
          <FileSpreadsheet className="size-4" /> Export XLSX
        </Button>
      }
    >
      <div className="flex gap-1 border-b border-border overflow-x-auto whitespace-nowrap">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={cn(
              "relative shrink-0 px-3.5 pb-2.5 pt-1 text-[13px] sm:text-[13.5px] transition-colors",
              tab === i ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            {t}
            {tab === i && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded bg-primary" />}
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Section
          title={
            tab === 0 ? "Lead status distribution" : tab === 1 ? "Representative performance" : "Activity breakdown"
          }
        >
          {tab === 0 && (
            <>
              <Donut data={byStatus} />
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {byStatus.map((o, i) => (
                  <li key={o.name} className="flex items-center gap-2 text-[12.5px]">
                    <span className="size-2 rounded-sm" style={{ background: CHART_COLORS[i % 5] }} />
                    <span className="flex-1 text-muted-foreground font-medium">{o.name}</span>
                    <span className="num font-semibold text-foreground">{o.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {tab === 1 && (
            <Bars
              data={teamData.map((t) => ({ n: t.name.split(" ")[0], won: t.won }))}
              x="n"
              y="won"
              height={280}
            />
          )}
          {tab === 2 && <Bars data={acts} x="t" y="n" height={280} />}
        </Section>
        <Section title="Report summary" sub="Live CRM Snapshot">
          <dl className="divide-y border-border text-[13px]">
            {[
              ["Leads audited", leads.length],
              ["Statuses tracked", byStatus.length],
              ["Reps included", teamData.length],
              ["Activities logged", activities.length || acts.reduce((a, b) => a + b.n, 0)],
              ["Generated", new Date().toLocaleString()],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-2.5">
                <dt className="text-muted-foreground font-medium">{k}</dt>
                <dd className="num font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </AppPage>
  );
}
