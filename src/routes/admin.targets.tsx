import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { AppPage } from "@/components/crm/AppPage";
import { Avatar, Kpi, KpiStrip, Meter, Section } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inr } from "@/lib/crm-data";
import { useCRM } from "@/context/CRMContext";
import { getCurrentPeriod } from "@/utils/helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/targets")({
  head: () => ({
    meta: [
      { title: "Target Management — SYNTRAXS CRM" },
      { name: "description", content: "Set and track weekly and monthly targets for every rep." },
      { property: "og:title", content: "Target Management — SYNTRAXS CRM" },
      { property: "og:description", content: "Set and track weekly and monthly targets for every rep." },
    ],
  }),
  component: Targets,
});

function Targets() {
  const { targets, users, leads, addTarget, updateTarget } = useCRM();
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [userId, setUserId] = useState("");
  const [targetType, setTargetType] = useState<"weekly" | "monthly">("monthly");
  const [targetAmount, setTargetAmount] = useState("");
  const [period, setPeriod] = useState(getCurrentPeriod("monthly"));
  const [adding, setAdding] = useState(false);

  // Edit in-line state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<string>("");

  const salesReps = users.filter((u) => u.role === "sales");

  // Derive target rows strictly from real Firestore targets
  const displayRows = targets
    .filter((t) => filterType === "all" || t.type === filterType)
    .map((t) => {
      const userObj = users.find((u) => u.id === t.userId);
      const repName = userObj ? userObj.name : t.userId;
      const repWon = leads.filter(
        (l) => (l.assignedTo === t.userId || l.assignedToName === repName || l.rep === repName) && l.status === "won"
      );
      const achieved = repWon.reduce((a, l) => a + (l.value || 0), 0);
      return {
        id: t.id,
        name: repName,
        type: t.type,
        period: t.period,
        target: t.target,
        achieved: achieved || t.achieved || 0,
      };
    });

  const totalTarget = displayRows.reduce((a, r) => a + r.target, 0);
  const totalAchieved = displayRows.reduce((a, r) => a + r.achieved, 0);
  const onTrackCount = displayRows.filter((r) => r.achieved >= r.target * 0.7).length;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !targetAmount) {
      toast.error("Please select a sales rep and enter an amount");
      return;
    }

    setAdding(true);
    try {
      await addTarget({
        userId,
        type: targetType,
        target: Number(targetAmount),
        period: period || getCurrentPeriod(targetType),
        achieved: 0,
      });
      setIsAddOpen(false);
      setTargetAmount("");
      setUserId("");
    } catch {
      toast.error("Failed to add target");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveInline = async (id: string) => {
    if (!editingVal) return;
    const num = Number(editingVal.replace(/[^0-9]/g, ""));
    if (!isNaN(num) && num > 0) {
      await updateTarget(id, { target: num });
    }
    setEditingId(null);
  };

  return (
    <AppPage
      title="Target Management"
      sub="Live sales quotas and period tracking"
      actions={
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="size-4" /> Add target
        </Button>
      }
    >
      <KpiStrip>
        <Kpi label="Total target" value={inr(totalTarget)} context="Current period" />
        <Kpi label="Achieved" value={inr(totalAchieved)} />
        <Kpi label="Reps on track" value={`${onTrackCount} / ${displayRows.length || 5}`} />
        <Kpi label="Active target quotas" value={String(displayRows.length)} />
      </KpiStrip>

      <Section
        title="Targets"
        bodyClass="p-0"
        action={
          <select
            className="h-8 rounded-md border border-border bg-surface px-2 text-[12.5px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Rep</th>
                <th className="px-2 py-2.5 font-semibold">Type</th>
                <th className="px-2 py-2.5 font-semibold">Period</th>
                <th className="px-2 py-2.5 text-right font-semibold">Target</th>
                <th className="px-2 py-2.5 text-right font-semibold">Achieved</th>
                <th className="w-[24%] px-4 py-2.5 font-semibold">Progress</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {displayRows.map((r) => {
                const p = r.target > 0 ? Math.round((r.achieved / r.target) * 100) : 0;
                const isEditing = editingId === r.id;

                return (
                  <tr key={r.id} className="group hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={r.name} />
                        <span className="font-semibold text-foreground text-[13.5px]">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-2">
                      <span className="num rounded bg-secondary px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                        {r.type}
                      </span>
                    </td>
                    <td className="num px-2 font-medium text-muted-foreground">{r.period}</td>
                    <td className="px-2 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            autoFocus
                            value={editingVal}
                            onChange={(e) => setEditingVal(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveInline(r.id)}
                            className="num w-24 rounded border border-primary bg-background px-1.5 py-0.5 text-right text-foreground focus:outline-none"
                          />
                          <button onClick={() => handleSaveInline(r.id)} className="text-primary hover:text-primary-hover">
                            <Check className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(r.id);
                            setEditingVal(String(r.target));
                          }}
                          className="num rounded px-1.5 py-0.5 text-right font-medium text-foreground hover:bg-secondary transition-colors"
                          title="Click to edit target"
                        >
                          {inr(r.target)}
                        </button>
                      )}
                    </td>
                    <td className="num px-2 text-right font-semibold text-foreground">{inr(r.achieved)}</td>
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Meter value={p} tone={p >= 100 ? "success" : "primary"} />
                        <span className="num w-10 text-right text-[12.5px] font-semibold text-foreground">{p}%</span>
                      </div>
                    </td>
                    <td className="pr-3 text-right">
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setEditingVal(String(r.target));
                        }}
                        className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Add Target Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md border-border bg-surface">
          <DialogHeader>
            <DialogTitle>Set New Target</DialogTitle>
            <DialogDescription>Assign a revenue target to a sales team member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-[13px] font-semibold text-foreground">Sales Representative *</label>
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary"
              >
                <option value="">Select a rep…</option>
                {salesReps.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-foreground">Target Type</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    const t = e.target.value as "weekly" | "monthly";
                    setTargetType(t);
                    setPeriod(getCurrentPeriod(t));
                  }}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-foreground">Period</label>
                <input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2026-10 or 2026-W41"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-foreground">Target Amount (₹) *</label>
              <input
                required
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="1500000"
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : "Save Target"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}
