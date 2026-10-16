import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Activity, BarChart3, Bell, ChevronsUpDown, Command, FileBarChart, Gauge, LayoutDashboard,
  LogOut, Menu, Moon, Search, Sun, Target, Trophy, Users, Workflow, X, Clock, AlertTriangle,
} from "lucide-react";
import { Avatar, Wordmark, useTheme } from "./primitives";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
              className="group relative flex size-8 items-center justify-center rounded-md border border-border bg-surface/60 backdrop-blur-sm text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground hover:scale-105 active:scale-95 shadow-xs"
              aria-label="Toggle theme"
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
  const { upcomingFollowUps, overdueFollowUps, updateLead } = useCRM();
  const totalCount = upcomingFollowUps.length + overdueFollowUps.length;

  const handleClearAllOverdue = () => {
    overdueFollowUps.forEach((item) => {
      updateLead(item.lead.id, {
        followUpStatus: "completed",
        followUpCompletedAt: new Date().toISOString(),
      });
    });
  };

  return (
    <Popover>
      <PopoverTrigger className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Notifications">
        <Bell className="size-4" />
        {totalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-1.5rem)] sm:w-88 max-w-[360px] border-border bg-popover p-0 shadow-pop">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <span className="text-[13.5px] font-semibold text-foreground">Follow-ups & Alerts</span>
          {overdueFollowUps.length > 0 && (
            <button onClick={handleClearAllOverdue} className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Clear overdue
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {totalCount === 0 ? (
            <div className="py-6 text-center text-[13px] text-muted-foreground">
              No pending notifications
            </div>
          ) : (
            <>
              {upcomingFollowUps.map(({ lead, minutesRemaining }) => (
                <div key={lead.id} className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-secondary/60">
                  <Clock className="mt-0.5 size-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-foreground">
                      {lead.companyName || lead.company}
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {lead.contactName || lead.client} · {lead.phone}
                    </div>
                  </div>
                  <span className="num text-[11.5px] font-semibold text-primary shrink-0">
                    in {minutesRemaining}m
                  </span>
                </div>
              ))}
              {overdueFollowUps.map(({ lead, reason }) => (
                <div key={lead.id} className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-secondary/60 bg-destructive/5">
                  <AlertTriangle className="mt-0.5 size-3.5 text-destructive shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-foreground">
                      {lead.companyName || lead.company}
                    </div>
                    <div className="text-[12px] text-destructive font-medium truncate">
                      Overdue ({reason === "dismissed" ? "Dismissed" : "No action"})
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      updateLead(lead.id, {
                        followUpStatus: "completed",
                        followUpCompletedAt: new Date().toISOString(),
                      });
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground shrink-0 p-1"
                    title="Mark resolved"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
