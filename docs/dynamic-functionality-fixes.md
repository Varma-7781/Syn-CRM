# SYNTRAXS CRM — Verified Defects Fixed & Retest Evidence

> **Audit Scope:** Defects identified during the comprehensive dynamic functionality audit  
> **Environment:** Production Firebase (`crm-syntraxs`)  
> **Date:** 2026-10-21  

---

## 1. Summary of Applied Fixes

| Defect ID | Module / File | Description of Defect | Severity | Status | Retest Verification |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **DEF-001** | `authService.ts` | Login allowed any credentials by falling back to auto-creating users on failure | **Critical** | **FIXED** | Vitest `authService.test.ts` (4 passed) |
| **DEF-002** | `authService.ts` | Radio button toggle mutated Firestore user roles upon login | **Critical** | **FIXED** | Role override removed; DB is single source of truth |
| **DEF-003** | `charts.tsx` / `crm-data.ts` | 6-month revenue trajectory chart used hardcoded `REVENUE_TREND` | **High** | **FIXED** | Added `computeSixMonthTrajectory` aggregating real leads & targets |
| **DEF-004** | `charts.tsx` | Chart tooltip formatter appended literal `0L` to values (`₹${v}0L`) | **Medium** | **FIXED** | Formatter fixed to `₹${v.toFixed(1)}L` |
| **DEF-005** | `admin.revenue.tsx` | Operational gauges had hardcoded static values (86%, 42%, 74%, 61%) | **High** | **FIXED** | Replaced with dynamic metrics from real database leads |
| **DEF-006** | `admin.revenue.tsx` | Revenue KPIs had multi-crore fallbacks (`|| 19200000`, `|| 2840000`, etc.) | **High** | **FIXED** | Removed all fallbacks; displays honest calculated database totals |
| **DEF-007** | `AdminOverview.tsx` | Target revenue and sales rep count had fallback masks (`|| 4500000`, `: 5`) | **Medium** | **FIXED** | Removed fallbacks; computes live target sum and active rep count |
| **DEF-008** | `admin.reports.tsx` | Activity counts masked with artificial fallbacks (`|| 18`, `|| 12`, etc.) | **Medium** | **FIXED** | Removed fallbacks; counts real activities from Firestore |
| **DEF-009** | `admin.reports.tsx` | Rep calls calculated as `leads * 3` instead of real activities | **Medium** | **FIXED** | Counts matching activity documents of type `"call"` |
| **DEF-010** | `admin.team.tsx` | Average win rate defaulted to `"25.4"` when 0 leads existed | **Low** | **FIXED** | Defaults safely to `"0.0"` |
| **DEF-011** | `SalesCockpit.tsx` | Target quota assumed ₹15L (`1500000`) if no target assigned to rep | **Medium** | **FIXED** | Returns 0 and displays "No quota assigned" when unconfigured |
| **DEF-012** | `LeadTable.tsx` | Admin had no action to permanently delete leads from drawer | **Medium** | **FIXED** | Added Admin Delete button with confirmation dialog |
| **DEF-013** | `CRMContext.tsx` | `login` action didn't reset `loading` flag if error occurred | **Medium** | **FIXED** | Wrapped in `try...finally { setLoading(false); }` |
| **DEF-014** | `LoginScreen.tsx` | Browser autofilled foreign company credentials from other `localhost` projects | **Medium** | **FIXED** | Hardened `autoComplete="off"`, preset corporate credentials |

---

## 2. Detailed Technical Fixes & Code Evidence

### Fix 1: Real Firebase Authentication Enforcement (`DEF-001`)
- **Before:** If `signInWithEmailAndPassword` failed, the catch block swallowed the error and called `ensureFirebaseAuth()`, followed by auto-creating a new user in Firestore and logging them in.
- **After:**
  ```ts
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    authUser = cred.user;
  } catch (err: any) {
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please verify your credentials and try again.');
    }
    throw new Error(err?.message || 'Authentication failed.');
  }
  ```
- **Retest Result:** Vitest automated test `strictly rejects incorrect password` and `strictly rejects non-existent fake email` both passed in 361ms and 406ms.

---

### Fix 2: Dynamic Six-Month Trajectory (`DEF-003` & `DEF-004`)
- **Implemented:** Created `computeSixMonthTrajectory(leads, targets)` in `src/utils/helpers.ts`.
- **Logic:**
  1. Identifies the current month and generates the 6-month window chronologically.
  2. Aggregates all won leads whose `createdAt` or `date` falls in each month.
  3. Computes active monthly target sum across the team in ₹ Lakhs.
  4. Returns `TrajectoryPoint[]` consumed by `RevenueArea` in both Admin Overview and Revenue Analytics.
- **Retest Result:** Vitest unit test `computes 6-month trajectory dynamically from leads and targets` passed.

---

### Fix 3: Elimination of Fallback Masks in Revenue & Overview (`DEF-006` & `DEF-007`)
- **Removed:**
  - `revenueYTD || 19200000` -> `revenueYTD`
  - `pendingPayment || 2840000` -> `pendingPayment`
  - `pipelineValue || 11400000` -> `pipelineValue`
  - `target || 4500000` -> `target`
  - `salesUsers.length > 0 ? salesUsers.length : 5` -> `salesUsers.length`
- **Retest Result:** Dashboard displays true calculated totals matching Firestore documents.

---

### Fix 4: Real Activity Metrics in Reports (`DEF-008` & `DEF-009`)
- **Before:**
  - `counts.Call || 18`
  - `calls: repLeads.length * 3`
- **After:**
  - `counts.Call` (real count)
  - `calls: repCalls` (real activity query count)
- **Retest Result:** Analytics report XLSX export and UI charts now reflect exact activity counts from the `activities` collection.

---

### Fix 5: Admin Lead Deletion in Drawer (`DEF-012`)
- **Before:** `deleteLead` existed in `CRMContext` and `leadService`, but no interactive button was available in the lead drawer.
- **After:** Added confirmation-guarded Delete button visible exclusively to users with `role === "admin"`.
- **Retest Result:** Deleting a test lead removes the document from Firestore and updates table rows in real time.
