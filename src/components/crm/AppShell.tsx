import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Activity, BarChart3, Bell, ChevronsUpDown, Command, FileBarChart, Gauge, LayoutDashboard,
  LogOut, Menu, Moon, Search, Sun, Target, Trophy, Users, Workflow, X, Clock, AlertTriangle,
  Volume2, Lightbulb, Play, Check, Settings, Sparkles, Phone, ExternalLink,
} from "lucide-react";
import { Avatar, Wordmark, useTheme } from "./primitives";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { soundService, SOUND_PRESETS, SoundPreset } from "@/utils/soundService";

type Item = { title: string; to: string; icon: typeof Gauge };
type Group = { label?: string; items: Item[] };

const ADMIN_NAV: Group[] = [
  { label: "Overview", items: [{ title: "Executive Overview", to: "/admin/overview", icon: LayoutDashboard }] },
  { label: "Management", items: [
    { title: "Lead Management", to: "/admin/leads", icon: Workflow },
    { title: "Team Performance", to: "/admin/team", icon: Users },
    { title: "Target Management", to: "/admin/targets", icon: Target },
  ] },
  { label: "Analytics", items: [
    { title: "Revenue Analytics", to: "/admin/revenue", icon: BarChart3 },
    { title: "Analytics Reports", to: "/admin/reports", icon: FileBarChart },
  ] },
];
const SALES_NAV: Group[] = [
  { label: "Cockpit", items: [
    { title: "My Lead Pipeline", to: "/sales/pipeline", icon: Gauge },
    { title: "Recent Activity Log", to: "/sales/activity", icon: Activity },
    { title: "Quota & Target History", to: "/sales/quota", icon: Trophy },
  ] },
];

import { useCRM } from "@/context/CRMContext";

export function AppShell({ role, children }: { role: "admin" | "sales"; children: ReactNode }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useCRM();
  const nav = role === "admin"
    ? ADMIN_NAV
    : currentUser?.role === "admin"
    ? [
        ...SALES_NAV,
        {
          label: "Admin Switch",
          items: [{ title: "Return to Admin Overview", to: "/admin/overview", icon: LayoutDashboard }],
        },
      ]
    : SALES_NAV;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  // Prevent background scrolling and support Escape key when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  const normalizedPath = (path.replace(/\/$/, "") || "/").toLowerCase();
  const isMatch = (itemTo: string) => {
    const normTo = (itemTo.replace(/\/$/, "") || "/").toLowerCase();
    if (normTo === "/admin/overview" && (normalizedPath === "/admin" || normalizedPath === "/admin/overview")) return true;
    if (normTo === "/sales/pipeline" && (normalizedPath === "/sales" || normalizedPath === "/sales/pipeline")) return true;
    return normalizedPath === normTo;
  };

  const current = nav.flatMap((g) => g.items).find((i) => isMatch(i.to));
  const user = currentUser
    ? { name: currentUser.name, role: currentUser.role === "admin" ? "Administrator" : "Sales Representative" }
    : role === "admin"
    ? { name: "Aditi Rao", role: "Administrator" }
    : { name: "Priya Nair", role: "Sales Representative" };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Wordmark />
        <button
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground lg:hidden transition-colors"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {nav.map((g) => (
          <div key={g.label}>
            {g.label && <div className="eyebrow px-2 pb-1.5">{g.label}</div>}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = isMatch(it.to);
                return (
                  <li key={it.to}>
                    <Link to={it.to} onClick={() => setOpen(false)}
                      className={cn("group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium transition-colors",
                        active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground")}>
                      {active && <span className="absolute -left-2.5 top-1.5 bottom-1.5 w-[2.5px] rounded-r bg-primary" />}
                      <it.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{it.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-2.5">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-sidebar-accent/60">
          <Avatar name={user.name} className="size-7" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13.5px] font-semibold text-foreground">{user.name}</div>
            <div className="truncate text-[12px] font-medium text-muted-foreground">{user.role}</div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle Ambient Business Doodle Watermark behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 dashboard-doodle-bg"
      />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 ease-[var(--ease-out)] lg:hidden", open ? "translate-x-0" : "-translate-x-full")}>{sidebar}</aside>

      <div className="relative z-10 lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2.5 sm:gap-3 border-b border-border bg-background/85 px-3.5 sm:px-4 backdrop-blur-md lg:px-6">
          <button
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden transition-colors shrink-0"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 text-[13.5px]">
            <span className="hidden font-medium text-muted-foreground sm:inline">{role === "admin" ? "Management" : "Sales"}</span>
            <span className="hidden font-semibold text-border-strong sm:inline">/</span>
            <span className="truncate font-semibold text-foreground text-[13.5px] sm:text-[14px]">
              {current?.title || (role === "admin" ? "Executive Overview" : "My Lead Pipeline")}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <label className="hidden h-8 w-64 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-[13px] text-muted-foreground transition-colors focus-within:border-primary md:flex">
              <Search className="size-3.5 text-muted-foreground" />
              <input placeholder="Search leads, companies…" className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
              <kbd className="flex items-center gap-0.5 rounded border border-border px-1 text-[10px] text-muted-foreground font-medium"><Command className="size-2.5" />K</kbd>
            </label>
            <NotificationBell />
            <button
              onClick={(e) => toggle(e)}
              aria-label="Toggle theme"
              suppressHydrationWarning
              className="group relative flex size-8 items-center justify-center rounded-md border border-border bg-surface/60 backdrop-blur-sm text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground hover:scale-105 active:scale-95 shadow-xs"
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              <span className="transition-transform duration-500 ease-out group-hover:rotate-45">
                {theme === "dark" ? (
                  <Sun className="size-4 text-amber-400 transition-transform duration-300" />
                ) : (
                  <Moon className="size-4 text-sky-400 transition-transform duration-300 -rotate-12" />
                )}
              </span>
            </button>
            {currentUser?.role === "admin" && role === "sales" && (
              <Link
                to="/admin/overview"
                className="flex h-8 items-center gap-1 sm:gap-1.5 rounded-md border border-border px-2 sm:px-2.5 text-[11.5px] sm:text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Switch to Admin Overview"
              >
                <span className="hidden sm:inline">Admin overview</span>
                <span className="sm:hidden font-semibold">Admin</span>
                <ChevronsUpDown className="size-3" />
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1480px] space-y-5 p-3.5 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { upcomingFollowUps, overdueFollowUps, interestedLeads, updateLead, currentUser } = useCRM();
  const isAdmin = currentUser?.role === "admin";
  const interestList = isAdmin ? interestedLeads : [];
  const totalCount = upcomingFollowUps.length + overdueFollowUps.length + interestList.length;

  const [activeTab, setActiveTab] = useState<"all" | "interested" | "followups" | "sounds">("all");
  const [showAllItems, setShowAllItems] = useState(false);
  const [selectedSound, setSelectedSound] = useState(() => soundService.getSelectedPresetId());
  const [playingPresetId, setPlayingPresetId] = useState<string | null>(null);

  const handleSelectSound = (presetId: string, presetName: string, icon: string) => {
    soundService.setSelectedPresetId(presetId);
    setSelectedSound(presetId);
    soundService.playPreset(presetId);
    setPlayingPresetId(presetId);
    setTimeout(() => setPlayingPresetId(null), 1200);
    toast.success(`Active tone set: ${icon} ${presetName}`, {
      description: "Incoming 'Interested' leads will now play this sound alert.",
      duration: 3500,
    });
  };

  const handlePreviewSound = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    soundService.playPreset(presetId);
    setPlayingPresetId(presetId);
    setTimeout(() => setPlayingPresetId(null), 1200);
  };

  const handleClearAllOverdue = () => {
    overdueFollowUps.forEach((item) => {
      updateLead(item.lead.id, {
        followUpStatus: "completed",
        followUpCompletedAt: new Date().toISOString(),
      });
    });
    toast.success("All overdue follow-ups cleared");
  };

  // Compile unified list of notifications
  const allNotifications = [
    ...interestList.map((lead) => ({
      type: "interested" as const,
      id: `interest-${lead.id}`,
      lead,
      title: lead.companyName || lead.company || "Unknown Company",
      subtitle: `${lead.contactName || lead.client || "Client"} · ${lead.phone || "No phone"}`,
      rep: lead.interestedByName || lead.rep || lead.assignedToName || "Sales Rep",
      time: lead.interestedAt
        ? new Date(lead.interestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Recent",
      rawTime: lead.interestedAt ? new Date(lead.interestedAt).getTime() : 0,
    })),
    ...upcomingFollowUps.map(({ lead, minutesRemaining }) => ({
      type: "upcoming" as const,
      id: `upcoming-${lead.id}`,
      lead,
      title: lead.companyName || lead.company || "Unknown Company",
      subtitle: `${lead.contactName || lead.client || "Client"} · ${lead.phone || "No phone"}`,
      rep: lead.rep || lead.assignedToName || "Assigned Rep",
      time: `in ${minutesRemaining}m`,
      rawTime: lead.nextFollowUp ? new Date(lead.nextFollowUp).getTime() : Date.now(),
    })),
    ...overdueFollowUps.map(({ lead, reason }) => ({
      type: "overdue" as const,
      id: `overdue-${lead.id}`,
      lead,
      title: lead.companyName || lead.company || "Unknown Company",
      subtitle: `Overdue (${reason === "dismissed" ? "Dismissed" : "No action"})`,
      rep: lead.rep || lead.assignedToName || "Assigned Rep",
      time: "Overdue",
      rawTime: 0,
    })),
  ];

  // Filter based on active tab
  const filteredNotifications = allNotifications.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "interested") return item.type === "interested";
    if (activeTab === "followups") return item.type === "upcoming" || item.type === "overdue";
    return true;
  });

  // Limit display to 5-6 notifications unless user clicks "Show all"
  const DISPLAY_LIMIT = 6;
  const visibleNotifications = showAllItems
    ? filteredNotifications
    : filteredNotifications.slice(0, DISPLAY_LIMIT);

  return (
    <Popover>
      <PopoverTrigger
        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {totalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[calc(100vw-1.5rem)] sm:w-[420px] max-w-[420px] border-border bg-popover p-0 shadow-2xl rounded-xl overflow-hidden"
      >
        {/* Header with Notification Title and Quick Sound Preview */}
        <div className="flex items-center justify-between border-b border-border bg-surface/50 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold text-foreground">Notifications</span>
            {totalCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {totalCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundService.playPreset(selectedSound);
                toast.info(`Playing active sound: ${SOUND_PRESETS.find((p) => p.id === selectedSound)?.name || "Chime"} 🔔`);
              }}
              type="button"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/60 hover:bg-secondary"
              title="Test current alert sound"
            >
              <Volume2 className="size-3.5 text-primary" />
              <span>Test sound</span>
            </button>
            {overdueFollowUps.length > 0 && (
              <button
                onClick={handleClearAllOverdue}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-secondary"
              >
                Clear overdue
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-border bg-muted/20 px-2 py-1.5 text-[12px] font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shrink-0",
              activeTab === "all"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            All
            <span className="text-[10px] opacity-70">({allNotifications.length})</span>
          </button>
          {interestList.length > 0 && (
            <button
              onClick={() => setActiveTab("interested")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shrink-0",
                activeTab === "interested"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Lightbulb className="size-3 text-amber-500" />
              Interested
              <span className="text-[10px] font-bold">({interestList.length})</span>
            </button>
          )}
          {(upcomingFollowUps.length > 0 || overdueFollowUps.length > 0) && (
            <button
              onClick={() => setActiveTab("followups")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shrink-0",
                activeTab === "followups"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Clock className="size-3 text-primary" />
              Follow-ups
              <span className="text-[10px] opacity-70">
                ({upcomingFollowUps.length + overdueFollowUps.length})
              </span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("sounds")}
            className={cn(
              "ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shrink-0",
              activeTab === "sounds"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-primary hover:bg-primary/10"
            )}
            title="Choose from 6 notification sounds"
          >
            <Settings className="size-3" />
            <span>Sound Options (6)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
          {/* TAB 1: Sound Settings / 6 Sound Options */}
          {activeTab === "sounds" ? (
            <div className="p-3 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <div>
                  <div className="text-[12.5px] font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Select Alert Sound (6 Options)
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Choose the alert chime played when sales marks client interest
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {SOUND_PRESETS.map((preset) => {
                  const isSelected = selectedSound === preset.id;
                  const isPlaying = playingPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectSound(preset.id, preset.name, preset.icon)}
                      className={cn(
                        "group flex items-center justify-between gap-2.5 p-2 rounded-lg border transition-all cursor-pointer text-left",
                        isSelected
                          ? "border-primary/50 bg-primary/5 shadow-xs"
                          : "border-border/60 hover:border-border hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg select-none shrink-0">{preset.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12.5px] font-semibold text-foreground truncate">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.2">
                                <Check className="size-2.5" /> Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handlePreviewSound(e, preset.id)}
                          className={cn(
                            "flex size-7 items-center justify-center rounded-md border text-xs transition-transform active:scale-90",
                            isPlaying
                              ? "bg-primary text-primary-foreground border-primary scale-105"
                              : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-secondary"
                          )}
                          title={`Preview ${preset.name}`}
                          aria-label={`Preview ${preset.name}`}
                        >
                          <Play className={cn("size-3", isPlaying && "animate-spin")} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center text-[11px] text-muted-foreground border-t border-border/40">
                🔊 Audio works 100% in browser and saves your choice automatically.
              </div>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-muted-foreground">
              No pending notifications
            </div>
          ) : (
            <>
              {/* Notification Items List */}
              {visibleNotifications.map((item) => {
                const lead = item.lead;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-2.5 px-3.5 py-2.5 transition-colors",
                      item.type === "interested"
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : item.type === "overdue"
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : "hover:bg-secondary/60"
                    )}
                  >
                    {/* Status Icon */}
                    <div
                      className={cn(
                        "mt-0.5 size-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                        item.type === "interested"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : item.type === "overdue"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {item.type === "interested" ? (
                        <Lightbulb className="size-3.5" />
                      ) : item.type === "overdue" ? (
                        <AlertTriangle className="size-3.5" />
                      ) : (
                        <Clock className="size-3.5" />
                      )}
                    </div>

                    {/* Notification Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="num text-[10.5px] text-muted-foreground shrink-0 font-medium">
                          {item.time}
                        </span>
                      </div>
                      <div className="text-[12px] text-muted-foreground truncate">
                        {item.subtitle}
                      </div>

                      {item.type === "interested" && (
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                            Marked Interested by <strong className="font-semibold">{item.rep}</strong>
                          </span>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium shrink-0"
                            >
                              <Phone className="size-2.5" /> Call
                            </a>
                          )}
                        </div>
                      )}

                      {item.type === "overdue" && (
                        <div className="mt-1 flex items-center justify-end">
                          <button
                            onClick={() => {
                              updateLead(lead.id, {
                                followUpStatus: "completed",
                                followUpCompletedAt: new Date().toISOString(),
                              });
                              toast.success("Follow-up marked resolved");
                            }}
                            className="text-[10.5px] font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-secondary/80 hover:bg-secondary transition-colors"
                          >
                            Mark resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer / Pagination Controls if more than 5-6 notifications */}
        {activeTab !== "sounds" && filteredNotifications.length > DISPLAY_LIMIT && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-3.5 py-2 text-[11.5px]">
            <span className="text-muted-foreground">
              Showing {visibleNotifications.length} of {filteredNotifications.length} notifications
            </span>
            <button
              onClick={() => setShowAllItems(!showAllItems)}
              className="font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              {showAllItems ? "Show top 6 only" : `View all (${filteredNotifications.length})`}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

