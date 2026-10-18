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
        "light:bg-[#0B0F19] light:border light:border-slate-800/90 light:p-1 light:shadow-sm",
        isLight && "bg-[#0B0F19] border border-slate-800/90 p-1 shadow-sm",
        className
      )}
    >
      {!hasError ? (
        <img
          src="/syntraxs-mark.png"
          alt="SYNTRAXS"
          className="h-full w-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,140,255,0.2)]"
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

export function Wordmark({
  compact,
  className,
  size = "md",
}: {
  compact?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [imgError, setImgError] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  if (compact) {
    return <BrandMark className={cn("size-8", className)} />;
  }

  const heightClass = {
    sm: "h-5.5 max-h-[22px]",
    md: "h-7 max-h-[28px]",
    lg: "h-8.5 max-h-[34px]",
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center select-none transition-all duration-300 ease-in-out group",
        // In light theme: sleek obsidian black container pill with smooth rounded corners, tech border, and subtle shadow
        "light:bg-[#0B0F19] light:border light:border-slate-800/90 light:shadow-sm light:rounded-lg light:px-2.5 light:py-1",
        isLight && "bg-[#0B0F19] border border-slate-800/90 shadow-sm rounded-lg px-2.5 py-1",
        // In dark theme: completely seamless transparent integration
        !isLight && "bg-transparent border-transparent p-0 shadow-none",
        className
      )}
    >
      {!imgError ? (
        <img
          src="/syntraxs-logo.png"
          alt="SYNTRAXS Technologies"
          className={cn(
            "w-auto object-contain transition-all duration-300 filter drop-shadow-[0_2px_8px_rgba(0,140,255,0.2)]",
            heightClass
          )}
          onError={() => setImgError(true)}
        />
      ) : (
        /* High-fidelity CSS/SVG Fallback matching the exact Typography and Letter Styling */
        <div className="flex items-center gap-2">
          <BrandMark className="size-6.5" />
          <div className="h-4.5 w-px bg-slate-700/80" />
          <div className="leading-none">
            <div className="flex items-center text-[12.5px] font-black tracking-[0.16em] uppercase">
              <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">SYNTR</span>
              {/* Custom 'A' with Glowing Electric Blue Triangle */}
              <span className="relative inline-flex items-center justify-center bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                A
                <span
                  aria-hidden="true"
                  className="absolute bottom-[1.5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[2.5px] border-r-[2.5px] border-b-[4.5px] border-l-transparent border-r-transparent border-b-[#00b4ff] drop-shadow-[0_0_6px_#00b4ff]"
                />
              </span>
              {/* Custom 'X' in Vibrant 3D Electric Blue */}
              <span className="bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]">
                X
              </span>
              <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">S</span>
            </div>
            {/* TECHNOLOGIES with Aerodynamic Left and Right Tapered Wings */}
            <div className="mt-0.5 flex items-center justify-between text-[7px] font-bold text-[#00b4ff] tracking-[0.22em]">
              <span className="inline-block w-3 h-[1.5px] bg-gradient-to-r from-transparent to-[#00b4ff]" />
              <span className="px-0.5">TECHNOLOGIES</span>
              <span className="inline-block w-3 h-[1.5px] bg-gradient-to-l from-transparent to-[#00b4ff]" />
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
