import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Loader2, Moon, Sun, AlertCircle } from "lucide-react";
import { BrandMark, Wordmark, useTheme } from "@/components/crm/primitives";
import { cn } from "@/lib/utils";
import { useCRM } from "@/context/CRMContext";

export function LoginScreen() {
  const { theme, toggle } = useTheme();
  return (
    <div className="relative min-h-screen lg:h-screen lg:min-h-0 lg:max-h-screen overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-background lg:grid lg:grid-cols-[1.12fr_1fr]">
      <BrandSide />
      <div className="relative flex min-h-screen lg:min-h-0 lg:h-full lg:max-h-screen flex-col justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-background">
        {/* Full Business Doodle Pattern Background (Inspired by Zoopiter CRM) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 login-doodle-bg"
        />

        <div className="relative z-10 flex items-center justify-between px-4 sm:px-5 pt-3.5 lg:justify-end lg:px-8 lg:pt-4">
          <div className="flex items-center lg:hidden">
            <Wordmark size="md" />
          </div>
          <button
            onClick={(e) => toggle(e)}
            aria-label="Toggle theme"
            suppressHydrationWarning
            className="group relative flex size-9 sm:size-8 items-center justify-center rounded-md border border-border bg-surface/80 backdrop-blur-sm text-muted-foreground transition-all duration-300 hover:text-foreground hover:scale-105 active:scale-95 shadow-xs"
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            <span className="transition-transform duration-500 ease-out group-hover:rotate-45">
              {theme === "dark" ? (
                <Sun className="size-4 sm:size-3.5 text-amber-400 transition-transform duration-300" />
              ) : (
                <Moon className="size-4 sm:size-3.5 text-sky-400 transition-transform duration-300 -rotate-12" />
              )}
            </span>
          </button>
        </div>
        <MobileStrip />
        <div className="relative z-10 flex flex-1 min-h-0 items-center justify-center px-3.5 sm:px-6 py-4 lg:py-2">
          {/* Floating Login Card Modal over the Doodle Background */}
          <div className="w-full max-w-[415px] rounded-2xl border border-border/80 bg-surface/92 p-4 sm:p-6 shadow-2xl backdrop-blur-xl light:bg-white/94 light:border-border/70 light:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)]">
            <LoginForm />
          </div>
        </div>
        <footer className="relative z-10 flex items-center justify-between px-4 sm:px-5 pb-3 pt-2 text-[11px] font-medium text-muted-foreground lg:px-8 lg:pb-3.5 lg:pt-0">
          <span>© 2026 SYNTRAXS Technologies</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3 text-success" /> Encrypted session</span>
        </footer>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useCRM();
  const [role, setRole] = useState<"admin" | "sales">("admin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, pw: false });
  const [error, setError] = useState<string | null>(null);

  const emailErr = touched.email && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid work email" : null;
  const pwErr = touched.pw && pw.length < 6 ? "Password must be at least 6 characters" : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, pw: true });
    if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 6) { setError("Check the highlighted fields and try again."); return; }
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, pw, role);
      const targetRole = user?.role || role;
      navigate({
        to: targetRole === "admin" ? "/admin/overview" : "/sales/pipeline",
        replace: true,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <div className="animate-rise" style={{ animationDelay: "350ms" }}>
        <div className="eyebrow mb-1.5 flex items-center gap-2"><span className="size-1.5 rounded-full bg-success animate-pulse-dot" /> Workspace · syntraxs.crm</div>
        <h1 className="text-[23px] font-bold tracking-[-0.02em] text-foreground sm:text-[25px]">Welcome back</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Sign in to continue to your workspace.</p>
      </div>

      <div className="mt-4 space-y-3 animate-rise" style={{ animationDelay: "480ms" }}>
        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-foreground">Sign in as</div>
          <div role="radiogroup" aria-label="Role" className="relative grid grid-cols-2 rounded-lg border border-border bg-surface p-1">
            <span aria-hidden className={cn("absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md border border-border-strong bg-elevated shadow-pop transition-transform duration-300 ease-[var(--ease-out)]", role === "sales" && "translate-x-full")} />
            {(["admin", "sales"] as const).map((r) => (
              <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}
                className={cn("relative z-10 h-8 rounded-md text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", role === r ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground")}>
                {r === "admin" ? "Admin" : "Sales"}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground mr-0.5">Quick:</span>
            {[
              { label: "Sales (Masthan)", role: "sales" as const, email: "mastanvali@bristletech.com" },
              { label: "Sales (Rajesh)", role: "sales" as const, email: "rajesh@bristletech.com" },
              { label: "Admin (Zoopiter)", role: "admin" as const, email: "admin@zoopiter.com" },
              { label: "Admin (Krishna)", role: "admin" as const, email: "krishnaprasad@bristletech.com" },
            ].map((q) => (
              <button
                key={q.email}
                type="button"
                onClick={() => {
                  setRole(q.role);
                  setEmail(q.email);
                  setPw("password123");
                  setError(null);
                }}
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10.5px] font-medium transition-colors",
                  email === q.email ? "border-primary bg-primary text-primary-foreground font-semibold" : "border-border bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <Field id="email" label="Work email" icon={Mail} error={emailErr}>
          <input id="email" type="email" autoComplete="email" value={email} placeholder="name@syntraxs.com"
            onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className="h-full w-full bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground" />
        </Field>

        <Field id="pw" label="Password" icon={Lock} error={pwErr} trailing={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="relative flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <Eye className={cn("absolute inset-0 m-auto size-3.5 transition-all duration-200", show ? "scale-50 opacity-0" : "opacity-100")} />
            <EyeOff className={cn("absolute inset-0 m-auto size-3.5 transition-all duration-200", show ? "opacity-100" : "scale-50 opacity-0")} />
          </button>
        } labelAction={<a href="#" className="text-[11.5px] font-medium text-primary hover:underline">Forgot?</a>}>
          <input id="pw" type={show ? "text" : "password"} autoComplete="current-password" value={pw} placeholder="••••••••"
            onChange={(e) => setPw(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
            className="h-full w-full bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground" />
        </Field>

        <div className={cn("grid transition-all duration-300", error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[12px] font-medium text-destructive"><AlertCircle className="size-3.5" />{error}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 animate-rise" style={{ animationDelay: "600ms" }}>
        <button type="submit" disabled={loading}
          className="group relative flex h-11 sm:h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-primary text-[14px] sm:text-[13.5px] font-semibold text-primary-foreground shadow-cta transition-all duration-200 hover:-translate-y-px hover:bg-primary-hover active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-90">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary-foreground/15 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-scan" />
          {loading ? (<><Loader2 className="size-3.5 animate-spin" /> Signing in…</>) : (<>Sign In <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" /></>)}
        </button>
        <p className="mt-2.5 text-center text-[11.5px] text-muted-foreground">Access is provisioned by your administrator.</p>
      </div>
    </form>
  );
}

function Field({ id, label, icon: Icon, error, trailing, labelAction, children }: { id: string; label: string; icon: typeof Mail; error: string | null; trailing?: React.ReactNode; labelAction?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-foreground">{label}</label>
        {labelAction}
      </div>
      <div className={cn("group relative flex h-9.5 items-center gap-2.5 rounded-md border bg-surface px-3 transition-all duration-200",
        error ? "border-destructive/60 ring-3 ring-destructive/10" : "border-border hover:border-border-strong focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15")}>
        <Icon className={cn("size-3.5 shrink-0 transition-colors", error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary")} />
        {children}
        {trailing}
      </div>
      <div className={cn("overflow-hidden text-[11.5px] font-medium text-destructive transition-all duration-200", error ? "mt-1 max-h-5 opacity-100" : "max-h-0 opacity-0")}>{error}</div>
    </div>
  );
}

function useCount(to: number, ms = 1500, delay = 150) {
  const [v, setV] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;

    const timer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / ms, 1);

        // Silky smooth quintic ease-out curve
        const easeOut = 1 - Math.pow(1 - progress, 4);
        setV(to * easeOut);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [to, ms, delay]);

  return v;
}

function useCountInt(to: number, ms = 1400, delay = 250) {
  const [v, setV] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;

    const timer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / ms, 1);

        const easeOut = 1 - Math.pow(1 - progress, 4);
        setV(Math.round(to * easeOut));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [to, ms, delay]);

  return v;
}

function BrandSide() {
  return (
    <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:h-full lg:max-h-screen lg:flex-col justify-between">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 -top-1/4 h-[80%] w-[80%] rounded-full bg-primary/15 blur-[120px] animate-drift" />
        <div className="absolute -bottom-1/3 right-[-20%] h-[70%] w-[70%] rounded-full bg-info/10 blur-[140px] animate-drift" style={{ animationDelay: "-9s" }} />
        <div className="absolute inset-0 hairline-grid" />
        <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
          <line x1="0" y1="78%" x2="100%" y2="38%" className="stroke-primary/30" strokeWidth="1" />
          <line x1="12%" y1="100%" x2="70%" y2="0" className="stroke-border-strong" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between px-8 py-4 xl:px-14 xl:py-6">
        <div>
          <div className="animate-rise self-start pb-2">
            <Wordmark size="lg" />
          </div>
          <div className="mt-3.5 max-w-[500px] animate-rise xl:mt-6" style={{ animationDelay: "120ms" }}>
            <h2 className="text-[26px] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground xl:text-[36px]">
              Powering smarter<br /><span className="text-steel">business operations.</span>
            </h2>
            <p className="mt-1.5 max-w-[420px] text-[12.5px] leading-relaxed text-muted-foreground xl:text-[13.5px]">
              One intelligent workspace for managing leads, sales performance and customer relationships.
            </p>
          </div>
        </div>
        <div className="relative my-auto flex-1 min-h-0 flex items-center justify-center animate-rise py-1" style={{ animationDelay: "240ms" }}>
          <Workspace />
        </div>
      </div>
    </div>
  );
}

function StageRow({ s, i }: { s: { k: string; n: number; w: number }; i: number }) {
  const count = useCountInt(s.n, 1200, 300 + i * 80);
  return (
    <div className="grid grid-cols-[78px_1fr_32px] items-center gap-3 text-[11px]">
      <span className="text-muted-foreground">{s.k}</span>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", i === 4 ? "bg-success" : "bg-primary/80")}
          style={{ width: `${s.w}%`, transitionDelay: `${150 + i * 80}ms` }}
        />
      </div>
      <span className="num text-right text-foreground font-mono">{count}</span>
    </div>
  );
}

function Workspace() {
  const rev = useCount(42.6, 1600, 150);
  const conv = useCount(31.8, 1600, 250);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stages = [
    { k: "New", n: 128, w: 100 },
    { k: "Interested", n: 86, w: 70 },
    { k: "Follow up", n: 54, w: 48 },
    { k: "Quotation", n: 31, w: 30 },
    { k: "Won", n: 19, w: 18 },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const mainCardTransform = isHovered
    ? `rotateY(${mousePos.x * 12}deg) rotateX(${-mousePos.y * 12}deg) translateZ(15px) scale(1.02)`
    : `rotateX(6deg) rotateY(-8deg)`;

  const floatCard1Transform = isHovered
    ? `translate3d(${mousePos.x * 26}px, ${mousePos.y * 26}px, 50px) rotateY(${mousePos.x * 16}deg) rotateX(${-mousePos.y * 16}deg)`
    : `translate3d(0px, 0px, 20px)`;

  const floatCard2Transform = isHovered
    ? `translate3d(${mousePos.x * 36}px, ${mousePos.y * 36}px, 70px) rotateY(${mousePos.x * 20}deg) rotateX(${-mousePos.y * 20}deg)`
    : `translate3d(0px, 0px, 30px)`;

  const glareStyle = isHovered
    ? {
        background: `radial-gradient(circle at ${(mousePos.x + 1) * 50}% ${(mousePos.y + 1) * 50}%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)`,
      }
    : { background: 'none' };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto w-full max-w-[520px] h-[330px] cursor-pointer group scale-[0.80] sm:scale-[0.88] 2xl:scale-100 origin-center"
      style={{ perspective: '1400px' }}
    >
      {/* Main Graph Card */}
      <div
        className="absolute inset-x-0 top-0 rounded-xl border border-border-strong bg-elevated/90 p-5 shadow-pop backdrop-blur-sm transition-transform duration-200 ease-out overflow-hidden"
        style={{ transform: mainCardTransform, transformStyle: 'preserve-3d' }}
      >
        {/* Dynamic Glare Overlay */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={glareStyle} />

        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow">Won revenue · Q4</div>
            <div className="num mt-1.5 text-[30px] font-medium text-foreground">₹{rev.toFixed(1)}L</div>
          </div>
          <div className="flex gap-1">
            {["6M", "Q", "M"].map((t, i) => (
              <span key={t} className={cn("rounded px-2 py-0.5 text-[10.5px]", i === 0 ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground font-medium")}>{t}</span>
            ))}
          </div>
        </div>

        {/* SVG Bezier Line Chart */}
        <svg viewBox="0 0 520 120" className="mt-3 h-[110px] w-full overflow-visible">
          <defs>
            <linearGradient id="fillg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" className="[stop-color:var(--primary)]" stopOpacity=".28" />
              <stop offset="100%" className="[stop-color:var(--primary)]" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[30, 60, 90].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} className="stroke-border" strokeDasharray="2 4" />)}
          <path d="M0 96 C 50 90, 80 70, 130 74 S 210 50, 260 56 S 340 28, 390 36 S 470 14, 520 10 L520 120 L0 120Z" fill="url(#fillg)" className="transition-opacity duration-1000 ease-out" style={{ opacity: rev > 0 ? 1 : 0 }} />
          <path d="M0 96 C 50 90, 80 70, 130 74 S 210 50, 260 56 S 340 28, 390 36 S 470 14, 520 10" fill="none" className="stroke-primary animate-draw" strokeWidth="2" />
          <path d="M0 80 L520 30" fill="none" className="stroke-subtle" strokeWidth="1" strokeDasharray="4 4" opacity=".6" />
          <circle cx="520" cy="10" r="4" className="fill-primary animate-pulse-dot" />
        </svg>

        {/* Stage Bars */}
        <div className="mt-4 space-y-1.5">
          {stages.map((s, i) => (
            <StageRow key={s.k} s={s} i={i} />
          ))}
        </div>
      </div>

      {/* Win Conversion Floating Card (Top-Right) */}
      <div
        className="absolute -right-6 top-[44%] w-48 rounded-lg border border-border-strong bg-elevated p-3.5 shadow-pop transition-transform duration-200 ease-out z-20"
        style={{ transform: floatCard1Transform, transformStyle: 'preserve-3d' }}
      >
        <div className="animate-rise" style={{ animationDelay: "200ms" }}>
          <div className="eyebrow">Win conversion</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-[22px] text-foreground">{conv.toFixed(1)}%</span>
            <span className="num text-[11px] text-success">+4.2</span>
          </div>
          <div className="mt-2 flex h-6 items-end gap-[3px]">
            {[40, 55, 35, 70, 60, 82, 74, 95].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-primary/70 transition-all duration-700 ease-out"
                style={{ height: `${h}%`, transitionDelay: `${300 + i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Deals Floating Card (Bottom-Left) */}
      <div
        className="absolute -left-4 bottom-2 w-64 rounded-lg border border-border-strong bg-elevated p-3 shadow-pop transition-transform duration-200 ease-out z-30"
        style={{ transform: floatCard2Transform, transformStyle: 'preserve-3d' }}
      >
        <div className="animate-rise space-y-2" style={{ animationDelay: "300ms" }}>
          {[
            { c: "bg-success", t: "Freshworks", s: "won", v: "₹6.4L" },
            { c: "bg-violet", t: "Tata Elxsi", s: "quotation_sent", v: "₹12.5L" },
            { c: "bg-warning", t: "Ather Energy", s: "follow_up", v: "14:30" },
          ].map((r) => (
            <div key={r.t} className="flex items-center gap-2.5 text-[11.5px]">
              <span className={cn("size-1.5 rounded-full", r.c)} />
              <span className="flex-1 text-foreground">{r.t}</span>
              <span className="num rounded bg-secondary px-1.5 py-px text-[10px] text-muted-foreground">{r.s}</span>
              <span className="num w-12 text-right text-muted-foreground">{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileStrip() {
  return (
    <div className="relative z-10 mx-5 mt-6 overflow-hidden rounded-xl border border-border/80 bg-surface/92 p-4 shadow-lg backdrop-blur-md lg:hidden light:bg-white/94 light:border-border/70">
      <div className="text-[17px] font-semibold leading-snug tracking-tight">Powering smarter <span className="text-steel">business operations.</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[["Pipeline", "319"], ["Won", "₹42.6L"], ["Conv.", "31.8%"]].map(([k, v]) => (
          <div key={k} className="rounded-md border border-border bg-elevated/80 px-2.5 py-2 light:bg-surface/80">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="num mt-0.5 text-[14px] text-foreground">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
