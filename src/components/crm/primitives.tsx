import { useEffect, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { STATUS_META, type LeadStatus, type Priority } from "@/lib/crm-data";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export function BrandMark({ className }: { className?: string }) {
  const [hasError, setHasError] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-md transition-all duration-300 ease-in-out",
        className
      )}
    >
      {!hasError ? (
        <img
          src={isLight ? "/nexlead-mark.png" : "/nexlead-mark-dark.png"}
          alt="NexLead"
          className="h-full w-full object-contain filter drop-shadow-[0_2px_6px_rgba(37,99,235,0.25)]"
          onError={() => setHasError(true)}
        />
      ) : (
        <svg viewBox="0 0 32 32" fill="none" className="h-3/4 w-3/4 text-primary" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 26V6L18 20V6H26V26L14 12V26H6Z" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

export function Wordmark({
  compact,
  className,
  imageClassName,
  size = "md",
}: {
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [imgError, setImgError] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  if (compact) {
    return <BrandMark className={cn("size-9", className)} />;
  }

  const heightClass = {
    sm: "h-6.5 max-h-[26px]",
    md: "h-8.5 sm:h-9 max-h-[36px]",
    lg: "h-10.5 sm:h-11.5 max-h-[46px]",
    xl: "h-13 sm:h-14 lg:h-15 max-h-[60px]",
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center select-none transition-all duration-300 ease-in-out group",
        className
      )}
    >
      {!imgError ? (
        <img
          src={isLight ? "/nexlead-wordmark.png" : "/nexlead-wordmark-dark.png"}
          alt="NexLead CRM"
          className={cn(
            "w-auto object-contain transition-all duration-300 filter drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]",
            heightClass,
            imageClassName
          )}
          onError={() => setImgError(true)}
        />
      ) : (
        /* High-fidelity CSS/SVG Fallback matching the exact Typography and Letter Styling */
        <div className="flex items-center gap-2.5">
          <BrandMark className={size === "xl" ? "size-9" : size === "lg" ? "size-8" : "size-7"} />
          <div className="h-5 w-px bg-slate-700/80" />
          <div className="leading-none">
            <div className={cn("flex items-center font-black tracking-[-0.02em]", size === "xl" ? "text-[18px]" : size === "lg" ? "text-[16px]" : "text-[14.5px]")}>
              <span className={isLight ? "text-slate-900" : "text-white"}>Nex</span>
              <span className="text-[#3078FB]">Lead</span>
            </div>
            <div className="mt-0.5 text-[8.5px] font-bold text-muted-foreground tracking-[0.2em] uppercase">
              CRM
            </div>
          </div>
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

export function StatusBadge({ status }: { status?: string | null }) {
  const clean = (status || "new").toLowerCase().trim().replace(/[\s-]/g, "_");
  const metaLookup = STATUS_META as Record<string, { label: string; tone: string }>;
  const m = metaLookup[clean] || metaLookup[status || ""] || {
    label: status ? String(status).charAt(0).toUpperCase() + String(status).slice(1).replace(/_/g, " ") : "New",
    tone: "info",
  };
  const tone = toneClass[m.tone] || toneClass.info;

  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset", tone)}>
      <span className="size-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

export function PriorityMark({ p }: { p?: string | null }) {
  const clean = (p || "medium").toLowerCase().trim();
  const bars = clean === "high" ? 3 : clean === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] capitalize font-medium text-foreground">
      <span className="flex items-end gap-[2px]">
        {[1, 2, 3].map((b) => (
          <span
            key={b}
            className={cn("w-[3px] rounded-sm", b <= bars ? (clean === "high" ? "bg-destructive" : "bg-primary") : "bg-border-strong")}
            style={{ height: 4 + b * 3 }}
          />
        ))}
      </span>
      {clean}
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
    <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 min-w-0">
      <div className="eyebrow truncate">{label}</div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="num text-[22px] sm:text-[26px] lg:text-[28px] font-semibold leading-none text-foreground truncate">{value}</span>
        {delta !== undefined && <Delta v={delta} />}
      </div>
      {context && <div className="text-[12px] sm:text-[13px] text-muted-foreground font-normal leading-tight line-clamp-2">{context}</div>}
      {children}
    </div>
  );
}

export function KpiStrip({ children, cols = 4 }: { children: ReactNode; cols?: number }) {
  return (
    <div className={cn(
      "panel grid grid-cols-2 divide-border overflow-hidden max-lg:[&>*:nth-child(n+3)]:border-t lg:divide-x max-lg:[&>*:last-child:nth-child(odd)]:col-span-2",
      cols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
      "max-lg:[&>*:nth-child(even)]:border-l"
    )}>
      {children}
    </div>
  );
}

export function Section({ title, sub, action, children, className, bodyClass }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("panel flex flex-col min-w-0", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-border px-3.5 sm:px-4 py-2.5 sm:py-3">
        <div className="min-w-0">
          <h2 className="text-[14.5px] sm:text-[16px] font-semibold text-foreground tracking-tight truncate">{title}</h2>
          {sub && <p className="mt-0.5 text-[12.5px] sm:text-[13px] text-muted-foreground leading-normal">{sub}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("flex-1 min-w-0", bodyClass ?? "p-3.5 sm:p-4")}>{children}</div>
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
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] sm:text-[26px] lg:text-[28px] font-bold tracking-tight text-foreground leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
