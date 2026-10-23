import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Download, Phone, Mail, MessageCircle, Search, Filter, Sparkles,
  Building, User, Calendar, Lightbulb, Clock, CheckCircle2,
  ExternalLink, ArrowUpDown, ChevronRight, X, PhoneCall
} from "lucide-react";
import { AppPage } from "@/components/crm/AppPage";
import { Kpi, KpiStrip, Section, Avatar, StatusBadge } from "@/components/crm/primitives";
import { inr } from "@/lib/crm-data";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCRM } from "@/context/CRMContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export const Route = createFileRoute("/admin/interested")({
  head: () => ({
    meta: [
      { title: "Interested Clients & Vendors — NexLead CRM" },
      { name: "description", content: "High-intent client pipeline flagged by the sales team." },
      { property: "og:title", content: "Interested Clients & Vendors — NexLead CRM" },
    ],
  }),
  component: InterestedPage,
});

function InterestedPage() {
  const { leads, users, updateLead } = useCRM();
  const [search, setSearch] = useState("");
  const [selectedRep, setSelectedRep] = useState("all");
  const [selectedSort, setSelectedSort] = useState<"newest" | "oldest" | "value_high">("newest");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Filter only interested leads
  const interestedList = useMemo(() => {
    return leads.filter((l) => l.status === "interested");
  }, [leads]);

  // Extract unique sales reps who have marked interest
  const repList = useMemo(() => {
    const set = new Set<string>();
    interestedList.forEach((l) => {
      const rep = l.interestedByName || l.rep || l.assignedToName;
      if (rep) set.add(rep);
    });
    return Array.from(set).sort();
  }, [interestedList]);

  // Total Pipeline Value of interested leads
  const totalValue = useMemo(() => {
    return interestedList.reduce((acc, l) => acc + (l.value || 0), 0);
  }, [interestedList]);

  // Recent 24h count
  const recent24hCount = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return interestedList.filter((l) => {
      const t = l.interestedAt ? new Date(l.interestedAt).getTime() : 0;
      return t >= oneDayAgo;
    }).length;
  }, [interestedList]);

  // Filtered & Sorted list
  const filteredRows = useMemo(() => {
    let rows = interestedList.filter((lead) => {
      const comp = (lead.companyName || lead.company || "").toLowerCase();
      const client = (lead.contactName || lead.client || "").toLowerCase();
      const phone = (lead.phone || "").toLowerCase();
      const email = (lead.email || "").toLowerCase();
      const rep = (lead.interestedByName || lead.rep || lead.assignedToName || "").toLowerCase();

      const q = search.toLowerCase();
      const matchesSearch = !q || comp.includes(q) || client.includes(q) || phone.includes(q) || email.includes(q) || rep.includes(q);
      const matchesRep = selectedRep === "all" || (lead.interestedByName || lead.rep || lead.assignedToName) === selectedRep;

      return matchesSearch && matchesRep;
    });

    rows = [...rows].sort((a, b) => {
      if (selectedSort === "value_high") return (b.value || 0) - (a.value || 0);
      const tA = a.interestedAt ? new Date(a.interestedAt).getTime() : 0;
      const tB = b.interestedAt ? new Date(b.interestedAt).getTime() : 0;
      if (selectedSort === "oldest") return tA - tB;
      return tB - tA; // newest first
    });

    return rows;
  }, [interestedList, search, selectedRep, selectedSort]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error("No interested leads to export");
      return;
    }

    const headers = ["Company Name", "Contact Person", "Phone", "Email", "Requirement", "Expected Value", "Marked Interested By", "Interested At", "Category"];
    const rows = filteredRows.map((l) => [
      sanitizeCsvCell(l.companyName || l.company || ""),
      sanitizeCsvCell(l.contactName || l.client || ""),
      sanitizeCsvCell(l.phone || ""),
      sanitizeCsvCell(l.email || ""),
      sanitizeCsvCell(l.requirement || ""),
      l.value || 0,
      sanitizeCsvCell(l.interestedByName || l.rep || l.assignedToName || ""),
      sanitizeCsvCell(l.interestedAt ? new Date(l.interestedAt).toLocaleString() : ""),
      sanitizeCsvCell(l.category || "General"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexlead-interested-clients-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Interested clients exported to CSV");
  };

  return (
    <AppPage
      title="Interested Clients & Vendors"
      sub="High-intent leads flagged by the sales team for executive review and immediate closing"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 text-[12.5px]"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
        </div>
      }
    >
      {/* KPI Cards Strip */}
      <KpiStrip>
        <Kpi
          label="Total Interested"
          value={String(interestedList.length)}
          context="Flagged clients in pipeline"
        />
        <Kpi
          label="Pipeline Value"
          value={inr(totalValue)}
          context="Potential deal value"
        />
        <Kpi
          label="Active Sales Reps"
          value={String(repList.length)}
          context="Reps with interested leads"
        />
        <Kpi
          label="Flagged in 24h"
          value={String(recent24hCount)}
          context="Fresh high-priority leads"
        />
      </KpiStrip>

      {/* Main Table Section */}
      <Section
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            <span>Interested Pipeline ({filteredRows.length})</span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search company, client, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 sm:w-64 rounded-md border border-border bg-surface pl-8 pr-2 text-[12.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Rep Filter */}
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-[12.5px] text-foreground outline-none hover:border-border-strong focus:border-primary"
            >
              <option value="all">All Sales Reps ({repList.length})</option>
              {repList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-[12.5px] text-foreground outline-none hover:border-border-strong focus:border-primary"
            >
              <option value="newest">Newest Flagged</option>
              <option value="oldest">Oldest Flagged</option>
              <option value="value_high">Highest Value</option>
            </select>
          </div>
        }
        bodyClass="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-muted/40 text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Client & Company</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Flagged By Rep</th>
                <th className="px-4 py-3">Flagged Time</th>
                <th className="px-4 py-3 text-right">Deal Value</th>
                <th className="px-4 py-3 text-center">Stage</th>
                <th className="px-4 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Lightbulb className="size-5" />
                      </div>
                      <p className="text-[13.5px] font-medium text-foreground">
                        {search || selectedRep !== "all"
                          ? "No interested clients matching your filters"
                          : "No clients marked interested yet"}
                      </p>
                      <p className="text-[12px] text-muted-foreground max-w-sm">
                        When sales representatives click the "Interest" button on any client, they will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((lead) => {
                  const compName = lead.companyName || lead.company || "Unknown Company";
                  const contactPerson = lead.contactName || lead.client || "Primary Contact";
                  const repName = lead.interestedByName || lead.rep || lead.assignedToName || "Sales Rep";
                  const timeFormatted = lead.interestedAt
                    ? new Date(lead.interestedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently";

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setActiveLead(lead)}
                      className="group cursor-pointer hover:bg-secondary/40 transition-colors"
                    >
                      {/* Company & Client */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <Lightbulb className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {compName}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground truncate">
                              {contactPerson} {lead.designation ? `· ${lead.designation}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="space-y-0.5">
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5 text-foreground font-mono text-[12px]">
                              <span>{lead.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-muted-foreground">No phone</span>
                          )}
                          {lead.email && (
                            <div className="text-[11.5px] text-muted-foreground truncate max-w-[180px]">
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sales Rep */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <Avatar name={repName} className="size-6 text-[10px]" />
                          <div className="min-w-0">
                            <span className="font-medium text-foreground truncate block text-[12.5px]">
                              {repName}
                            </span>
                            <span className="text-[10.5px] text-muted-foreground block">
                              Sales Team
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Flagged Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                          <Clock className="size-3 text-amber-500/80" />
                          <span>{timeFormatted}</span>
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td className="px-4 py-3 text-right font-semibold num text-foreground whitespace-nowrap">
                        {lead.value ? inr(lead.value) : "—"}
                      </td>

                      {/* Stage Badge */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Lightbulb className="size-3" /> Interested
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`}
                              className="size-7 rounded-md border border-border bg-surface hover:bg-secondary text-primary flex items-center justify-center transition-colors shadow-xs"
                              title={`Call ${contactPerson} (${lead.phone})`}
                            >
                              <PhoneCall className="size-3" />
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="size-7 rounded-md border border-border bg-surface hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground flex items-center justify-center transition-colors shadow-xs"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="size-3" />
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveLead(lead)}
                            className="h-7 px-2 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
                          >
                            <span>Details</span>
                            <ChevronRight className="size-3 ml-0.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Slide-out Drawer for Lead Details & Actions */}
      <Sheet open={!!activeLead} onOpenChange={(open) => !open && setActiveLead(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-5">
          {activeLead && (
            <>
              <SheetHeader className="space-y-1 text-left border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5">
                    💡 High-Intent Lead
                  </span>
                  <span className="text-xs text-muted-foreground">ID: #{activeLead.id.slice(0, 8)}</span>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground">
                  {activeLead.companyName || activeLead.company}
                </SheetTitle>
                <p className="text-[13px] text-muted-foreground">
                  Contact: <strong className="text-foreground">{activeLead.contactName || activeLead.client}</strong>
                  {activeLead.designation ? ` (${activeLead.designation})` : ""}
                </p>
              </SheetHeader>

              {/* Lead Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div className="p-3 rounded-lg border border-border bg-surface/50 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Sales Representative
                  </span>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Avatar name={activeLead.interestedByName || activeLead.rep || activeLead.assignedToName || "Rep"} className="size-5 text-[9px]" />
                    <span>{activeLead.interestedByName || activeLead.rep || activeLead.assignedToName || "Unassigned"}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-surface/50 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Flagged On
                  </span>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span>{activeLead.interestedAt ? new Date(activeLead.interestedAt).toLocaleDateString() : "Recently"}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-surface/50 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Expected Value
                  </span>
                  <div className="font-bold text-foreground text-sm num">
                    {activeLead.value ? inr(activeLead.value) : "—"}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-surface/50 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Category
                  </span>
                  <div className="font-medium text-foreground">
                    {activeLead.category || "Standard Client"}
                  </div>
                </div>
              </div>

              {/* Requirement & Notes */}
              {activeLead.requirement && (
                <div className="p-3.5 rounded-lg border border-border bg-surface/30 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Client Requirement
                  </span>
                  <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                    {activeLead.requirement}
                  </p>
                </div>
              )}

              {/* Direct Communication Bar */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Direct Contact
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {activeLead.phone && (
                    <a
                      href={`tel:${activeLead.phone.replace(/[^0-9+]/g, "")}`}
                      className="flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <PhoneCall className="size-3.5" />
                      <span>Call {activeLead.phone}</span>
                    </a>
                  )}
                  {activeLead.phone && (
                    <a
                      href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-9 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Stage Conversion Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Quick Pipeline Action
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={async () => {
                      await updateLead(activeLead.id, { status: "won" });
                      toast.success(`Deal marked as Won for ${activeLead.companyName || activeLead.company}! 🎉`);
                      setActiveLead(null);
                    }}
                  >
                    🎉 Mark as Deal Won
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={async () => {
                      await updateLead(activeLead.id, { status: "negotiation" });
                      toast.success(`Lead moved to Negotiation stage`);
                      setActiveLead(null);
                    }}
                  >
                    Move to Negotiation
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppPage>
  );
}
