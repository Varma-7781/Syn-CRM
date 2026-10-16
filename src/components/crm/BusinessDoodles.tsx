import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * Custom dual-theme business doodle illustration system for the Syntraxs CRM hero background.
 *
 * Hand-drawn vector outlines with rounded strokes and restrained enterprise accents:
 * - Upward-trending revenue charts, bar charts, and growth arrows
 * - Sales funnels, conversion diagrams, and currency medallions
 * - Targets, bullseyes, and milestone arrows
 * - Briefcases, contracts, and business documents
 * - Customer relationships, team collaboration nodes, and handshake deals
 * - Calendars, checklists, and task pipelines
 * - Launch rockets, lightbulbs, and interlocking workflow cogs
 *
 * Adapts dynamically between Dark and Light modes via CSS custom properties.
 */
export const BusinessDoodles = memo(function BusinessDoodles({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden",
        className
      )}
      style={{
        maskImage:
          "radial-gradient(ellipse 90% 85% at 50% 50%, black 60%, rgba(0,0,0,0.4) 85%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 90% 85% at 50% 50%, black 60%, rgba(0,0,0,0.4) 85%, transparent 100%)",
      }}
    >
      <svg
        viewBox="0 0 1000 1100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          {/* Subtle glow filter for electric accents in dark mode */}
          <filter id="doodleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Linear gradient for upward trend flow */}
          <linearGradient id="growthGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--doodle-stroke)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--doodle-primary)" stopOpacity="0.9" />
          </linearGradient>

          {/* Rocket propulsion trail gradient */}
          <linearGradient id="rocketTrail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--doodle-primary)" stopOpacity="0.8" />
            <stop offset="60%" stopColor="var(--doodle-cyan)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--doodle-stroke-faint)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ------------------------------------------------------------------------- */}
        {/* BACKGROUND CONNECTIVE CURVES & FLOW LINES (Interlinking Ecosystem)        */}
        {/* ------------------------------------------------------------------------- */}
        <g
          stroke="var(--doodle-stroke-faint)"
          strokeWidth="1.25"
          strokeDasharray="4 6"
          strokeLinecap="round"
        >
          {/* Top curve: Target -> Megaphone -> Lightbulb -> Rocket */}
          <path d="M 460 70 C 510 50, 560 60, 615 85 C 670 110, 720 100, 780 140" />

          {/* Left vertical flow: Briefcase -> CRM Network -> Checklist */}
          <path d="M 60 250 C 35 300, 45 340, 65 375 C 90 415, 60 490, 45 590" />

          {/* Right vertical flow: Rocket -> Funnel -> Tablet -> Gears */}
          <path d="M 830 230 C 865 300, 840 330, 810 370 C 785 410, 860 500, 840 590 C 820 670, 800 740, 780 780" />

          {/* Bottom curve: Checklist -> Bar Chart -> Calendar -> Handshake -> Gears */}
          <path d="M 65 680 C 50 720, 60 750, 80 770 C 110 800, 150 820, 190 850 C 260 900, 350 920, 420 930 C 510 940, 630 910, 700 870" />

          {/* Cross flow behind main stage */}
          <path d="M 120 440 C 200 480, 240 430, 320 450" />
          <path d="M 680 620 C 720 650, 760 630, 820 670" />
        </g>

        {/* ------------------------------------------------------------------------- */}
        {/* LAYER 1: AMBIENT FLOATING GROUP (Top & Lower-Left Elements)               */}
        {/* ------------------------------------------------------------------------- */}
        <g className="animate-doodle-float" style={{ transformOrigin: "45% 35%" }}>
          {/* ======================================================================= */}
          {/* 1. IDEA LIGHTBULB (Strategy & Innovation) — Top Right [x: 645, y: 85]    */}
          {/* ======================================================================= */}
          <g transform="translate(645, 85)">
            {/* Outward Radiating Sparks */}
            <g stroke="var(--doodle-stroke)" strokeWidth="1.5" strokeLinecap="round">
              <line x1="0" y1="-32" x2="0" y2="-40" />
              <line x1="22" y1="-22" x2="29" y2="-29" />
              <line x1="32" y1="0" x2="40" y2="0" />
              <line x1="-22" y1="-22" x2="-29" y2="-29" />
              <line x1="-32" y1="0" x2="-40" y2="0" />
            </g>

            {/* Radiant primary spark */}
            <line
              x1="18"
              y1="-30"
              x2="23"
              y2="-38"
              stroke="var(--doodle-primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Glass Bulb Contour */}
            <path
              d="M -16 -10 C -22 0 -20 12 -10 18 C -7 20 -7 25 -7 28 L 7 28 C 7 25 7 20 10 18 C 20 12 22 0 16 -10 C 11 -21 -11 -21 -16 -10 Z"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />

            {/* Screw Base & Contact Tip */}
            <path
              d="M -5 31 L 5 31 M -4 34 L 4 34 M -2 37 L 2 37"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.75"
              strokeLinecap="round"
            />

            {/* Amber Glow Filament Loop */}
            <path
              d="M -6 10 L -3 0 L 0 7 L 3 0 L 6 10"
              stroke="var(--doodle-accent-amber)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ======================================================================= */}
          {/* 2. BULLSEYE TARGET & ARROW — Top Center [x: 410, y: 65]                 */}
          {/* ======================================================================= */}
          <g transform="translate(410, 65)">
            {/* Outer Ring */}
            <circle
              cx="0"
              cy="0"
              r="28"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.75"
              strokeDasharray="176"
              strokeDashoffset="12"
            />
            {/* Middle Ring */}
            <circle
              cx="0"
              cy="0"
              r="18"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.5"
            />
            {/* Inner Center Bullseye */}
            <circle
              cx="0"
              cy="0"
              r="7"
              stroke="var(--doodle-accent-emerald)"
              strokeWidth="2"
              fill="var(--doodle-accent-emerald)"
              fillOpacity="0.25"
            />

            {/* Piercing Target Arrow */}
            <g strokeLinecap="round" strokeLinejoin="round">
              {/* Shaft */}
              <line
                x1="-38"
                y1="-38"
                x2="-3"
                y2="-3"
                stroke="var(--doodle-primary)"
                strokeWidth="2"
              />
              {/* Arrow Head */}
              <path
                d="M -10 -2 L -1 -1 L -2 -10"
                stroke="var(--doodle-primary)"
                strokeWidth="2"
                fill="none"
              />
              {/* Arrow Fletching / Feathers */}
              <path
                d="M -34 -40 L -40 -34 M -30 -42 L -42 -30"
                stroke="var(--doodle-cyan)"
                strokeWidth="1.75"
              />
            </g>

            {/* Impact Sparkles */}
            <path
              d="M 6 -6 L 9 -9 M 7 5 L 12 7 M -5 8 L -8 12"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </g>

          {/* ======================================================================= */}
          {/* 3. MEGAPHONE / SALES OUTREACH — Top Center-Right [x: 535, y: 110]        */}
          {/* ======================================================================= */}
          <g transform="translate(535, 110) rotate(-10)">
            {/* Speaker Cone */}
            <path
              d="M -18 -6 L 12 -18 L 12 18 L -18 6 Z"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            {/* Mouthpiece */}
            <rect
              x="-24"
              y="-5"
              width="6"
              height="10"
              rx="2"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.5"
            />
            {/* Grip Handle */}
            <path
              d="M -10 9 L -7 23 C -6 26 -1 25 -2 22 L -4 10"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Acoustic Growth Waves */}
            <path
              d="M 18 -10 C 24 -4 24 4 18 10"
              stroke="var(--doodle-primary)"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M 25 -16 C 35 -6 35 6 25 16"
              stroke="var(--doodle-cyan)"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </g>

          {/* ======================================================================= */}
          {/* 4. EXECUTIVE BRIEFCASE & CONTRACT — Top Left [x: 52, y: 220]             */}
          {/* ======================================================================= */}
          <g transform="translate(52, 220) rotate(4)">
            {/* Peeked Document / Contract */}
            <path
              d="M 16 -24 L 32 -24 L 40 -16 L 40 2 L 16 2 Z"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.25"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            <path d="M 32 -24 L 32 -16 L 40 -16" stroke="var(--doodle-stroke)" strokeWidth="1.25" />
            <line x1="20" y1="-12" x2="28" y2="-12" stroke="var(--doodle-cyan)" strokeWidth="1" strokeLinecap="round" />
            <line x1="20" y1="-7" x2="34" y2="-7" stroke="var(--doodle-stroke)" strokeWidth="1" strokeLinecap="round" />

            {/* Briefcase Body */}
            <rect
              x="-28"
              y="-12"
              width="58"
              height="38"
              rx="6"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            {/* Center Division Seam */}
            <line
              x1="-28"
              y1="5"
              x2="30"
              y2="5"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.25"
            />
            {/* Top Handle */}
            <path
              d="M -10 -12 C -10 -22 12 -22 12 -12"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            {/* Center Buckle / Clasp */}
            <rect
              x="-2"
              y="1"
              width="6"
              height="8"
              rx="1.5"
              stroke="var(--doodle-accent-amber)"
              strokeWidth="1.5"
              fill="var(--doodle-fill-soft)"
            />
          </g>

          {/* ======================================================================= */}
          {/* 5. GROWTH BAR CHART & ASCENDING ARROW — Bottom Left [x: 105, y: 810]    */}
          {/* ======================================================================= */}
          <g transform="translate(105, 810)">
            {/* X/Y Axes */}
            <path
              d="M -48 -60 L -48 30 L 70 30"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Stepped Bars with Rounded Tops */}
            {/* Bar 1 */}
            <rect
              x="-38"
              y="5"
              width="14"
              height="25"
              rx="3"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.5"
              fill="var(--doodle-fill-soft)"
            />
            {/* Bar 2 */}
            <rect
              x="-18"
              y="-12"
              width="14"
              height="42"
              rx="3"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.5"
              fill="var(--doodle-fill-soft)"
            />
            {/* Bar 3 */}
            <rect
              x="2"
              y="-32"
              width="14"
              height="62"
              rx="3"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.5"
              fill="var(--doodle-fill-soft)"
            />
            {/* Bar 4 (Peak) */}
            <rect
              x="22"
              y="-54"
              width="14"
              height="84"
              rx="3"
              stroke="var(--doodle-primary)"
              strokeWidth="1.75"
              fill="var(--doodle-primary)"
              fillOpacity="0.15"
            />

            {/* Ascending Trend Curve Over Bars */}
            <path
              d="M -42 10 Q -15 -18 10 -40 T 48 -70"
              stroke="url(#growthGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Arrowhead at Peak */}
            <path
              d="M 36 -72 L 50 -70 L 46 -58"
              stroke="var(--doodle-primary)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Trend Data Nodes */}
            <circle cx="-31" cy="5" r="3" fill="var(--doodle-stroke)" />
            <circle cx="-11" cy="-12" r="3" fill="var(--doodle-stroke-strong)" />
            <circle cx="9" cy="-32" r="3" fill="var(--doodle-primary)" />
            <circle cx="29" cy="-54" r="3.5" fill="var(--doodle-cyan)" />

            {/* Floating ROI Pill Tag */}
            <g transform="translate(18, -84)">
              <rect
                x="0"
                y="0"
                width="42"
                height="16"
                rx="8"
                stroke="var(--doodle-primary)"
                strokeWidth="1.25"
                fill="var(--doodle-fill-soft)"
              />
              <text
                x="21"
                y="11.5"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fontFamily="var(--font-mono, monospace)"
                fill="var(--doodle-primary)"
              >
                +42%
              </text>
            </g>
          </g>

          {/* ======================================================================= */}
          {/* 6. CALENDAR & SCHEDULED MILESTONE — Bottom Mid-Left [x: 235, y: 920]    */}
          {/* ======================================================================= */}
          <g transform="translate(235, 920) rotate(-4)">
            {/* Calendar Pad Body */}
            <rect
              x="-24"
              y="-22"
              width="48"
              height="44"
              rx="6"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            {/* Top Binder Rings */}
            <line x1="-12" y1="-26" x2="-12" y2="-18" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="-26" x2="12" y2="-18" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round" />
            {/* Header Division Banner */}
            <line x1="-24" y1="-10" x2="24" y2="-10" stroke="var(--doodle-stroke)" strokeWidth="1.25" />

            {/* Dates Grid Dots & Marks */}
            <g fill="var(--doodle-stroke)">
              <circle cx="-14" cy="-2" r="1.75" />
              <circle cx="-2" cy="-2" r="1.75" />
              <circle cx="10" cy="-2" r="1.75" />
              <circle cx="-14" cy="8" r="1.75" />
              <circle cx="10" cy="8" r="1.75" />
              <circle cx="-14" cy="16" r="1.75" />
              <circle cx="-2" cy="16" r="1.75" />
              <circle cx="10" cy="16" r="1.75" />
            </g>

            {/* Circled Target Milestone Date with Checkmark */}
            <circle
              cx="-2"
              cy="8"
              r="6"
              stroke="var(--doodle-primary)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M -4 8 L -2.5 9.5 L 0.5 6.5"
              stroke="var(--doodle-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ======================================================================= */}
          {/* 7. INTERLOCKING WORKFLOW COGS — Bottom Right [x: 770, y: 840]           */}
          {/* ======================================================================= */}
          <g transform="translate(770, 840)">
            {/* Primary Driver Cog (8 teeth) */}
            <g transform="translate(-14, -10)">
              <circle
                cx="0"
                cy="0"
                r="18"
                stroke="var(--doodle-stroke-strong)"
                strokeWidth="1.75"
                fill="var(--doodle-fill-soft)"
              />
              <circle
                cx="0"
                cy="0"
                r="6"
                stroke="var(--doodle-stroke)"
                strokeWidth="1.5"
              />
              {/* 8 Gear Teeth */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <rect
                  key={deg}
                  x="-3"
                  y="-22"
                  width="6"
                  height="5"
                  rx="1"
                  stroke="var(--doodle-stroke-strong)"
                  strokeWidth="1.5"
                  fill="var(--doodle-fill-soft)"
                  transform={`rotate(${deg} 0 0)`}
                />
              ))}
            </g>

            {/* Secondary Meshed Cog (6 teeth) */}
            <g transform="translate(20, 14)">
              <circle
                cx="0"
                cy="0"
                r="13"
                stroke="var(--doodle-cyan)"
                strokeWidth="1.75"
                fill="var(--doodle-fill-soft)"
              />
              <circle
                cx="0"
                cy="0"
                r="4"
                stroke="var(--doodle-cyan)"
                strokeWidth="1.25"
              />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <rect
                  key={deg}
                  x="-2.5"
                  y="-16.5"
                  width="5"
                  height="4"
                  rx="1"
                  stroke="var(--doodle-cyan)"
                  strokeWidth="1.25"
                  fill="var(--doodle-fill-soft)"
                  transform={`rotate(${deg} 0 0)`}
                />
              ))}
            </g>

            {/* Smooth Motion Arcs */}
            <path
              d="M -36 -28 C -30 -36 -18 -38 -8 -36"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* ------------------------------------------------------------------------- */}
        {/* LAYER 2: AMBIENT FLOATING GROUP (Top-Right, Right Edge, Mid-Left)         */}
        {/* ------------------------------------------------------------------------- */}
        <g className="animate-doodle-float-alt" style={{ transformOrigin: "65% 55%" }}>
          {/* ======================================================================= */}
          {/* 8. ASCENDING LAUNCH ROCKET — Top Right Edge [x: 810, y: 180]            */}
          {/* ======================================================================= */}
          <g transform="translate(810, 180) rotate(-38)">
            {/* Propulsion Trail Curve */}
            <path
              d="M 0 38 Q 0 70 -20 110"
              stroke="url(#rocketTrail)"
              strokeWidth="2.5"
              strokeDasharray="4 5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Exhaust Flames */}
            <path
              d="M -5 26 C -8 38 0 46 0 46 C 0 46 8 38 5 26"
              stroke="var(--doodle-accent-amber)"
              strokeWidth="1.75"
              fill="var(--doodle-accent-amber)"
              fillOpacity="0.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M -2.5 26 C -4 33 0 38 0 38 C 0 38 4 33 2.5 26"
              stroke="var(--doodle-primary)"
              strokeWidth="1.25"
              fill="var(--doodle-primary)"
              fillOpacity="0.3"
            />

            {/* Aerodynamic Fuselage */}
            <path
              d="M 0 -36 C 14 -16 16 12 13 26 L -13 26 C -16 12 -14 -16 0 -36 Z"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />

            {/* Nose Cone Trim Line */}
            <path
              d="M -8 -16 C -3 -24 3 -24 8 -16"
              stroke="var(--doodle-primary)"
              strokeWidth="1.75"
              fill="none"
            />

            {/* Porthole Window */}
            <circle
              cx="0"
              cy="-1"
              r="6.5"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.5"
              fill="var(--doodle-fill-soft)"
            />
            <circle
              cx="0"
              cy="-1"
              r="4"
              stroke="var(--doodle-cyan)"
              strokeWidth="1.5"
              fill="var(--doodle-cyan)"
              fillOpacity="0.3"
            />

            {/* Swept Delta Fins */}
            <path
              d="M -13 15 L -26 28 C -22 33 -14 31 -13 25 Z"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            <path
              d="M 13 15 L 26 28 C 22 33 14 31 13 25 Z"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />

            {/* Engine Nozzle Bracket */}
            <path
              d="M -6 26 L 6 26 L 4 30 L -4 30 Z"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.5"
              fill="var(--doodle-fill-soft)"
            />
          </g>

          {/* ======================================================================= */}
          {/* 9. SALES FUNNEL & CONVERSION TOKEN — Mid Right [x: 810, y: 395]         */}
          {/* ======================================================================= */}
          <g transform="translate(810, 395)">
            {/* Incoming Leads entering top */}
            <circle cx="-12" cy="-22" r="3" fill="var(--doodle-stroke)" />
            <circle cx="2" cy="-28" r="3.5" fill="var(--doodle-primary)" />
            <circle cx="14" cy="-20" r="2.5" fill="var(--doodle-cyan)" />

            {/* Funnel Upper Rim Ellipse */}
            <ellipse
              cx="0"
              cy="-12"
              rx="32"
              ry="8"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              fill="var(--doodle-fill-soft)"
            />

            {/* Funnel Body & Spout */}
            <path
              d="M -32 -12 L -12 30 L -12 46 L 12 46 L 12 30 L 32 -12"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />

            {/* Tier Division Bands (TOFU, MOFU, BOFU) */}
            <path
              d="M -23 5 C -10 11 10 11 23 5"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.25"
            />
            <path
              d="M -16 20 C -7 24 7 24 16 20"
              stroke="var(--doodle-primary)"
              strokeWidth="1.5"
            />

            {/* Converted Currency Token Dropping from Spout */}
            <g transform="translate(0, 64)">
              <circle
                cx="0"
                cy="0"
                r="11"
                stroke="var(--doodle-primary)"
                strokeWidth="1.75"
                fill="var(--doodle-primary)"
                fillOpacity="0.15"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-mono, monospace)"
                fill="var(--doodle-primary)"
              >
                ₹
              </text>
              {/* Droplet / Splash Ripples */}
              <path
                d="M -16 2 C -19 6 -22 6 -24 6"
                stroke="var(--doodle-cyan)"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
              <path
                d="M 16 2 C 19 6 22 6 24 6"
                stroke="var(--doodle-cyan)"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* ======================================================================= */}
          {/* 10. CRM CUSTOMER COLLABORATION NETWORK — Mid Left [x: 75, y: 405]       */}
          {/* ======================================================================= */}
          <g transform="translate(75, 405)">
            {/* Center Primary Node (Customer / Lead) */}
            <circle
              cx="0"
              cy="0"
              r="14"
              stroke="var(--doodle-primary)"
              strokeWidth="1.75"
              fill="var(--doodle-primary)"
              fillOpacity="0.12"
            />
            {/* Lead Silhouette inside center */}
            <circle cx="0" cy="-3.5" r="4" fill="var(--doodle-primary)" />
            <path
              d="M -7 9 C -7 4 7 4 7 9"
              stroke="var(--doodle-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Satellite Member Node A */}
            <g transform="translate(36, -26)">
              <circle
                cx="0"
                cy="0"
                r="9"
                stroke="var(--doodle-stroke)"
                strokeWidth="1.5"
                fill="var(--doodle-fill-soft)"
              />
              <circle cx="0" cy="-2" r="2.5" fill="var(--doodle-stroke)" />
              <path d="M -4 6 C -4 3 4 3 4 6" stroke="var(--doodle-stroke)" strokeWidth="1" strokeLinecap="round" fill="none" />
            </g>

            {/* Satellite Member Node B */}
            <g transform="translate(32, 28)">
              <circle
                cx="0"
                cy="0"
                r="9"
                stroke="var(--doodle-stroke-strong)"
                strokeWidth="1.5"
                fill="var(--doodle-fill-soft)"
              />
              <circle cx="0" cy="-2" r="2.5" fill="var(--doodle-cyan)" />
              <path d="M -4 6 C -4 3 4 3 4 6" stroke="var(--doodle-cyan)" strokeWidth="1" strokeLinecap="round" fill="none" />
            </g>

            {/* Connector Vectors */}
            <line
              x1="11"
              y1="-8"
              x2="28"
              y2="-20"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.25"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />
            <line
              x1="10"
              y1="9"
              x2="24"
              y2="22"
              stroke="var(--doodle-stroke)"
              strokeWidth="1.25"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />

            {/* Mini Chat Quote Bubble */}
            <g transform="translate(-28, -26) rotate(-6)">
              <path
                d="M -12 -8 L 12 -8 C 15 -8 15 6 12 6 L 0 6 L -6 12 L -5 6 L -12 6 C -15 6 -15 -8 -12 -8 Z"
                stroke="var(--doodle-stroke)"
                strokeWidth="1.25"
                strokeLinejoin="round"
                fill="var(--doodle-fill-soft)"
              />
              <circle cx="-5" cy="-1" r="1.2" fill="var(--doodle-stroke)" />
              <circle cx="0" cy="-1" r="1.2" fill="var(--doodle-stroke)" />
              <circle cx="5" cy="-1" r="1.2" fill="var(--doodle-stroke)" />
            </g>
          </g>

          {/* ======================================================================= */}
          {/* 11. TASK CHECKLIST CLIPBOARD — Lower Left [x: 50, y: 640]               */}
          {/* ======================================================================= */}
          <g transform="translate(50, 640) rotate(-3)">
            {/* Clipboard Base */}
            <rect
              x="-24"
              y="-30"
              width="48"
              height="60"
              rx="6"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            {/* Header Spring Clamp */}
            <rect
              x="-12"
              y="-35"
              width="24"
              height="9"
              rx="2.5"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.5"
              fill="var(--doodle-fill-soft)"
            />
            <circle cx="0" cy="-30.5" r="1.75" fill="var(--doodle-stroke)" />

            {/* Item 1 (Checked) */}
            <rect x="-17" y="-18" width="7" height="7" rx="1.5" stroke="var(--doodle-primary)" strokeWidth="1.25" />
            <path d="M -16 -14.5 L -14.5 -13 L -11.5 -16" stroke="var(--doodle-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="-6" y1="-14.5" x2="16" y2="-14.5" stroke="var(--doodle-stroke-strong)" strokeWidth="1.25" strokeLinecap="round" />

            {/* Item 2 (Checked) */}
            <rect x="-17" y="-5" width="7" height="7" rx="1.5" stroke="var(--doodle-accent-emerald)" strokeWidth="1.25" />
            <path d="M -16 -1.5 L -14.5 0 L -11.5 -3" stroke="var(--doodle-accent-emerald)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="-6" y1="-1.5" x2="14" y2="-1.5" stroke="var(--doodle-stroke)" strokeWidth="1.25" strokeLinecap="round" />

            {/* Item 3 (In Progress) */}
            <rect x="-17" y="8" width="7" height="7" rx="1.5" stroke="var(--doodle-stroke)" strokeWidth="1.25" />
            <line x1="-6" y1="11.5" x2="9" y2="11.5" stroke="var(--doodle-stroke)" strokeWidth="1.25" strokeLinecap="round" />
          </g>

          {/* ======================================================================= */}
          {/* 12. ANALYTICS TABLET / KPI COCKPIT — Far Right Edge [x: 870, y: 600]     */}
          {/* ======================================================================= */}
          <g transform="translate(870, 600) rotate(5)">
            {/* Tablet Frame (Partially cropped for edge depth) */}
            <rect
              x="-40"
              y="-30"
              width="78"
              height="58"
              rx="7"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            {/* Top Speaker / Sensor notch */}
            <line x1="-8" y1="-25" x2="8" y2="-25" stroke="var(--doodle-stroke)" strokeWidth="1.25" strokeLinecap="round" />

            {/* Mini Donut Chart on Tablet */}
            <circle cx="-18" cy="2" r="12" stroke="var(--doodle-stroke)" strokeWidth="2.5" fill="none" />
            <path
              d="M -18 -10 A 12 12 0 0 1 -6 2"
              stroke="var(--doodle-cyan)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Mini Sparkline Chart */}
            <line x1="4" y1="-10" x2="28" y2="-10" stroke="var(--doodle-stroke-faint)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="4" y1="2" x2="28" y2="2" stroke="var(--doodle-stroke-faint)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="4" y1="14" x2="28" y2="14" stroke="var(--doodle-stroke-faint)" strokeWidth="1" strokeDasharray="2 2" />
            <path
              d="M 4 12 Q 12 8 16 -2 T 28 -6"
              stroke="var(--doodle-primary)"
              strokeWidth="1.75"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* ======================================================================= */}
          {/* 13. HANDSHAKE / DEAL CLOSED AGREEMENT — Bottom Center [x: 480, y: 970]   */}
          {/* ======================================================================= */}
          <g transform="translate(480, 970)">
            {/* Left Hand & Sleeve */}
            <path
              d="M -38 -2 L -20 -2 L -10 6 L 0 6 L -4 14 L -18 14 L -24 6 L -38 6 Z"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            {/* Left Cuff */}
            <line x1="-32" y1="-4" x2="-32" y2="8" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round" />

            {/* Right Hand & Clasping Grip */}
            <path
              d="M 38 -2 L 20 -2 L 10 6 L 0 6 L 4 14 L 18 14 L 24 6 L 38 6 Z"
              stroke="var(--doodle-stroke-strong)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill="var(--doodle-fill-soft)"
            />
            {/* Right Cuff */}
            <line x1="32" y1="-4" x2="32" y2="8" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round" />

            {/* Partnership Interlock Heart/Success Star Burst */}
            <g transform="translate(0, -10)">
              <path
                d="M 0 -7 L 2 -2 L 7 0 L 2 2 L 0 7 L -2 2 L -7 0 L -2 -2 Z"
                fill="var(--doodle-accent-emerald)"
              />
            </g>
          </g>
        </g>

        {/* ------------------------------------------------------------------------- */}
        {/* ATMOSPHERIC DOODLE SPARKLES, ACCENT STARS & DATA NODES (Scattered Field)  */}
        {/* ------------------------------------------------------------------------- */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* 4-Point Doodle Stars (✦) */}
          {/* Top Left */}
          <path
            d="M 180 80 Q 180 92 192 92 Q 180 92 180 104 Q 180 92 168 92 Q 180 92 180 80 Z"
            fill="var(--doodle-primary)"
            fillOpacity="0.7"
          />
          {/* Top Center-Right */}
          <path
            d="M 590 55 Q 590 64 599 64 Q 590 64 590 73 Q 590 64 581 64 Q 590 64 590 55 Z"
            fill="var(--doodle-cyan)"
            fillOpacity="0.65"
          />
          {/* Near Rocket */}
          <path
            d="M 870 95 Q 870 105 880 105 Q 870 105 870 115 Q 870 105 860 105 Q 870 105 870 95 Z"
            fill="var(--doodle-accent-amber)"
            fillOpacity="0.7"
          />
          {/* Mid Right */}
          <path
            d="M 730 490 Q 730 498 738 498 Q 730 498 730 506 Q 730 498 722 498 Q 730 498 730 490 Z"
            fill="var(--doodle-primary)"
            fillOpacity="0.6"
          />
          {/* Mid Left */}
          <path
            d="M 130 510 Q 130 519 139 519 Q 130 519 130 528 Q 130 519 121 519 Q 130 519 130 510 Z"
            fill="var(--doodle-cyan)"
            fillOpacity="0.6"
          />
          {/* Lower Left */}
          <path
            d="M 35 760 Q 35 767 42 767 Q 35 767 35 774 Q 35 767 28 767 Q 35 767 35 760 Z"
            fill="var(--doodle-stroke)"
            fillOpacity="0.8"
          />
          {/* Lower Right */}
          <path
            d="M 680 770 Q 680 778 688 778 Q 680 778 680 786 Q 680 778 672 778 Q 680 778 680 770 Z"
            fill="var(--doodle-primary)"
            fillOpacity="0.65"
          />
          {/* Bottom Near Handshake */}
          <path
            d="M 380 960 Q 380 968 388 968 Q 380 968 380 976 Q 380 968 372 968 Q 380 968 380 960 Z"
            fill="var(--doodle-accent-emerald)"
            fillOpacity="0.7"
          />

          {/* Micro Crosses (+) */}
          <g stroke="var(--doodle-stroke)" strokeWidth="1.25">
            <line x1="280" y1="120" x2="280" y2="128" />
            <line x1="276" y1="124" x2="284" y2="124" />

            <line x1="720" y1="240" x2="720" y2="248" />
            <line x1="716" y1="244" x2="724" y2="244" />

            <line x1="160" y1="340" x2="160" y2="348" />
            <line x1="156" y1="344" x2="164" y2="344" />

            <line x1="640" y1="720" x2="640" y2="728" />
            <line x1="636" y1="724" x2="644" y2="724" />

            <line x1="880" y1="740" x2="880" y2="748" />
            <line x1="876" y1="744" x2="884" y2="744" />
          </g>

          {/* Floating Data Rings & Accent Circles */}
          <g fill="none">
            <circle cx="340" cy="90" r="4.5" stroke="var(--doodle-cyan)" strokeWidth="1.5" />
            <circle cx="760" cy="110" r="3.5" stroke="var(--doodle-stroke)" strokeWidth="1.25" />
            <circle cx="80" cy="510" r="5" stroke="var(--doodle-primary)" strokeWidth="1.5" />
            <circle cx="850" cy="480" r="4" stroke="var(--doodle-accent-amber)" strokeWidth="1.25" />
            <circle cx="170" cy="740" r="4" stroke="var(--doodle-stroke)" strokeWidth="1.25" />
            <circle cx="620" cy="850" r="5.5" stroke="var(--doodle-cyan)" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
});

/**
 * Lightweight, compact doodle accent tailored for the mobile strip header.
 * Keeps mobile view lively while strictly preventing overflow or distraction.
 */
export const BusinessDoodlesMobile = memo(function BusinessDoodlesMobile({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden opacity-25",
        className
      )}
    >
      <svg
        viewBox="0 0 400 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Trend Bar Micro Doodle (Far Left Edge) */}
        <g transform="translate(14, 46)">
          <line x1="0" y1="20" x2="32" y2="20" stroke="var(--doodle-stroke)" strokeWidth="1" />
          <rect x="4" y="10" width="4" height="10" rx="1" stroke="var(--doodle-stroke)" strokeWidth="0.9" />
          <rect x="12" y="4" width="4" height="16" rx="1" stroke="var(--doodle-stroke)" strokeWidth="0.9" />
          <rect x="20" y="-3" width="4" height="23" rx="1" stroke="var(--doodle-primary)" strokeWidth="1" fill="var(--doodle-primary)" fillOpacity="0.2" />
          <path d="M 3 10 Q 14 -1 25 -7" stroke="var(--doodle-primary)" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Target Bullseye Micro Doodle (Far Right Edge) */}
        <g transform="translate(372, 34)">
          <circle cx="0" cy="0" r="14" stroke="var(--doodle-stroke)" strokeWidth="1" />
          <circle cx="0" cy="0" r="8" stroke="var(--doodle-stroke-strong)" strokeWidth="0.9" />
          <circle cx="0" cy="0" r="3" fill="var(--doodle-accent-emerald)" />
          <line x1="-16" y1="-16" x2="-2" y2="-2" stroke="var(--doodle-primary)" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Small Rocket (Upper Right Edge) */}
        <g transform="translate(340, 16) rotate(-35) scale(0.48)">
          <path d="M 0 -24 C 9 -10 11 8 9 18 L -9 18 C -11 8 -9 -10 0 -24 Z" stroke="var(--doodle-cyan)" strokeWidth="1.5" fill="none" />
          <circle cx="0" cy="0" r="3.5" stroke="var(--doodle-cyan)" strokeWidth="1.2" />
        </g>

        {/* Sparkle Stars in corners */}
        <path d="M 55 16 Q 55 20 59 20 Q 55 20 55 24 Q 55 20 51 20 Q 55 20 55 16 Z" fill="var(--doodle-primary)" />
        <path d="M 382 92 Q 382 95 385 95 Q 382 95 382 98 Q 382 95 379 95 Q 382 95 382 92 Z" fill="var(--doodle-accent-amber)" />
      </svg>
    </div>
  );
});
