import { useEffect, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { STATUS_META, type LeadStatus, type Priority } from "@/lib/crm-data";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <span className={cn("relative inline-flex items-center justify-center overflow-hidden rounded-md bg-background ring-1 ring-border shadow-xs", className)}>
      {!hasError ? (
        <img
          src="/favicon.png"
          alt="SYNTRAXS"
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <svg viewBox="0 0 32 32" fill="none" className="h-3/4 w-3/4 text-primary" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 8L16 3L25 8V24L16 29L7 24V8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M12 12L20 20M20 12L12 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="size-8" />
      {!compact && (
        <div className="leading-none">
          <div className="text-[13.5px] font-bold tracking-[0.14em] text-foreground">SYNTRA<span className="text-primary">X</span>S</div>
          <div className="mt-1 text-[9.5px] font-semibold tracking-[0.3em] text-muted-foreground">TECHNOLOGIES</div>
        </div>
      )}
    </div>
  );
}

const toneClass: Record<string, string> = {
  info: "text-info bg-info/10 ring-info/30",
  violet: "text-violet bg-violet/10 ring-violet/30",
  primary: "text-primary bg-primary/10 ring-primary/30",
  success: "text-success bg-success/10 ring-success/30",
  warning: "text-warning bg-warning/10 ring-warning/30",
  destructive: "text-destructive bg-destructive/10 ring-destructive/30",
  subtle: "text-muted-foreground bg-muted ring-border",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset", toneClass[m.tone])}>
      <span className="size-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

export function PriorityMark({ p }: { p: Priority }) {
  const bars = p === "high" ? 3 : p === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] capitalize font-medium text-foreground">
      <span className="flex items-end gap-[2px]">
        {[1, 2, 3].map((b) => (
          <span
            key={b}
            className={cn("w-[3px] rounded-sm", b <= bars ? (p === "high" ? "bg-destructive" : "bg-primary") : "bg-border-strong")}
            style={{ height: 4 + b * 3 }}
          />
        ))}
      </span>
      {p}
    </span>
  );
}

export function Delta({ v }: { v: number }) {
  const up = v >= 0;
  return (
    <span className={cn("num inline-flex items-center gap-0.5 text-[12px] font-semibold", up ? "text-success" : "text-destructive")}>
      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

/** A KPI cell meant to live inside a shared strip, not a standalone card. */
export function Kpi({ label, value, delta, context, children }: { label: string; value: ReactNode; delta?: number; context?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="eyebrow">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="num text-[26px] sm:text-[28px] font-semibold leading-none text-foreground">{value}</span>
        {delta !== undefined && <Delta v={delta} />}
      </div>
      {context && <div className="text-[12.5px] sm:text-[13px] text-muted-foreground font-normal leading-tight">{context}</div>}
      {children}
    </div>
  );
}

export function KpiStrip({ children, cols = 4 }: { children: ReactNode; cols?: number }) {
  return (
    <div className={cn("panel grid grid-cols-2 divide-border overflow-hidden max-lg:[&>*:nth-child(n+3)]:border-t lg:divide-x", cols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4", "max-lg:[&>*:nth-child(even)]:border-l")}>
      {children}
    </div>
  );
}

export function Section({ title, sub, action, children, className, bodyClass }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-foreground tracking-tight">{title}</h2>
          {sub && <p className="mt-0.5 text-[13px] text-muted-foreground leading-normal">{sub}</p>}
        </div>
        {action}
      </header>
      <div className={cn("flex-1", bodyClass ?? "p-4")}>{children}</div>
    </section>
  );
}

export function Meter({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const bg = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", destructive: "bg-destructive" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full animate-grow-x", bg)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const init = name.split(" ").map((s) => s[0]).join("").slice(0, 2);
  return <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10.5px] font-semibold text-foreground ring-1 ring-border", className)}>{init}</span>;
}

export { useTheme, ThemeProvider } from "@/context/ThemeContext";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-foreground leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-[13.5px] sm:text-[14px] text-muted-foreground leading-relaxed">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
