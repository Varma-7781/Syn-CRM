# SYNTRAXS CRM — Dynamic Functionality Audit & Component Traceability Matrix

> **Document Version:** 1.0.0  
> **Environment:** Production Firebase (`crm-syntraxs`)  
> **Application:** Syntraxs Technologies CRM (`lovable-syntraxs-ui`)  
> **Audit Date:** 2026-10-21  

---

## 1. Executive Architecture Overview

Syntraxs Technologies CRM is built on a modern React 19 + TypeScript architecture with TanStack Router, TanStack Start / Vite, Tailwind CSS v4, and Firebase v11 (Authentication & Cloud Firestore).

### 1.1 State & Realtime Dataflow Architecture
```
                  ┌──────────────────────────────────────────────┐
                  │          Google Cloud Firestore              │
                  │      (crm-syntraxs.firebaseapp.com)          │
                  └───────┬──────────────┬──────────────┬────────┘
                          │              │              │
                    onSnapshot()   onSnapshot()   onSnapshot()
                          │              │              │
                          ▼              ▼              ▼
                 ┌───────────────┬──────────────┬────────────────┐
                 │ leads listener│users listener│targets/activity│
                 └───────┬───────┴──────┬───────┴────────┬───────┘
                         │              │                │
                         ▼              ▼                ▼
                 ┌──────────────────────────────────────────────┐
                 │             CRMContext Provider              │
                 │         (src/context/CRMContext.tsx)         │
                 └───────┬──────────────────────────────┬───────┘
                         │                              │
                         ▼                              ▼
                 ┌──────────────────────┐      ┌──────────────────────┐
                 │     Admin Routes     │      │     Sales Routes     │
                 │   (/admin/overview)  │      │  (/sales/pipeline)   │
                 │   (/admin/leads)     │      │  (/sales/activity)   │
                 │   (/admin/team)      │      │  (/sales/quota)      │
                 │   (/admin/targets)   │      │                      │
                 │   (/admin/revenue)   │      │                      │
                 │   (/admin/reports)   │      │                      │
                 │   (/admin/interested)│      │                      │
                 └──────────────────────┘      └──────────────────────┘
```

---

## 2. Complete Traceability Table of Displayed Values & Controls

Classification Legend:
- **Live Dynamic**: Directly fetched and synchronized from Cloud Firestore.
- **Derived Dynamic**: Calculated dynamically from live database records.
- **Intentionally Static**: Fixed UI copy, labels, icons, table headers, or branding.
- **Mock/Placeholder**: Hardcoded example data used at runtime (Target for removal/replacement).
- **Fallback**: Default value shown when database field is null or record is missing.

| Page / Component | Displayed Element / Control | Data Source / Service | Calculation or Operation | Classification | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth / Login** | Role Toggle (Admin / Sales) | `LoginScreen.tsx` | State `role` toggle | Live Dynamic | Verified |
| **Auth / Login** | Work Email Field | `LoginScreen.tsx` | Controlled state, defaults to official corporate account | Live Dynamic | Verified |
| **Auth / Login** | Password Field | `LoginScreen.tsx` | Controlled input with visibility toggle | Live Dynamic | Verified |
| **Auth / Login** | Sign In Action | `authService.loginUser` | Firebase Auth `signInWithEmailAndPassword` + Firestore lookup | Live Dynamic | Verified |
| **Admin Overview** | Total Pipeline Leads KPI | `CRMContext.leads` | `leads.length` | Derived Dynamic | Verified |
| **Admin Overview** | Won Revenue KPI | `CRMContext.leads` | `leads.filter(l => l.status === "won").reduce(sum(value))` | Derived Dynamic | Verified |
| **Admin Overview** | Deals Closed Subtitle | `CRMContext.leads` | `wonLeads.length deals closed` | Derived Dynamic | Verified |
| **Admin Overview** | Target Realization KPI | `CRMContext.targets` & `leads` | `Math.round((won / target) * 100)` | Derived Dynamic | Verified |
| **Admin Overview** | Active Sales Reps KPI | `CRMContext.users` | `users.filter(u => u.role === "sales").length` | Derived Dynamic | Verified |
| **Admin Overview** | Current Revenue Value | `CRMContext.leads` | `inr(won)` | Derived Dynamic | Verified |
| **Admin Overview** | Target Revenue Value | `CRMContext.targets` | `inr(target)` (sum of monthly targets) | Derived Dynamic | Verified |
| **Admin Overview** | Revenue Gap | `CRMContext.targets` & `leads` | `inr(Math.max(0, target - won))` | Derived Dynamic | Derived Dynamic |
| **Admin Overview** | 6-Month Trajectory Chart | `CRMContext.leads` & `targets` | Monthly aggregation of won revenue & target quotas | Derived Dynamic | Verified |
| **Admin Overview** | Pipeline Funnel Counts | `CRMContext.leads` | `leads.filter(l => l.status === stage).length` | Derived Dynamic | Verified |
| **Admin Overview** | Pipeline Stage Conversion % | `CRMContext.leads` | `Math.round((f.n / funnel[i-1].n) * 100)%` | Derived Dynamic | Verified |
| **Admin Overview** | Quota Scorecard Table | `CRMContext.users`, `leads`, `targets` | Rep monthly target vs actual won deals & realization % | Derived Dynamic | Verified |
| **Admin Overview** | Recent Pipeline Engagements | `CRMContext.activities` | Firestore `activities` ordered by timestamp | Live Dynamic | Verified |
| **Lead Management** | Search Input | `LeadTable.tsx` | Filter by company, client, email, requirement | Derived Dynamic | Verified |
| **Lead Management** | Status Filter Dropdown | `LeadTable.tsx` | Filters rows matching `lead.status` | Derived Dynamic | Verified |
| **Lead Management** | Priority Filter Dropdown | `LeadTable.tsx` | Filters rows matching `lead.priority` | Derived Dynamic | Verified |
| **Lead Management** | Rep Filter Dropdown (Admin) | `CRMContext.users` | Dynamically populated with active sales reps | Live Dynamic | Verified |
| **Lead Management** | Leads Count Badge | `LeadTable.tsx` | `rows.length leads` (filtered or total) | Derived Dynamic | Verified |
| **Lead Management** | Bulk Rep Selection & Assign | `CRMContext.updateLead` | Batch updates `assignedTo`, `assignedToName`, `rep` in Firestore | Live Dynamic | Verified |
| **Lead Management** | Add Lead Modal | `CRMContext.addLead` | Writes new lead document to Firestore `leads` | Live Dynamic | Verified |
| **Lead Management** | Excel / CSV Upload | `XLSX.read` -> `addLead` | Normalizes headers, parses rows, batch persists to Firestore | Live Dynamic | Verified |
| **Lead Management** | CSV Export Action | `LeadTable.tsx` | Serializes current filtered table rows into `.csv` blob | Derived Dynamic | Verified |
| **Lead Management** | Download Template | `admin.leads.tsx` | Generates standard Syntraxs CSV import format | Intentionally Static | Verified |
| **Lead Management** | Lead Details Drawer | `LeadTable.tsx` | Displays and updates status, rep, follow-up date, notes | Live Dynamic | Verified |
| **Lead Management** | Hit Interest Button | `CRMContext.markLeadAsInterested` | Updates `status: 'interested'`, triggers audio & notification | Live Dynamic | Verified |
| **Lead Management** | Quick Call / Email / Meeting Log | `CRMContext.addActivity` | Logs activity entry to Firestore `activities` collection | Live Dynamic | Verified |
| **Team Performance** | Team Revenue KPI | `CRMContext.leads` & `users` | Sum of won deal values for all sales representatives | Derived Dynamic | Verified |
| **Team Performance** | Deals Won KPI | `CRMContext.leads` & `users` | Total won leads count across all reps | Derived Dynamic | Verified |
| **Team Performance** | Calls Logged KPI | `CRMContext.activities` | Total activities of type `"call"` across reps | Derived Dynamic | Verified |
| **Team Performance** | Avg Win Rate KPI | `CRMContext.leads` | `(totalWon / totalLeads) * 100` | Derived Dynamic | Verified |
| **Team Performance** | Rep Scorecard Table | `users`, `leads`, `targets`, `activities` | Aggregated leads, won, calls, revenue, quota % per rep | Derived Dynamic | Verified |
| **Team Performance** | Deals Won by Rep Bar Chart | `CRMContext.leads` & `users` | Dynamic bars displaying won deals count per sales rep | Derived Dynamic | Verified |
| **Team Performance** | + Add Sales Representative | `userService.createSalesUser` | Provisions Firebase Auth user + Firestore profile + Target | Live Dynamic | Verified |
| **Target Management** | Total Target KPI | `CRMContext.targets` | Sum of all displayed target amounts | Derived Dynamic | Verified |
| **Target Management** | Achieved KPI | `CRMContext.leads` | Sum of won deal values for matching target users | Derived Dynamic | Verified |
| **Target Management** | Reps on Track KPI | `targets` & `leads` | Count of reps achieving >= 70% of target | Derived Dynamic | Verified |
| **Target Management** | Target Type Filter | `admin.targets.tsx` | Toggles between All, Monthly, Weekly | Derived Dynamic | Verified |
| **Target Management** | Add Target Dialog | `CRMContext.addTarget` | Persists target to Firestore `targets` collection | Live Dynamic | Verified |
| **Target Management** | Inline Edit Target | `CRMContext.updateTarget` | Inline numerical update saved directly to Firestore | Live Dynamic | Verified |
| **Interested Leads** | Total Interested Leads KPI | `CRMContext.leads` | `leads.filter(l => l.status === "interested").length` | Derived Dynamic | Verified |
| **Interested Leads** | Pipeline Value KPI | `CRMContext.leads` | Sum of values for leads with `status === "interested"` | Derived Dynamic | Verified |
| **Interested Leads** | Reps with Interested Leads | `CRMContext.leads` | Unique count of reps assigned to interested leads | Derived Dynamic | Verified |
| **Interested Leads** | Recent 24h Count KPI | `CRMContext.leads` | Interested leads flagged within last 24 hours | Derived Dynamic | Verified |
| **Interested Leads** | Rep Filter & Sorting | `admin.interested.tsx` | Filter by rep, sort by newest, oldest, highest value | Derived Dynamic | Verified |
| **Interested Leads** | CSV Export | `admin.interested.tsx` | Exports high-intent client list with contact details | Derived Dynamic | Verified |
| **Revenue Analytics** | Revenue YTD KPI | `CRMContext.leads` | Sum of won deal values | Derived Dynamic | Verified |
| **Revenue Analytics** | Avg Deal Size KPI | `CRMContext.leads` | `revenueYTD / wonLeads.length` (or 0 if none) | Derived Dynamic | Verified |
| **Revenue Analytics** | Pending Payment KPI | `CRMContext.leads` | Sum of values for leads in `pending_payment` status | Derived Dynamic | Verified |
| **Revenue Analytics** | Pipeline Value KPI | `CRMContext.leads` | Sum of values for active leads (not won/lost) | Derived Dynamic | Verified |
| **Revenue Analytics** | Acquisition Origin Donut | `CRMContext.leads` | Real breakdown of lead sources (Inbound, Referral, etc.) | Derived Dynamic | Verified |
| **Revenue Analytics** | Rep Contribution Bars | `CRMContext.leads` & `users` | Revenue won (in ₹ Lakhs) per sales representative | Derived Dynamic | Verified |
| **Revenue Analytics** | Operational Gauges | `CRMContext.leads` | Collection efficiency, Quotation->Won rate, on-time follow-ups | Derived Dynamic | Verified |
| **Analytics Reports** | Lead Audit Tab | `CRMContext.leads` | Complete lead status breakdown, totals, and XLSX export | Derived Dynamic | Verified |
| **Analytics Reports** | Revenue & Team Tab | `users`, `leads`, `targets` | Performance scorecard by rep with XLSX export | Derived Dynamic | Verified |
| **Analytics Reports** | Activity Ledger Tab | `CRMContext.activities` | Activity type breakdown and chronological XLSX export | Derived Dynamic | Verified |
| **Sales Cockpit** | Assigned Leads KPI | `CRMContext.leads` | Scoped to `currentUser.id` / `currentUser.name` | Derived Dynamic | Verified |
| **Sales Cockpit** | Revenue Won KPI | `CRMContext.leads` | Won revenue specifically closed by logged-in rep | Derived Dynamic | Verified |
| **Sales Cockpit** | Win Conversion KPI | `CRMContext.leads` | Scoped conversion rate: `(won / assigned) * 100` | Derived Dynamic | Verified |
| **Sales Cockpit** | Total in Pipeline KPI | `CRMContext.leads` | Total deal value of all assigned leads | Derived Dynamic | Verified |
| **Sales Cockpit** | Target Quota & Meter | `CRMContext.targets` | Logged-in rep's monthly target vs achieved won value | Derived Dynamic | Verified |
| **Sales Cockpit** | Urgent Follow-Up Banner | `CRMContext.upcomingFollowUps` | Lead scheduled for follow-up in the next 5 minutes | Derived Dynamic | Verified |
| **Sales Cockpit** | Mark as Called Button | `CRMContext.updateLead` | Sets `followUpStatus: "completed"`, dismisses banner | Live Dynamic | Verified |
| **Sales Cockpit** | Dismiss Reminder Button | `CRMContext.updateLead` | Sets `followUpStatus: "overdue"`, dismisses banner | Live Dynamic | Verified |
| **Sales Cockpit** | Scoped Lead Table | `LeadTable.tsx` | Renders strictly the assigned leads for the logged-in rep | Derived Dynamic | Verified |
| **Sales Quota** | Quota & Target History | `CRMContext.targets` | Rep's targets across periods vs actual won revenue | Derived Dynamic | Verified |
| **Sales Quota** | Target vs Achieved Chart | `sales.quota.tsx` | Responsive bar height comparisons per period | Derived Dynamic | Verified |
| **Sales Activity** | Chronological Activity Log | `CRMContext.activities` | Scoped activities performed by the logged-in sales rep | Live Dynamic | Verified |
