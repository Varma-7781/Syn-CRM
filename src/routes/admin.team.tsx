import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, ShieldCheck } from "lucide-react";
import { AppPage } from "@/components/crm/AppPage";
import { Avatar, Kpi, KpiStrip, Meter, Section } from "@/components/crm/primitives";
import { ActivityList } from "@/components/crm/AdminOverview";
import { Bars } from "@/components/crm/charts";
import { inr } from "@/lib/crm-data";
import { useCRM } from "@/context/CRMContext";
import { Button } from "@/components/ui/button";
import { AddSalesRepresentativeDialog } from "@/components/crm/AddSalesRepresentativeDialog";
import { AddAdminDialog } from "@/components/crm/AddAdminDialog";

export const Route = createFileRoute("/admin/team")({
  head: () => ({ meta: [
    { title: "Team Performance — NexLead CRM" },
    { name: "description", content: "Compare rep performance, quota realization and activity." },
    { property: "og:title", content: "Team Performance — NexLead CRM" },
    { property: "og:description", content: "Compare rep performance, quota realization and activity." },
  ] }),
  component: Team,
});

function Team() {
  const { currentUser, users, leads, targets, activities } = useCRM();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const salesUsers = users.filter((u) => u.role === "sales");
  const adminUsers = users.filter((u) => u.role === "admin");

  const repList = salesUsers.map((u) => {
    const repLeads = leads.filter((l) => l.assignedTo === u.id || l.assignedToName === u.name || l.rep === u.name);
    const repWon = repLeads.filter((l) => l.status === "won");
    const repRev = repWon.reduce((a, l) => a + (l.value || 0), 0);
    const repCalls = activities.filter((a) => (a.userId === u.id || a.who === u.name) && a.type === "call").length;
    const repTargetObj = targets.find((t) => (t.userId === u.id || t.userId === u.name) && t.type === "monthly");
    const repTarget = repTargetObj ? repTargetObj.target : 0;
    return {
      name: u.name,
      leads: repLeads.length,
      won: repWon.length,
      calls: repCalls,
      achieved: repRev,
      target: repTarget,
    };
  });

  const totalRevenue = repList.reduce((a, r) => a + (r.achieved || 0), 0);
  const totalWon = repList.reduce((a, r) => a + (r.won || 0), 0);
  const totalCalls = repList.reduce((a, r) => a + (r.calls || 0), 0);
  const totalLeads = repList.reduce((a, r) => a + (r.leads || 0), 0);
  const avgWinRate = totalLeads > 0 ? ((totalWon / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <AppPage
      title="Team Performance"
      sub="Live sales quota realization & rep metrics"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            defaultValue="2026-10"
            className="h-8 rounded-md border border-border bg-surface px-2 text-[12.5px] text-foreground"
          />
          {currentUser?.role === "admin" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddAdminOpen(true)}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="size-4 text-primary" />
              <span>Add Admin</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="size-4" />
            <span>Add Sales Representative</span>
          </Button>
        </div>
      }
    >
      <KpiStrip>
        <Kpi label="Team revenue" value={inr(totalRevenue)} delta={9.2} />
        <Kpi label="Deals won" value={String(totalWon)} delta={4.0} />
        <Kpi label="Calls logged" value={String(totalCalls)} delta={-2.3} />
        <Kpi label="Avg. win rate" value={`${avgWinRate}%`} delta={1.8} />
      </KpiStrip>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Section title="Scorecard" bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">Rep</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Leads</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Won</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Calls</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Revenue</th>
                  <th className="w-[28%] px-4 py-2.5 font-semibold">Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {[...repList]
                  .sort((a, b) => (b.achieved || 0) / (b.target || 1) - (a.achieved || 0) / (a.target || 1))
                  .map((r, i) => {
                    const p = r.target > 0 ? Math.round(((r.achieved || 0) / r.target) * 100) : 0;
                    return (
                      <tr key={r.name} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2.5">
                            <span className="num w-4 text-[12.5px] font-medium text-muted-foreground">{i + 1}</span>
                            <Avatar name={r.name} />
                            <span className="font-semibold text-foreground text-[13.5px]">{r.name}</span>
                          </span>
                        </td>
                        <td className="num px-2 text-right font-medium text-muted-foreground">{r.leads}</td>
                        <td className="num px-2 text-right font-medium text-muted-foreground">{r.won}</td>
                        <td className="num px-2 text-right font-medium text-muted-foreground">{r.calls}</td>
                        <td className="num px-2 text-right font-semibold text-foreground">{inr(r.achieved || 0)}</td>
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
        <Section title="Deals won by rep">
          <Bars data={repList.map((t) => ({ n: t.name.split(" ")[0], won: t.won || 0 }))} x="n" y="won" />
        </Section>
      </div>

      {adminUsers.length > 0 && (
        <Section title="Administrative Team" sub="Authorized administrators with executive system oversight" bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">Administrator</th>
                  <th className="px-4 py-2.5 font-semibold">Work Email</th>
                  <th className="px-4 py-2.5 font-semibold">Department</th>
                  <th className="px-4 py-2.5 font-semibold">Phone</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {adminUsers.map((adm) => (
                  <tr key={adm.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={adm.name} />
                        <span className="font-semibold text-foreground text-[13.5px]">{adm.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-muted-foreground">{adm.email}</td>
                    <td className="px-4 py-3 font-medium text-muted-foreground">{adm.department || "Management"}</td>
                    <td className="px-4 py-3 font-medium text-muted-foreground">{adm.phone || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-primary">
                        <ShieldCheck className="size-3.5" />
                        Administrator
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Recent activity ledger" bodyClass="p-0">
        <ActivityList items={activities.length > 0 ? activities : undefined} />
      </Section>
      <AddSalesRepresentativeDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <AddAdminDialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen} />
    </AppPage>
  );
}
