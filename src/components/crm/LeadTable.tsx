import { useMemo, useState, useEffect } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Mail, MoreHorizontal, Phone, Search, X, PhoneCall, MessageCircle, CalendarClock, StickyNote } from "lucide-react";
import { LEAD_STATUSES, REPS, STATUS_META, inr, type Lead } from "@/lib/crm-data";
import { Avatar, PriorityMark, StatusBadge } from "./primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCRM } from "@/context/CRMContext";
import { toast } from "sonner";

const selectCls = "h-8 rounded-md border border-border bg-surface px-2 text-[12.5px] text-foreground outline-none hover:border-border-strong focus:border-primary";

export function LeadTable({ leads, admin }: { leads: Lead[]; admin?: boolean }) {
  const { users, updateLead, markLeadAsInterested, activities, addActivity, currentUser } = useCRM();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [rep, setRep] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [sortVal, setSortVal] = useState<null | "asc" | "desc">(null);
  const [open, setOpen] = useState<Lead | null>(null);
  const [bulkRep, setBulkRep] = useState("");
  const PAGE = 10;

  const salesReps = useMemo(() => {
    const list = users.filter((u) => u.role === "sales").map((u) => u.name);
    return list.length > 0 ? list : REPS;
  }, [users]);

  const rows = useMemo(() => {
    let r = leads.filter((l) => {
      const comp = l.company || l.companyName || "";
      const cl = l.client || l.contactName || "";
      const em = l.email || "";
      const req = l.requirement || "";
      const rRep = l.rep || l.assignedToName || "";

      return (
        (!q || `${comp} ${cl} ${em} ${req}`.toLowerCase().includes(q.toLowerCase())) &&
        (!status || l.status === status) &&
        (!priority || l.priority === priority) &&
        (!rep || (rep === "__none" ? !rRep : rRep === rep))
      );
    });
    if (sortVal) r = [...r].sort((a, b) => (sortVal === "asc" ? a.value - b.value : b.value - a.value));
    return r;
  }, [leads, q, status, priority, rep, sortVal]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const filtered = q || status || priority || rep;
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPage = view.length > 0 && view.every((l) => sel.has(l.id));

  const handleBulkAssign = async () => {
    if (!bulkRep || sel.size === 0) return;
    const targetUser = users.find((u) => u.name === bulkRep);
    let count = 0;
    for (const id of sel) {
      await updateLead(id, {
        assignedTo: targetUser?.id,
        assignedToName: bulkRep,
        rep: bulkRep,
      });
      count++;
    }
    toast.success(`Assigned ${count} leads to ${bulkRep}`);
    setSel(new Set());
    setBulkRep("");
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5 sm:p-3">
        <label className="flex h-8 w-full sm:w-auto sm:min-w-[220px] sm:max-w-xs flex-1 items-center gap-2 rounded-md border border-border bg-background px-2.5 focus-within:border-primary">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search company, client, email" className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
        </label>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1 sm:flex-initial">
          <select className={cn(selectCls, "flex-1 sm:flex-initial min-w-[110px]")} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <select className={cn(selectCls, "flex-1 sm:flex-initial min-w-[95px]")} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(0); }}>
            <option value="">Any priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          {admin && (
            <select className={cn(selectCls, "flex-1 sm:flex-initial min-w-[95px]")} value={rep} onChange={(e) => { setRep(e.target.value); setPage(0); }}>
              <option value="">All reps</option><option value="__none">Unassigned</option>
              {salesReps.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          {filtered && <button onClick={() => { setQ(""); setStatus(""); setPriority(""); setRep(""); }} className="flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-muted-foreground hover:text-foreground"><X className="size-3.5" />Clear</button>}
          <div className="num ml-auto text-[12px] sm:text-[12.5px] font-medium text-muted-foreground whitespace-nowrap">{rows.length} leads</div>
        </div>
      </div>

      {admin && sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-border bg-primary/8 px-3 py-2 text-[12.5px] animate-rise">
          <span className="num font-semibold text-foreground">{sel.size} selected</span>
          <select className={cn(selectCls, "min-w-[120px]")} value={bulkRep} onChange={(e) => setBulkRep(e.target.value)}>
            <option value="" disabled>Assign to…</option>
            {salesReps.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <Button size="sm" onClick={handleBulkAssign} disabled={!bulkRep}>Apply assignment</Button>
          <button onClick={() => setSel(new Set())} className="ml-auto text-[12px] font-medium text-muted-foreground hover:text-foreground">Deselect</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-[13px]">
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
            <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allOnPage} onChange={() => setSel((s) => { const n = new Set(s); view.forEach((l) => (allOnPage ? n.delete(l.id) : n.add(l.id))); return n; })} className="accent-primary" aria-label="Select page" /></th>
              <th className="w-12 px-2 py-2.5">#</th>
              <th className="px-2 py-2.5">Company</th>
              <th className="px-2 py-2.5">Client</th>
              <th className="px-2 py-2.5">Contact</th>
              <th className="px-2 py-2.5">Category</th>
              <th className="px-2 py-2.5 text-right"><button onClick={() => setSortVal((s) => (s === "desc" ? "asc" : "desc"))} className="inline-flex items-center gap-1 uppercase hover:text-foreground">Value <ArrowUpDown className="size-3" /></button></th>
              <th className="px-2 py-2.5">Date</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-2 py-2.5">Priority</th>
              {admin && <th className="px-2 py-2.5">Rep</th>}
              <th className="px-2 py-2.5 text-center">Interest</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y border-border">
            {view.map((l, i) => {
              const comp = l.company || l.companyName;
              const cl = l.client || l.contactName;
              const repName = l.rep || l.assignedToName;
              const dStr = l.date || (l.createdAt ? l.createdAt.split("T")[0] : "");
              const snoVal = l.sno ?? (page * PAGE + i + 1);

              return (
                <tr key={l.id} onClick={() => setOpen(l)} className={cn("cursor-pointer transition-colors hover:bg-secondary/50", sel.has(l.id) && "bg-primary/5")}>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(l.id)} onChange={() => toggle(l.id)} className="accent-primary" aria-label={`Select ${comp}`} /></td>
                  <td className="num px-2 text-[12.5px] font-medium text-muted-foreground">{String(snoVal).padStart(2, "0")}</td>
                  <td className="px-2"><div className="font-semibold text-foreground text-[13.5px]">{comp}</div><div className="text-[12.5px] text-muted-foreground">{l.requirement || "No requirement stated"}</div></td>
                  <td className="px-2"><div className="font-medium text-foreground text-[13px]">{cl}</div><div className="text-[12px] text-muted-foreground">{l.designation || "Contact"}</div></td>
                  <td className="px-2"><div className="num text-[12.5px] font-medium text-foreground">{l.phone || "-"}</div><div className="truncate text-[12px] text-muted-foreground">{l.email || "-"}</div></td>
                  <td className="px-2 text-[12.5px] text-muted-foreground">{l.category || "General"}</td>
                  <td className="num px-2 text-right font-semibold text-foreground text-[13.5px]">{inr(l.value || 0)}</td>
                  <td className="num px-2 text-[12.5px] font-medium text-muted-foreground">{dStr}</td>
                  <td className="px-2"><StatusBadge status={l.status || "new"} /></td>
                  <td className="px-2"><PriorityMark p={l.priority || "medium"} /></td>
                  {admin && <td className="px-2">{repName ? <span className="flex items-center gap-2 whitespace-nowrap text-[13px] font-medium text-foreground"><Avatar name={repName} />{repName.split(" ")[0]}</span> : <span className="text-[12px] italic text-muted-foreground">Unassigned</span>}</td>}
                  <td className="px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {l.status === 'interested' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap" title={l.interestedByName ? `Marked by ${l.interestedByName}` : 'Interested'}>
                        💡 Interested ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markLeadAsInterested(l.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 text-[11.5px] font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap"
                        title={`Mark ${comp} as Interested (triggers Admin notification with sound)`}
                      >
                        💡 Interest
                      </button>
                    )}
                  </td>
                  <td className="px-2"><MoreHorizontal className="size-4 text-muted-foreground hover:text-foreground" /></td>
                </tr>
              );
            })}
            {view.length === 0 && (
              <tr>
                <td colSpan={13} className="py-16 text-center">
                  <div className="sticky left-0 right-0 max-w-sm mx-auto px-4">
                    <div className="text-[14px] font-semibold text-foreground">No leads match these filters</div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">Try clearing a filter or searching another company.</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2.5 text-[12.5px] font-medium text-muted-foreground">
        <span className="num">{rows.length ? page * PAGE + 1 : 0}–{Math.min(rows.length, (page + 1) * PAGE)} of {rows.length}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft /></Button>
          <span className="num px-2 text-foreground font-semibold">{page + 1} / {pages}</span>
          <Button variant="ghost" size="icon" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight /></Button>
        </div>
      </div>

      <LeadDrawer lead={open} onClose={() => setOpen(null)} onSave={() => setOpen(null)} />
    </div>
  );
}

function LeadDrawer({ lead, onClose, onSave }: { lead: Lead | null; onClose: () => void; onSave?: () => void }) {
  const { updateLead, markLeadAsInterested, addActivity, activities, currentUser } = useCRM();
  const [status, setStatus] = useState<any>(lead?.status || "new");
  const [priority, setPriority] = useState<any>(lead?.priority || "medium");
  const [followUp, setFollowUp] = useState(lead?.nextFollowUp || "");
  const [val, setVal] = useState<number | string>(lead?.value || 0);
  const [notes, setNotes] = useState(lead?.notes || "");
  const [saving, setSaving] = useState(false);

  // Sync state when opened lead changes
  useEffect(() => {
    if (lead) {
      setStatus(lead.status || "new");
      setPriority(lead.priority || "medium");
      setFollowUp(lead.nextFollowUp || "");
      setVal(lead.value || 0);
      setNotes(lead.notes || "");
    }
  }, [lead]);

  const leadActs = useMemo(() => {
    if (!lead) return [];
    return activities.filter((a) => a.leadId === lead.id);
  }, [lead, activities]);

  const handleQuickActivity = async (type: "call" | "email" | "whatsapp" | "meeting") => {
    if (!lead) return;
    await addActivity({
      leadId: lead.id,
      userId: currentUser?.id || "admin",
      userName: currentUser?.name || "User",
      companyName: lead.companyName || lead.company,
      type,
      description: `${type.toUpperCase()} recorded with ${lead.contactName || lead.client} (${lead.companyName || lead.company})`,
      what: `${type.toUpperCase()} completed`,
      meta: lead.phone || lead.email,
    });
    toast.success(`${type.toUpperCase()} recorded`);
  };

  const handleSaveChanges = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const updates: any = {
        status,
        priority,
        nextFollowUp: followUp || undefined,
        value: Number(val) || 0,
        notes,
      };
      if (status === "interested" && lead.status !== "interested") {
        updates.interestedAt = new Date().toISOString();
        updates.interestedBy = currentUser?.id || "sales";
        updates.interestedByName = currentUser?.name || "Sales Rep";
      }
      await updateLead(lead.id, updates);
      toast.success("Lead details updated");
      onSave?.();
    } catch {
      toast.error("Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-border bg-surface p-0 sm:max-w-[520px]">
        {lead && (
          <>
            <SheetHeader className="border-b border-border p-5 text-left">
              <div className="num text-[12px] font-medium text-muted-foreground">{lead.id}</div>
              <SheetTitle className="text-[20px] font-bold text-foreground tracking-tight">{lead.company || lead.companyName}</SheetTitle>
              <div className="flex items-center gap-2 pt-1"><StatusBadge status={status} /><PriorityMark p={priority} /></div>
            </SheetHeader>
            <div className="grid grid-cols-4 border-b border-border">
              {([
                { i: PhoneCall, t: "Call", k: "call" },
                { i: Mail, t: "Email", k: "email" },
                { i: MessageCircle, t: "WhatsApp", k: "whatsapp" },
                { i: CalendarClock, t: "Meeting", k: "meeting" },
              ] as const).map(({ i: I, t, k }) => (
                <button
                  key={t}
                  onClick={() => handleQuickActivity(k)}
                  className="flex flex-col items-center gap-1 border-r border-border py-3 text-[12px] font-medium text-muted-foreground last:border-r-0 hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <I className="size-4" />
                  {t}
                </button>
              ))}
            </div>
            {status === "interested" ? (
              <div className="flex items-center justify-between border-b border-border bg-emerald-500/10 px-4 py-2.5 text-[12.5px] text-emerald-800 dark:text-emerald-200">
                <span className="font-semibold flex items-center gap-1.5">
                  💡 Client Marked as Interested
                </span>
                <span className="text-[11.5px] opacity-80">
                  {lead.interestedByName ? `Marked by ${lead.interestedByName}` : "Admin notified with sound"}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-border bg-amber-500/10 px-4 py-2.5">
                <div>
                  <div className="text-[12.5px] font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    💡 Client Interested?
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300">
                    Hits the interest button to notify Admin immediately with sound
                  </div>
                </div>
                <Button
                  size="sm"
                  type="button"
                  onClick={async () => {
                    await markLeadAsInterested(lead.id);
                    setStatus("interested");
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] h-7 px-3 shrink-0 shadow-sm"
                >
                  💡 Hit Interest
                </Button>
              </div>
            )}
            <div className="space-y-5 p-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                {[
                  ["Client", `${lead.client || lead.contactName} · ${lead.designation || "Contact"}`],
                  ["Requirement", lead.requirement || "General Inquiry"],
                  ["Expected value", inr(Number(val) || 0)],
                  ["Category", lead.category || "General"],
                  ["Assigned rep", lead.rep || lead.assignedToName || "Unassigned"],
                  ["Created", lead.date || lead.createdAt?.split("T")[0] || ""],
                ].map(([k, v]) => (
                  <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-1 text-[13.5px] font-medium text-foreground">{v}</dd></div>
                ))}
              </dl>
              <div className="flex flex-col gap-1.5 text-[13px] text-foreground font-medium">
                <span className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /><span className="num">{lead.phone || "No phone"}</span></span>
                <span className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" />{lead.email || "No email"}</span>
              </div>
              <div className="space-y-3 rounded-md border border-border bg-background p-3.5 sm:p-4">
                <div className="eyebrow">Update lead</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                  <select className={selectCls} value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                    <option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
                  </select>
                  <input
                    type="datetime-local"
                    className={cn(selectCls, "w-full")}
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    aria-label="Next follow-up"
                  />
                  <input
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className={cn(selectCls, "num w-full")}
                    placeholder="Expected value"
                    aria-label="Expected value"
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes…"
                  rows={3}
                  className="w-full resize-none rounded-md border border-border bg-surface p-2 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                />
                <Button className="w-full" onClick={handleSaveChanges} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
              <div>
                <div className="eyebrow mb-3">Activity Timeline</div>
                {leadActs.length > 0 ? (
                  <ol className="relative space-y-4 border-l border-border pl-4">
                    {leadActs.map((a, idx) => (
                      <li key={a.id || idx} className="relative">
                        <span className="absolute -left-[23px] flex size-3.5 items-center justify-center rounded-full bg-surface ring-1 ring-border-strong">
                          <span className="size-1.5 rounded-full bg-primary" />
                        </span>
                        <div className="text-[13.5px] font-medium text-foreground">{a.what || a.description}</div>
                        <div className="num text-[12px] text-muted-foreground">{a.who} · {a.t || new Date(a.timestamp).toLocaleString()}</div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-[13px] text-muted-foreground italic py-2">
                    No logged activities yet. Click Call, Email, WhatsApp, or Meeting above to log.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
