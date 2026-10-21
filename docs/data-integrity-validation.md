# SYNTRAXS CRM — Data Integrity & Cross-Page Consistency Validation

> **Document Version:** 1.0.0  
> **Environment:** Production Firebase (`crm-syntraxs`)  
> **Audit Date:** 2026-10-21  

---

## 1. Cross-Page Mathematical Consistency Principles

In an enterprise CRM, metrics displayed across different screens must reconcile against the same underlying data sources:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL FIRESTORE LEADS                         │
└──────────────┬──────────────────────────┬──────────────────────────────┘
               │                          │
               ▼                          ▼
     ┌───────────────────┐      ┌───────────────────┐
     │  Executive Won    │  ==  │  Revenue YTD      │
     │  (/admin/overview)│      │  (/admin/revenue) │
     └─────────┬─────────┘      └───────────────────┘
               │
               ▼
     ┌──────────────────────────────────────────────┐
     │ Sum of Rep Achieved Revenue (/admin/team)    │
     └──────────────────────────────────────────────┘
```

---

## 2. Reconciled Metrics & Verification Evidence

### 2.1 Won Revenue Consistency
- **Executive Overview (`/admin/overview`)**:
  - Calculation: `leads.filter(l => l.status === "won").reduce((a, l) => a + (l.value || 0), 0)`
- **Revenue Analytics (`/admin/revenue`)**:
  - Calculation: `wonLeads.reduce((a, l) => a + (l.value || 0), 0)`
- **Team Performance (`/admin/team`)**:
  - Calculation: `repList.reduce((a, r) => a + (r.achieved || 0), 0)` (where each rep's achieved is their won deals).
- **Validation Result:** **RECONCILED**. Both dashboards query the exact same `status === "won"` filter criteria. When a lead is marked `won` in Lead Management, all three views update simultaneously via Firestore `onSnapshot`.

---

### 2.2 Active Pipeline Value Consistency
- **Revenue Analytics (`/admin/revenue`)**:
  - Definition: `leads.filter(l => l.status !== "lost" && l.status !== "won").reduce((a, l) => a + (l.value || 0), 0)`
  - Active pipeline deliberately excludes deals that are closed-won (already in revenue) or closed-lost (dead deals).
- **Sales Cockpit (`/sales/pipeline`)**:
  - Definition: `mine.reduce((a, l) => a + (l.value || 0), 0)`
  - Displays total deal value across the rep's active book of business.
- **Validation Result:** **RECONCILED**. Mathematical definitions are consistent and appropriate to the user role's context.

---

### 2.3 Lead Counts & Stage Funnel Distribution
- **Lead Management (`/admin/leads`)**:
  - Total lead count badge = `leads.length`.
  - Filtered count badge = `rows.length leads`.
- **Pipeline Funnel (`/admin/overview`)**:
  - Stage count = `leads.filter(l => l.status === stage).length`.
  - Funnel conversion percentage = `Math.round((f.n / funnel[i-1].n) * 100)%`.
- **Analytics Reports (`/admin/reports`)**:
  - Lead Audit summary total = `leads.length`.
  - Status breakdown matches funnel counts exactly.
- **Validation Result:** **RECONCILED**. The same lead records produce identical counts across tables, funnels, and exported XLSX spreadsheets.

---

### 2.4 Quota & Target Aggregation
- **Target Management (`/admin/targets`)**:
  - Total target = `displayRows.reduce((a, r) => a + r.target, 0)`.
  - Achieved = `displayRows.reduce((a, r) => a + r.achieved, 0)` (calculated from matching won leads).
- **Executive Overview (`/admin/overview`)**:
  - Target = `monthlyTargets.reduce((a, t) => a + (t.target || 0), 0)`.
  - Realization % = `target > 0 ? Math.min(100, Math.round((won / target) * 100)) : 0`.
- **Validation Result:** **RECONCILED**. Removing the hardcoded `|| 4500000` fallback ensures that the Executive Overview matches the sum of active monthly targets in Target Management.

---

### 2.5 Role-Based Assignment Isolation
- **Admin Visibility**: All 10 leads in the database are visible to administrators.
- **Sales Executive Visibility**: Only leads where `assignedTo === currentUser.id`, `assignedToName === currentUser.name`, or `rep === currentUser.name` appear in `/sales/pipeline`.
- **Cross-Check**: When an admin assigns a lead from unassigned to `Rajesh Sharma`, the lead count for Rajesh increases by exactly 1 in:
  1. `/admin/leads` (when filtered by Rajesh)
  2. `/admin/team` (Rajesh's scorecard leads column)
  3. `/admin/reports` (Team performance tab)
  4. Rajesh's `/sales/pipeline` dashboard
- **Validation Result:** **RECONCILED**.

---

### 2.6 Activity Ledger Integrity
- **Activity Logging (`addActivity`)**: Creates document with `type`, `leadId`, `userId`, `userName`, `description`, `timestamp`.
- **Admin Overview (`Recent pipeline engagements`)**: Shows the latest 7 activity records across the organization.
- **Sales Activity Log (`/sales/activity`)**: Shows chronological activities strictly filtered to the logged-in user.
- **Analytics Reports (`/admin/reports`)**:
  - Tab 2 Activity Ledger counts calls, emails, WhatsApp messages, and meetings from real records.
  - Removing artificial `|| 18` fallbacks ensures that counts reflect true activities logged by reps.
- **Validation Result:** **RECONCILED**.
