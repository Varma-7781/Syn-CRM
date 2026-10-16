import { useMemo } from "react";
import { Clock, PhoneCall, CheckCircle } from "lucide-react";
import { AppPage } from "@/components/crm/AppPage";
import { Kpi, KpiStrip, Meter } from "@/components/crm/primitives";
import { LeadTable } from "@/components/crm/LeadTable";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/crm-data";
import { useCRM } from "@/context/CRMContext";
import { toast } from "sonner";

export function SalesCockpit() {
  const { currentUser, leads, targets, upcomingFollowUps, updateLead } = useCRM();

  const userName = currentUser?.name || "Sales Rep";

  // Filter real leads assigned to current user
  const mine = useMemo(() => {
    if (!currentUser) return [];
    const assigned = leads.filter(
      (l) =>
        l.assignedTo === currentUser.id ||
        l.assignedToName?.toLowerCase() === currentUser.name?.toLowerCase() ||
        l.rep?.toLowerCase() === currentUser.name?.toLowerCase() ||
        l.assignedTo === currentUser.email
    );
    return assigned;
  }, [leads, currentUser]);

  const wonLeads = useMemo(() => mine.filter((l) => l.status === "won"), [mine]);
  const wonRev = useMemo(() => wonLeads.reduce((a, l) => a + (l.value || 0), 0), [wonLeads]);
  const pipelineRev = useMemo(() => mine.reduce((a, l) => a + (l.value || 0), 0), [mine]);
  const winRate = mine.length > 0 ? ((wonLeads.length / mine.length) * 100).toFixed(1) : "0";

  // Target quota for this user
  const userTarget = useMemo(() => {
    const t = targets.find((t) => (t.userId === currentUser?.id || t.userId === currentUser?.name) && t.type === "monthly");
    return t ? t.target : 1500000;
  }, [targets, currentUser]);

  const quotaPercent = userTarget > 0 ? Math.min(100, Math.round((wonRev / userTarget) * 100)) : 0;

  // Imminent follow-up lead
  const nextReminder = upcomingFollowUps.length > 0 ? upcomingFollowUps[0] : null;

  const handleMarkCalled = async () => {
    if (!nextReminder) return;
    await updateLead(nextReminder.lead.id, {
      followUpStatus: "completed",
      followUpCompletedAt: new Date().toISOString(),
    });
    toast.success("Follow-up marked as completed");
  };

  const handleDismissReminder = async () => {
    if (!nextReminder) return;
    await updateLead(nextReminder.lead.id, {
      followUpStatus: "overdue",
      followUpOverdueReason: "dismissed",
    });
    toast.warning("Follow-up dismissed and marked overdue");
  };

  return (
    <AppPage
      title={`Good day, ${userName.split(" ")[0]}`}
      sub={`${upcomingFollowUps.length} follow-up${upcomingFollowUps.length === 1 ? "" : "s"} scheduled · live quota tracking`}
    >
      {nextReminder ? (
        <div className="panel flex flex-wrap items-center gap-4 border-primary/30 bg-primary/5 p-3.5 animate-rise">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Clock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-foreground">
              Call {nextReminder.lead.contactName || nextReminder.lead.client} · {nextReminder.lead.companyName || nextReminder.lead.company}
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              {nextReminder.lead.requirement || "Scheduled follow-up"} · {nextReminder.lead.phone}
            </div>
          </div>
          <span className="num rounded bg-background px-2.5 py-1 text-[13px] font-semibold text-primary ring-1 ring-primary/30">
            in {nextReminder.minutesRemaining}m
          </span>
          <Button variant="outline" size="sm" onClick={handleDismissReminder}>
            Dismiss
          </Button>
          <Button size="sm" onClick={handleMarkCalled}>
            <PhoneCall className="size-3.5" /> Mark as called
          </Button>
        </div>
      ) : (
        <div className="panel flex items-center gap-3 border-border bg-surface px-4 py-3.5 text-[13.5px] font-medium text-muted-foreground">
          <CheckCircle className="size-4 text-success" />
          <span>No urgent follow-ups pending in the next 5 minutes. You're all caught up!</span>
        </div>
      )}

      <KpiStrip cols={5}>
        <Kpi label="Assigned leads" value={String(mine.length)} />
        <Kpi label="Revenue won" value={inr(wonRev)} delta={11.4} />
        <Kpi label="Win conversion" value={`${winRate}%`} delta={2.2} />
        <Kpi label="Total in pipeline" value={inr(pipelineRev)} />
        <Kpi
          label="Target quota"
          value={`${quotaPercent}%`}
          context={`${inr(wonRev)} of ${inr(userTarget)}`}
        >
          <Meter value={quotaPercent} tone={quotaPercent >= 100 ? "success" : "primary"} />
        </Kpi>
      </KpiStrip>

      <LeadTable leads={mine} />
    </AppPage>
  );
}
