# SYNTRAXS CRM — Static, Mock, and Fallback Data Findings

> **Audit Scope:** Complete codebase scan of `lovable-syntraxs-ui/src`  
> **Date:** 2026-10-21  

---

## 1. Summary of Identified Static Artifacts

During the deep inspection of all routes, context, and components, several fallback masks and hardcoded data structures were uncovered. These fallbacks were originally designed during early frontend prototyping to prevent UI blanks before Firestore was connected.

In a production enterprise CRM, fallback numbers like `|| 19200000` or `: 510000` hide genuine database states and can mislead administrators into believing numbers exist when they do not.

---

## 2. Itemized Findings and Classification

### Finding 1: Static Six-Month Revenue Trajectory in `RevenueArea`
- **Location:** [`src/components/crm/charts.tsx`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/components/crm/charts.tsx#L23-L36) & [`src/lib/crm-data.ts`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/lib/crm-data.ts#L51-L55)
- **Data Element:** `REVENUE_TREND` array (`May` through `Oct` with hardcoded numbers: 2.1, 2.8, 3.4, 3.1, 4.2, 3.6).
- **Classification:** Mock / Placeholder Dataset.
- **Runtime Impact:** Both the Executive Overview (`/admin/overview`) and Revenue Analytics (`/admin/revenue`) rendered this static chart regardless of the actual leads or deals in Firestore.
- **Dynamic Fix:** Update `RevenueArea` to accept dynamic `data?: { m: string; revenue: number; target: number }[]`. In both `AdminOverview` and `Revenue`, calculate the last 6 months' won revenue and target pacing from real `leads` and `targets`.

---

### Finding 2: Fallback Masks in `AdminOverview.tsx`
- **Location:** [`src/components/crm/AdminOverview.tsx`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/components/crm/AdminOverview.tsx#L26-L30)
- **Code:**
  ```ts
  const target = monthlyTargets.reduce((a, t) => a + (t.target || 0), 0) || 4500000;
  const repCount = salesUsers.length > 0 ? salesUsers.length : 5;
  ```
- **Classification:** Fallback Mask.
- **Runtime Impact:**
  - If no monthly targets existed in Firestore, the target defaulted to ₹45L (`4500000`).
  - If no sales users were fetched yet, the team member KPI displayed "5 active" instead of actual count.
- **Dynamic Fix:**
  - Remove `|| 4500000` fallback so `target` strictly reflects the real sum of active targets.
  - Set `repCount = salesUsers.length`.

---

### Finding 3: Fallback Masks in `admin.revenue.tsx`
- **Location:** [`src/routes/admin.revenue.tsx`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/routes/admin.revenue.tsx#L26-L94)
- **Code:**
  ```ts
  const avgDealSize = wonLeads.length > 0 ? Math.round(revenueYTD / wonLeads.length) : 510000;
  const quotationVal = ... || 5420000;
  <Kpi label="Revenue YTD" value={inr(revenueYTD || 19200000)} ... />
  <Kpi label="Pending payment" value={inr(pendingPayment || 2840000)} context={`${pendingPaymentLeads.length || 7} invoices`} />
  <Kpi label="Pipeline value" value={inr(pipelineValue || 11400000)} ... />
  ```
- **Classification:** Fallback Masks.
- **Runtime Impact:** If a fresh database had ₹0 in won revenue, the screen displayed "₹1.92Cr". If there were 0 pending payments, it displayed "₹28.4L (7 invoices)".
- **Dynamic Fix:** Remove all `|| <number>` fallback values. Display genuine calculated values: `inr(revenueYTD)`, `inr(pendingPayment)`, `inr(pipelineValue)`, `inr(avgDealSize)`.

---

### Finding 4: Hardcoded Operational Gauges in `admin.revenue.tsx`
- **Location:** [`src/routes/admin.revenue.tsx`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/routes/admin.revenue.tsx#L120-L125)
- **Code:**
  ```ts
  [
    ["Collection efficiency", 86],
    ["Quotation → won", 42],
    ["Follow-ups on time", 74],
    ["Lead response < 1h", 61],
  ]
  ```
- **Classification:** Static hardcoded metrics.
- **Runtime Impact:** Percentages never changed when leads moved through stages or when follow-ups were completed.
- **Dynamic Fix:** Compute dynamic operational metrics:
  - **Collection Efficiency:** `Math.round((revenueYTD / (revenueYTD + pendingPayment)) * 100)` (or 100% when 0 pending).
  - **Quotation → Won:** `Math.round((wonLeads.length / Math.max(1, wonLeads.length + quotationLeads.length)) * 100)`.
  - **Follow-ups on time:** Dynamically derived from completed follow-ups vs total scheduled follow-ups.

---

### Finding 5: Fallback Activity Counts in `admin.reports.tsx`
- **Location:** [`src/routes/admin.reports.tsx`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/routes/admin.reports.tsx#L60-L65)
- **Code:**
  ```ts
  return [
    { t: "Call", n: counts.Call || 18 },
    { t: "Email", n: counts.Email || 12 },
    { t: "WhatsApp", n: counts.WhatsApp || 14 },
    { t: "Meeting", n: counts.Meeting || 5 },
    { t: "Note", n: counts.Note || 8 },
  ];
  ```
  And line 82: `calls: repLeads.length * 3`.
- **Classification:** Mock / Artificial Multiplication.
- **Runtime Impact:** When no calls were logged, the report displayed 18 calls, 12 emails, etc. Calls per rep were artificially multiplied by 3.
- **Dynamic Fix:** Remove `|| <number>` fallbacks. Count actual matching activity documents from the Firestore `activities` collection.

---

### Finding 6: Fallback Win Rate in `admin.team.tsx`
- **Location:** [`src/routes/admin.team.tsx`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/routes/admin.team.tsx#L49)
- **Code:**
  ```ts
  const avgWinRate = totalLeads > 0 ? ((totalWon / totalLeads) * 100).toFixed(1) : "25.4";
  ```
- **Classification:** Fallback Mask.
- **Runtime Impact:** If there were 0 leads, average win rate showed "25.4%".
- **Dynamic Fix:** Change fallback to `"0.0"`.

---

### Finding 7: Target Fallback in `SalesCockpit.tsx`
- **Location:** [`src/components/crm/SalesCockpit.tsx`](file:///c:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/components/crm/SalesCockpit.tsx#L36-L38)
- **Code:**
  ```ts
  const userTarget = useMemo(() => {
    const t = targets.find((t) => (t.userId === currentUser?.id || t.userId === currentUser?.name) && t.type === "monthly");
    return t ? t.target : 1500000;
  }, [targets, currentUser]);
  ```
- **Classification:** Fallback Mask.
- **Runtime Impact:** If an admin had not assigned a target to a sales rep, the cockpit assumed ₹15L.
- **Dynamic Fix:** Return `t ? t.target : 0`. If `userTarget === 0`, display `No target set` rather than an unassigned ₹15L goal.
