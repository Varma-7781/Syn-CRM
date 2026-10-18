# SYNTRAXS CRM — Firebase Feature Dependency Map

> **Document Status**: Complete & Verified  
> **Target Application**: `lovable-syntraxs-ui` (Syntraxs Technologies Enterprise CRM)  
> **Codebase Root**: `c:\Users\Asus\Downloads\Syntraxs-Proj\zoopiter_crm_oct\lovable-syntraxs-ui`  
> **Date**: October 2026  
> **Author**: Senior React/TypeScript & Database Migration Specialist  

---

## 1. Executive Summary

This document establishes the exact end-to-end mapping between user-facing CRM features in **SYNTRAXS CRM** and their underlying Firebase services, Firestore collections, queries, mutation operations, and data transformations.

Importantly, this map explicitly distinguishes between **dynamically database-driven features** and **static, mocked, or derived values**, ensuring that the migration team has clarity on what is backed by live cloud storage versus what is computed or hardcoded in the frontend.

---

## 2. Feature-by-Feature Dependency Matrix

| CRM Feature | Live Firestore Collection(s) | Primary Service Functions | Query / Mutation Type | Dynamic vs. Static/Derived |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Session** | `users` | `authService.loginUser`, `authService.findUserByEmail` | `getDocs('users')`, `setDoc('users/{uid}')` | **Dynamic** (Firestore + LocalStorage) |
| **Background Auth Bridge** | Firebase Auth | `authService.ensureFirebaseAuth` | `signInWithEmailAndPassword`, `createUserWithEmailAndPassword` | **Dynamic** (Firebase Auth) |
| **Lead List & Realtime Sync** | `leads` | `leadService.subscribeToLeads`, `CRMContext` | `onSnapshot(query(leads, orderBy('createdAt', 'desc')))` | **Dynamic** (Real-time Firestore) |
| **Lead Creation** | `leads` | `leadService.addLead` | `addDoc(collection(db, 'leads'))` | **Dynamic** |
| **Lead Details & Update** | `leads` | `leadService.updateLead` | `updateDoc(doc(db, 'leads', id))` | **Dynamic** |
| **Lead Assignment** | `leads`, `users` | `LeadTable.handleBulkAssign`, `leadService.updateLead` | `updateDoc(doc(db, 'leads', id), { assignedTo, assignedToName })` | **Dynamic** |
| **Quick Activity Logging** | `activities` | `activityService.addActivity` | `addDoc(collection(db, 'activities'))` | **Dynamic** |
| **Activity Timeline** | `activities` | `activityService.subscribeToActivities` | `onSnapshot(query(activities, orderBy('timestamp', 'desc')))` | **Dynamic** (Filtered in-memory by `leadId`) |
| **Follow-up Reminders (5-min)** | `leads` | `CRMContext` (10s polling interval) | In-memory evaluation + `updateDoc(leads, { followUpStatus })` | **Dynamic** (State stored in Firestore) |
| **Browser Push Notification** | None (HTML5 API) | `CRMContext.checkFollowUps` | `new Notification(...)` | **Local Client API** (No FCM server dep) |
| **Excel / CSV Template** | None | `admin.leads.handleDownloadTemplate` | Blob download | **Static Format** |
| **Excel Lead Import** | `leads` | `admin.leads.handleFileUpload`, `leadService.addLead` | `XLSX.read()` + sequential `addDoc('leads')` | **Dynamic** (Batch Firestore Writes) |
| **Lead CSV Export** | `leads` | `admin.leads.handleExportCSV` | Client memory export of loaded leads | **Dynamic** (Derived from Firestore) |
| **Target Quota Setup** | `targets` | `targetService.addTarget` | `addDoc(collection(db, 'targets'))` | **Dynamic** |
| **Target Inline Modification** | `targets` | `targetService.updateTarget` | `updateDoc(doc(db, 'targets', id))` | **Dynamic** |
| **Team Quota Scorecard** | `targets`, `leads`, `users`| `AdminOverview.tsx`, `admin.team.tsx` | Real-time joins in memory from 3 subscriptions | **Dynamic** |
| **Analytics Reports (XLSX)** | `leads`, `users`, `targets`, `activities` | `admin.reports.handleExportReport` | Multi-sheet `xlsx` workbook generation | **Dynamic** (Derived from Firestore) |
| **Revenue Pacing Area Chart** | None | `charts.RevenueArea` | `REVENUE_TREND` from `crm-data.ts` | ⚠️ **STATIC MOCK DATA** |
| **Operational Gauges** | None | `admin.revenue.tsx` | Static array `[86%, 42%, 74%, 61%]` | ⚠️ **STATIC MOCK DATA** |
| **KPI Strip Deltas** | None | `Kpi` components across pages | Static `delta={...}` props | ⚠️ **STATIC PRESENTATION** |

---

## 3. Deep-Dive Feature Specifications

### 3.1 Lead Management System
- **File Sources**:
  - `src/services/leadService.ts`
  - `src/components/crm/LeadTable.tsx`
  - `src/routes/admin.leads.tsx`
  - `src/routes/sales.pipeline.tsx` / `src/components/crm/SalesCockpit.tsx`
- **Firestore Operations**:
  - `getAllLeads()`: `getDocs(collection(db, 'leads'))`
  - `getLeadById(id)`: `getDoc(doc(db, 'leads', id))`
  - `addLead(leadData)`: Normalizes payload, sets default status (`'new'`), priority (`'medium'`), value (`0`), and timestamps; writes via `addDoc`.
  - `updateLead(id, updates)`: Updates changed fields and appends `updatedAt: Timestamp.now()`.
  - `deleteLead(id)`: Invokes `deleteDoc(doc(db, 'leads', id))`.
  - `subscribeToLeads(callback)`: Real-time listener ordered by `createdAt DESC`.
- **Search & Filtering Logic**:
  - Performed in-memory on the loaded `leads` array for high-speed responsiveness.
  - Search query matches against `company`, `client`, `email`, and `requirement`.
  - Dropdown filters: `status`, `priority`, and `rep` (sales user name or `__none` for unassigned).
  - Sorting: By `value` (`asc` or `desc`).
  - Pagination: Client-side sliced at 10 items per page.

### 3.2 Follow-Up Reminder & Alert Engine
- **File Sources**:
  - `src/context/CRMContext.tsx` (Lines 156–286)
  - `src/components/crm/FollowUpReminderPopup.tsx`
  - `src/components/crm/AppShell.tsx` (`NotificationBell`)
- **Lifecycle & Execution**:
  1. **Polling Loop**: A `setInterval` runs every **10 seconds** in `CRMContext.tsx`.
  2. **Eligibility Criteria**:
     - `lead.nextFollowUp` is set.
     - `lead.followUpStatus` is NOT `'reminded'`, `'completed'`, or `'overdue'`.
     - Current time is within **5 minutes** of scheduled follow-up (`diff > 0 && diff <= 5 * 60 * 1000`).
     - Rep filter: Admins check all leads; sales reps check only their assigned leads (`assignedTo === currentUser.id` or `rep === currentUser.name`).
  3. **State Transition (Alert Fired)**:
     - Updates Firestore: `leadService.updateLead(lead.id, { followUpStatus: 'reminded', followUpRemindedAt: ISOString })`.
     - Displays the floating modal `FollowUpReminderPopup.tsx`.
     - Triggers native desktop notification via `new Notification(...)` if permissions are granted.
  4. **User Actions**:
     - **Called**: Updates `followUpStatus = 'completed'`, `followUpCompletedAt = ISOString`.
     - **Dismiss**: Updates `followUpStatus = 'overdue'`, `followUpOverdueReason = 'dismissed'`.
     - **Auto-Expire (5-min timeout)**: Updates `followUpStatus = 'overdue'`, `followUpOverdueReason = 'no_action'`.
  5. **Notification Bell Dropdown**:
     - Lists all active `upcomingFollowUps` (within 5 minutes).
     - Lists all `overdueFollowUps`.
     - Supports one-click "Clear overdue" batch completion.

### 3.3 Excel / CSV Import Engine
- **File Source**: `src/routes/admin.leads.tsx` (Lines 140–228)
- **Library**: `xlsx` (SheetJS v0.18.5)
- **Accepted File Types**: `.xlsx`, `.xls`, `.csv`
- **Header Normalization**:
  Headers are cleaned via `String(h).trim().toLowerCase().replace(/[*"]/g, "")`.
  Matches fuzzy keywords:
  - `company` -> `companyName`
  - `contact` / `client` -> `contactName`
  - `designation` -> `designation`
  - `requirement` -> `requirement`
  - `email` -> `email`
  - `phone` / `mobile` -> `phone`
  - `category` -> `category`
  - `industry` -> `industry`
  - `source` -> `source` (defaults to `"Excel Import"`)
  - `date` / `created` -> parses Date object, Excel serial number, or ISO string
  - `value` -> `Number(val) || 0`
  - `status` -> `strValue || 'new'`
  - `priority` -> `strValue || 'medium'`
  - `note` -> `notes`
- **Write Strategy**:
  - Validates that `companyName` and `contactName` exist.
  - Iterates sequentially through parsed leads.
  - Employs a **15ms throttle delay every 5 records** (`await new Promise(r => setTimeout(r, 15))`) to prevent browser thread locking and Firestore rate-limiting.
  - Displays real-time percentage progress bar.

### 3.4 Excel Export & Multi-Sheet Report Generation
- **File Sources**:
  - `src/routes/admin.leads.tsx` (`handleExportCSV`)
  - `src/routes/admin.reports.tsx` (`handleExportReport`)
- **Export Capabilities**:
  1. **Lead Export (CSV)**: Full pipeline dump with 13 columns including sanitized quotes.
  2. **Lead Audit Report (XLSX)**:
     - Sheet 1: `Summary` (KPI metrics, status breakdown counts).
     - Sheet 2: `Lead Details` (Every lead with 13 data points).
  3. **Team Performance Report (XLSX)**:
     - Sheet 1: `Performance Summary` (Target, achieved, realization %, won deals).
     - Sheets 2..N: Individual sheet per sales rep named after the rep (sanitized sheet names).
  4. **Activity Ledger Report (XLSX)**:
     - Sheet 1: `Activity Summary` (Counts per interaction type).
     - Sheet 2: `Activity Details` (Full audit log with timestamps and metadata).

### 3.5 Target Quota & Performance Calculation Engine
- **File Sources**:
  - `src/services/targetService.ts`
  - `src/routes/admin.targets.tsx`
  - `src/routes/admin.team.tsx`
  - `src/routes/sales.quota.tsx`
- **Dynamic Logic**:
  - Targets are stored with `userId`, `type` (`weekly` or `monthly`), `target` amount, and `period` string (`YYYY-MM`).
  - **Dynamic Achievement Calculation**: Rather than relying purely on static `achieved` field values, the application queries all leads matching the rep (`assignedTo === rep.id` or `rep === rep.name`) with `status === 'won'` and calculates the sum of `lead.value`.
  - Progress percentage is computed as `Math.round((achieved / target) * 100)`.

---

## 4. Discovered Static, Mocked, or Fallback Elements

The following items in the user interface do NOT originate from Firestore and must not be mistaken for dynamic cloud data:

1. **`RevenueArea` 6-Month Trend Chart**:
   - Component: `src/components/crm/charts.tsx`
   - Data Source: `REVENUE_TREND` from `src/lib/crm-data.ts`.
   - Contains fixed mock datapoints for May through October 2026.
2. **Operational Gauges**:
   - Location: `src/routes/admin.revenue.tsx` (Lines 120–125).
   - Hardcoded percentages: `"Collection efficiency"` (86%), `"Quotation → won"` (42%), `"Follow-ups on time"` (74%), `"Lead response < 1h"` (61%).
3. **KPI Trend Deltas**:
   - Fixed aesthetic values passed to `<Kpi delta={...} />` (e.g. `8.4%`, `12.1%`, `22.4%`).
4. **Default Target Fallbacks**:
   - In `AdminOverview.tsx`: If no targets exist in Firestore, falls back to `4,500,000`.
   - In `SalesCockpit.tsx`: If no target is set for the rep, falls back to `1,500,000`.
5. **Default Team Fallback**:
   - If the `users` collection has no members with `role === 'sales'`, components fall back to the static array `REPS` (`["Arjun Mehta", "Priya Nair", "Rahul Verma", "Sneha Iyer", "Karan Shah"]`).
