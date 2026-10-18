# SYNTRAXS CRM — Firebase Migration Test Plan & Validation Matrix

> **Document Status**: Complete & Verified  
> **Target Application**: `lovable-syntraxs-ui` (Syntraxs Technologies Enterprise CRM)  
> **Codebase Root**: `c:\Users\Asus\Downloads\Syntraxs-Proj\zoopiter_crm_oct\lovable-syntraxs-ui`  
> **Date**: October 2026  
> **Author**: Senior QA Architect & Firebase Migration Specialist  

---

## 1. Executive Summary

This validation matrix defines the test cases, verification steps, pass/fail criteria, and required evidence to certify functional parity and stability after connecting the **SYNTRAXS CRM** application to the new Firebase project.

Every critical workflow—from authentication and real-time synchronization to Excel parsing, follow-up alerts, and reporting—is covered.

---

## 2. Test Execution Matrix

| Test ID | Test Category | Setup Preconditions | Action / Execution | Expected Result | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Authentication | Clean browser storage (Incognito), new Firebase `.env` configured. | Navigate to `/`, enter valid admin email and password, click "Sign in". | Redirects to `/admin/overview`. `localStorage` contains `zoopiter_active_user` with `role: "admin"`. | Browser URL is `#/admin/overview` (or `/admin/overview`). Network tab shows Firestore subscriptions connected. |
| **TC-AUTH-02** | Role Protection | Authenticated as `sales` user. | Attempt to navigate directly to `/admin/leads` or `/admin/revenue`. | Route guard redirects user immediately to `/sales/pipeline`. Access denied to admin console. | URL redirects to `/sales/pipeline`. No admin data rendered. |
| **TC-AUTH-03** | Session Persistence | Logged in as sales rep with active pipeline. | Refresh browser page (F5 / Ctrl+R). | User remains logged in; loading spinner shows briefly; pipeline data restores cleanly without requiring re-login. | `getActiveUser()` succeeds from `localStorage`. No redirect to `/login`. |
| **TC-AUTH-04** | Logout Lifecycle | Logged in with active subscriptions. | Click user avatar > Sign out button in sidebar. | Session cleared, in-memory state reset (`leads: []`, `users: []`), user redirected to `/login`. | `localStorage.getItem('zoopiter_active_user')` is `null`. Firestore listeners unsubscribed. |
| **TC-LEAD-01** | Real-time Reads | Two browser tabs open to `/admin/leads`. | Create or edit a lead in Tab 1. | Tab 2 updates dynamically in real time without manual browser refresh. | Change reflects in Tab 2 DOM within < 1.5 seconds. |
| **TC-LEAD-02** | Lead Creation | On `/admin/leads`, click "Add lead". | Fill Company ("Acme Corp"), Contact ("Alice"), Value (500000), Phone, Email. Click Save. | Modal closes, success toast appears, new lead displays at top of table with formatted value (`₹5.0L`). | Lead document created in Firestore `leads` collection with auto-ID and `createdAt` timestamp. |
| **TC-LEAD-03** | Lead Edit & Drawer | Click on a lead row in LeadTable. | Change Status to "Quotation sent", Priority to "High", Value to 750000. Click "Save changes". | Toast "Lead details updated" displays. Status badge and value update instantly in table. | Firestore document in `leads` updated with new status, priority, value, and `updatedAt`. |
| **TC-LEAD-04** | Bulk Assignment | Select 3 leads via table checkboxes. | Choose a sales rep from "Assign to..." dropdown and click "Apply assignment". | Toast confirms assignment. Selected leads update with rep name and avatar. Checkboxes clear. | Firestore documents show `assignedTo` (user ID) and `assignedToName` (rep name). |
| **TC-ACT-01** | Quick Activity Log | Open Lead Drawer for any lead. | Click "Call" icon in drawer action bar. | Toast "CALL recorded" displays. New entry appears immediately in Activity Timeline with current timestamp. | Document created in `activities` collection with `leadId`, `type: "call"`, `userId`, `timestamp`. |
| **TC-ACT-02** | Sales Activity Log | Logged in as sales rep. | Navigate to `/sales/activity`. | Chronological activity log displays all calls, meetings, notes logged by this user. | Activities query filters matching `userId` and orders by `timestamp DESC`. |
| **TC-TGT-01** | Add Target Quota | On `/admin/targets`, click "Add target". | Select sales rep, Period ("2026-10"), Type ("monthly"), Target (1500000). Click Save. | New quota card appears. Target realization progress bar computes live based on won deals. | Document added to `targets` collection with `userId`, `target`, `period`, `type`. |
| **TC-TGT-02** | Inline Target Edit | In targets table, click target amount. | Edit target value from `1500000` to `2000000`. Click checkmark icon. | Table updates to `₹20.0L`. Progress percentage recalculates immediately. | Target document updated in Firestore with new `target` amount. |
| **TC-REM-01** | 5-Minute Follow-up | Schedule a lead's `nextFollowUp` for 4 minutes from now. | Wait up to 10 seconds (polling interval). | FollowUpReminderPopup appears with countdown timer. Sound/desktop notification triggers if permitted. | Lead in Firestore updates `followUpStatus = 'reminded'`, `followUpRemindedAt = ISOString`. |
| **TC-REM-02** | Reminder "Called" | Follow-up popup is visible. | Click green "Called" button. | Popup dismisses with exit animation. Toast confirms completion. Lead removed from pending alerts. | Firestore `leads` document updates `followUpStatus: 'completed'`, `followUpCompletedAt: ISOString`. |
| **TC-REM-03** | Reminder Dismiss | Follow-up popup is visible. | Click red "Dismiss" button. | Popup dismisses. Alert transitions to overdue. Bell icon reflects badge increment. | Firestore updates `followUpStatus: 'overdue'`, `followUpOverdueReason: 'dismissed'`. |
| **TC-REM-04** | 5-Minute Auto-Expire | Follow-up popup is visible. | Leave popup open without interaction for 5 minutes (or simulate 300s). | Popup auto-expires with error toast "Follow-up expired without action". | Firestore updates `followUpStatus: 'overdue'`, `followUpOverdueReason: 'no_action'`. |
| **TC-XLS-01** | CSV Template | On `/admin/leads`, click "Upload Excel". | Click "Download CSV Template". | Browser downloads `syntraxs_leads_template.csv` containing all 13 standard CRM headers. | File inspects cleanly in Excel/text editor with valid sample row. |
| **TC-XLS-02** | Excel Lead Import | Click "Upload Excel" > Select file with 25 lead rows. | Choose `.xlsx` file with valid headers and data. | Progress bar increments to 100%. Toast "Successfully imported 25 leads!" appears. | 25 documents inserted into `leads` collection. All 25 appear in LeadTable. |
| **TC-REP-01** | Lead Audit Export | On `/admin/reports`, select "Lead Audit". | Click "Export XLSX". | Browser downloads `Syntraxs_Lead_Audit_YYYY-MM-DD.xlsx` with "Summary" and "Lead Details" sheets. | Workbook opens cleanly in Excel with accurate KPI numbers matching on-screen UI. |
| **TC-REP-02** | Team Performance | On `/admin/reports`, select "Team Performance". | Click "Export XLSX". | Downloads `Syntraxs_Team_Performance_YYYY-MM-DD.xlsx` with summary sheet and individual rep sheets. | Rep sheets contain correct lead breakdowns and realization metrics. |
| **TC-REP-03** | Activity Ledger | On `/admin/reports`, select "Activity Ledger". | Click "Export XLSX". | Downloads `Syntraxs_Activity_Ledger_YYYY-MM-DD.xlsx` with "Activity Summary" and "Activity Details". | Summary sheet matches counts; details sheet lists all logged activities. |
| **TC-COR-01** | Empty Database | Connect to completely empty Firestore. | Load application as new admin. | Application renders gracefully without crashing or throwing undefined property errors. | Overview shows 0 leads, empty states render cleanly ("No leads match these filters"). |
| **TC-COR-02** | Build Integrity | Project root directory. | Run `npm run build`. | Vite and Nitro compile production worker and static bundles with 0 errors. | Command exits with code 0. `.output` directory generated. |

---

## 3. Historical Data Migration Verification (Scenario B Only)

If transferring records from the old project, verify the following parity counts:

```
[Old Project Record Count]                    [New Project Record Count]
Collection 'users':      ______ docs    --->   Collection 'users':      ______ docs (Must be 100% equal)
Collection 'leads':      ______ docs    --->   Collection 'leads':      ______ docs (Must be 100% equal)
Collection 'targets':    ______ docs    --->   Collection 'targets':    ______ docs (Must be 100% equal)
Collection 'activities': ______ docs    --->   Collection 'activities': ______ docs (Must be 100% equal)
```

---

## 4. Sign-Off Criteria

The migration to the new Firebase project is certified complete only when:
1. 100% of test cases in Section 2 pass without console errors or unhandled exceptions.
2. In Scenario B, all record counts and financial sums match between old and new projects.
3. Production build succeeds cleanly (`npm run build`).
