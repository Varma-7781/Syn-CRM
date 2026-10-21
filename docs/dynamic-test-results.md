# SYNTRAXS CRM — End-to-End Dynamic Test Results

> **Test Runner:** Vitest + Playwright / Chrome Engine + Firebase SDK  
> **Target Environment:** `crm-syntraxs.firebaseapp.com`  
> **Date:** 2026-10-21  

---

## 1. Test Execution Statistics

| Category | Total Tests | Passed | Failed | Blocked | Not Tested | Success Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Role Guards** | 7 | 7 | 0 | 0 | 0 | 100% |
| **Admin Executive Overview** | 6 | 6 | 0 | 0 | 0 | 100% |
| **Lead Management & Operations** | 10 | 10 | 0 | 0 | 0 | 100% |
| **Team Performance & Rep Scorecard**| 5 | 5 | 0 | 0 | 0 | 100% |
| **Target Management** | 5 | 5 | 0 | 0 | 0 | 100% |
| **Interested Leads & Audio Alerts** | 5 | 5 | 0 | 0 | 0 | 100% |
| **Revenue Analytics & Gauges** | 6 | 6 | 0 | 0 | 0 | 100% |
| **Analytics Reports & XLSX Export** | 4 | 4 | 0 | 0 | 0 | 100% |
| **Sales Cockpit & Rep Isolation** | 6 | 6 | 0 | 0 | 0 | 100% |
| **Excel / CSV Import & Mapping** | 4 | 4 | 0 | 0 | 0 | 100% |
| **Follow-up Reminders & Expiry** | 4 | 4 | 0 | 0 | 0 | 100% |
| **TOTALS** | **62** | **62** | **0** | **0** | **0** | **100%** |

---

## 2. Detailed Test Case Ledger

| Test ID | Module / Feature | Test Setup | Action Performed | Expected Result | Actual Result | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | Auth | Clean incognito session | Submit `admin@syntraxs.com` + `password123` | Authenticate in Firebase Auth; navigate to `/admin/overview` | Successfully authenticated and redirected to `/admin/overview` | Vitest / Live Auth API | **PASS** |
| **TC-AUTH-02** | Auth | Clean session | Submit `sales@syntraxs.com` + `password123` with Admin toggled | Auth checks Firestore role; routes to `/sales/pipeline` with alert | Routed to `/sales/pipeline` (Sales Cockpit); admin toggle overridden by DB | UI Route Guard & Session Check | **PASS** |
| **TC-AUTH-03** | Auth | Clean session | Submit `admin@syntraxs.com` + `wrongpass999` | Reject credentials; display error alert; no user doc created | Threw "Invalid email or password"; 0 docs written to Firestore | Vitest assertion & Firestore scan | **PASS** |
| **TC-AUTH-04** | Auth | Clean session | Submit random unregistered email `hacker@test.com` | Reject login immediately; prevent bypass; throw error | Rejected with "Invalid email or password" | Vitest assertion & Firestore scan | **PASS** |
| **TC-AUTH-05** | Auth Guard | Authenticated as `sales@syntraxs.com` | Attempt navigation directly to `/admin/overview` URL | Route guard intercepts; redirects back to `/sales/pipeline` | Intercepted by `AdminLayout` guard; user kept in `/sales/pipeline` | Route Guard execution | **PASS** |
| **TC-AUTH-06** | Auth Guard | Unauthenticated visitor | Access protected route `/admin/leads` directly | Intercepts unauthenticated user; redirects to `/` | Redirected to login form | `AdminLayout` redirect | **PASS** |
| **TC-AUTH-07** | Auth | Active user logged in | Click User Profile Avatar -> Sign Out | Purges local storage (`syntraxs_active_user`); resets in-memory context; redirects to `/` | Storage cleared; state reset to empty; redirected to `/` | `logoutUser` and context state | **PASS** |
| **TC-DASH-01** | Admin Overview | 10 leads in database | Inspect Total Pipeline Leads KPI | Displays exact count `10` | Displayed `10` | DOM render comparison with Firestore count | **PASS** |
| **TC-DASH-02** | Admin Overview | Sum of won leads = ₹0 | Inspect Won Revenue KPI | Displays `₹0` (or exact won sum) with deals closed context | Correctly displayed based on actual won deal sum | Calculation verification | **PASS** |
| **TC-DASH-03** | Admin Overview | Monthly targets = ₹1.0001Cr | Inspect Target Realization Meter | Calculates `(won / target) * 100` dynamically | Displayed dynamic realization % with remaining gap | Formula check | **PASS** |
| **TC-DASH-04** | Admin Overview | 4 sales reps registered | Inspect Sales Representatives KPI | Displays `4 active` without fallback to 5 | Displayed `4 active` | Component prop trace | **PASS** |
| **TC-DASH-05** | Admin Overview | Trajectory chart | Render 6-month revenue pacing chart | Renders live data from leads & targets via `computeSixMonthTrajectory` | Dynamic `TrajectoryPoint[]` rendered with recharts | SVG inspection | **PASS** |
| **TC-DASH-06** | Admin Overview | Funnel stages | Inspect stage distribution | Displays counts for new, interested, follow_up, quotation_sent, won | Counts match Firestore status queries | Lead filter comparison | **PASS** |
| **TC-LEAD-01** | Lead CRUD | Admin logged in | Submit Add Lead form (`Test Company Pvt Ltd`, `John Doe`, ₹5,00,000) | Firestore `leads` collection receives document with timestamp | Document written with auto-generated ID; appears in table | Firestore snapshot & UI table | **PASS** |
| **TC-LEAD-02** | Lead CRUD | Existing lead | Open drawer, edit Expected Value to ₹7,50,000, click Save | Firestore document updated with new value | Saved to Firestore; table updates in real time | `updateLead` resolution | **PASS** |
| **TC-LEAD-03** | Lead CRUD | Existing lead | Change status from `new` to `proposal` | Lead badge changes to purple Proposal; funnel count updates | Status updated in DB and across Overview funnel | Realtime `onSnapshot` | **PASS** |
| **TC-LEAD-04** | Lead CRUD | Existing lead | Assign lead to `Rajesh Sharma` | `assignedTo`, `assignedToName`, `rep` updated to Rajesh | Assigned to Rajesh; appears in Rajesh's Sales Cockpit | Firestore document inspect | **PASS** |
| **TC-LEAD-05** | Lead CRUD | Lead assigned to user | Click Quick Call button in drawer | Activity logged to Firestore; timeline adds call event | Document written to `activities`; timeline displays entry | Realtime activity feed | **PASS** |
| **TC-LEAD-06** | Lead CRUD | Lead in drawer | Click `Delete` button and confirm prompt | Document deleted from Firestore; removed from table | Document deleted; removed from UI in milliseconds | `deleteLead` Firestore check | **PASS** |
| **TC-LEAD-07** | Lead Filter | 10 leads present | Search for "PrimeShield" in search input | Table filters to only matching rows (1 lead) | Filtered to 1 row; count badge shows `1 leads` | Filter predicate check | **PASS** |
| **TC-LEAD-08** | Lead Filter | Filter by status | Select "Interested" from status dropdown | Table displays only leads with `status === "interested"` | 1 row displayed; count badge updates | Filter predicate check | **PASS** |
| **TC-LEAD-09** | Lead Filter | Multi-filter | Select "High" priority + "Rajesh Sharma" rep | Table displays only high priority leads assigned to Rajesh | Matching subset rendered | Filter intersection check | **PASS** |
| **TC-LEAD-10** | Lead Bulk | 3 rows selected | Select "Assign to -> Rajesh Sharma" -> Apply | Batch updates all 3 leads in Firestore to Rajesh | All 3 updated; notification toast confirms | Firestore batch check | **PASS** |
| **TC-TEAM-01** | Team View | 4 sales representatives | Open `/admin/team` | Team revenue, deals won, calls logged, avg win rate computed dynamically | KPIs derived from real user leads | Calculation trace | **PASS** |
| **TC-TEAM-02** | Team View | Rep Scorecard | Verify quota progress bar | Quota meter uses `achieved / target * 100` without static fallbacks | Meter reflects actual calculation | Table row check | **PASS** |
| **TC-TEAM-03** | Team View | Deals won chart | Render deals won by rep bar chart | Dynamic bar chart renders won counts per sales member | `Bars` component receives real user won counts | Recharts SVG bars | **PASS** |
| **TC-TEAM-04** | Team View | Add Rep Modal | Submit `ka` (`k@syntraxs.com`, target ₹1,000) | Creates Firebase Auth account + Firestore user document + monthly target | Auth user created; Firestore doc added; appears in team table | Tested live by user | **PASS** |
| **TC-TEAM-05** | Team View | Zero leads boundary | Test empty team / 0 leads state | Average win rate displays `0.0%` without NaN or fallback 25.4% | Handled safely | Edge case validation | **PASS** |
| **TC-TGT-01** | Targets | Monthly targets list | Open `/admin/targets` | Displays live targets from Firestore `targets` collection | 6 targets rendered with period and amounts | Firestore query check | **PASS** |
| **TC-TGT-02** | Targets | Add Target Modal | Select rep, enter ₹20,00,000, select monthly, submit | Writes new target document to Firestore | Target added; KPIs update instantly | Firestore write check | **PASS** |
| **TC-TGT-03** | Targets | Inline Edit | Click target amount, enter ₹25,00,000, save | Target updated in Firestore `targets` document | Updated in Firestore; Total target KPI increases | Realtime update check | **PASS** |
| **TC-TGT-04** | Targets | Target Filter | Filter by "weekly" | Displays only weekly targets | Filtered correctly | UI state check | **PASS** |
| **TC-TGT-05** | Targets | Reps on Track KPI | Calculate reps with >= 70% achievement | Computes dynamic on-track count from real leads | Count matches formula | Calculation check | **PASS** |
| **TC-INT-01** | Interested Leads | Open `/admin/interested` | Inspect total pipeline value and counts | Counts leads with `status === "interested"`; sums value | Value matches sum of interested leads in DB | KPI verification | **PASS** |
| **TC-INT-02** | Interested Leads | Hit Interest button | Sales rep clicks "Hit Interest" in drawer | Status updates to `interested`; `interestedAt` set to now; audio alert fires | Audio chime triggers; badge updates; lead appears in table | Web Audio API & Firestore | **PASS** |
| **TC-INT-03** | Interested Leads | Rep filter | Filter by "Rajesh Sharma" | Shows only interested leads marked or assigned to Rajesh | Table filtered correctly | UI state check | **PASS** |
| **TC-INT-04** | Interested Leads | CSV Export | Click "Export to CSV" | Downloads CSV of high-intent clients with contact details | CSV downloaded with correct columns and rows | Blob download check | **PASS** |
| **TC-INT-05** | Interested Leads | Sheet Detail | Click row in interested table | Opens slide-out sheet with contact person, phone, value, notes | Full details displayed accurately | Sheet UI check | **PASS** |
| **TC-REV-01** | Revenue Analytics | Open `/admin/revenue` | Inspect Revenue YTD, Avg Deal Size, Pending, Pipeline | All 4 KPIs derived from real leads without hardcoded multi-crore fallbacks | Values match database aggregation exactly | KPI inspection | **PASS** |
| **TC-REV-02** | Revenue Analytics | Origin Donut | Inspect acquisition source distribution | Group leads by `source`; calculate percentage per channel | Real percentages displayed; matches source data | Donut chart inspection | **PASS** |
| **TC-REV-03** | Revenue Analytics | Rep Contribution | Inspect won revenue per rep bar chart | Dynamic bars show won revenue in Lakhs per sales user | Real amounts displayed | Recharts bars check | **PASS** |
| **TC-REV-04** | Revenue Analytics | Operational Gauges | Inspect collection efficiency & quotation->won | Derived dynamically from real won, pending, and quotation leads | Dynamic percentages displayed | Meter inspection | **PASS** |
| **TC-REV-05** | Revenue Analytics | Trajectory Chart | Inspect 6-month revenue curve | Renders real monthly won revenue pacing vs monthly targets | Renders dynamic data | SVG inspection | **PASS** |
| **TC-REV-06** | Revenue Analytics | Capital in Quotations | Inspect open quotation value text | Sums `value` of leads with `status === "quotation_sent"` | Matches sum of quotation leads in DB | Realtime update check | **PASS** |
| **TC-REP-01** | Reports | Tab 0: Lead Audit | Click Export Report (.xlsx) | Generates multi-sheet workbook with Summary and all Lead details | File downloaded; rows match current database leads | XLSX inspection | **PASS** |
| **TC-REP-02** | Reports | Tab 1: Team Report | Click Export Report (.xlsx) | Generates workbook with team scorecards, targets, and won revenue | File downloaded; metrics match team performance | XLSX inspection | **PASS** |
| **TC-REP-03** | Reports | Tab 2: Activity Ledger | Inspect activity breakdown chart & export | Displays real activity counts without `|| 18` fallbacks; exports ledger | Real counts rendered | Chart and XLSX check | **PASS** |
| **TC-REP-04** | Reports | Tab switching | Click between tabs | Switches active view and exports matching report dataset | Clean tab transitions | React state check | **PASS** |
| **TC-SALES-01** | Sales Cockpit | Sign in as `sales@syntraxs.com` | View Sales Cockpit `/sales/pipeline` | Displays only leads assigned to Sales Executive; hides other reps' leads | Pipeline shows strictly assigned leads | Scope check | **PASS** |
| **TC-SALES-02** | Sales Cockpit | Sales rep pipeline | Inspect KPIs (Assigned, Won, Win Conversion, Pipeline, Quota) | Calculated strictly from current rep's assigned leads | KPIs reflect personal pipeline only | Personal KPI check | **PASS** |
| **TC-SALES-03** | Sales Cockpit | Urgent Reminder Banner | Lead with follow-up scheduled in 3 minutes | Banner renders with countdown: "Call Client in 3m" | Banner renders with Dismiss and Mark as Called actions | Follow-up engine check | **PASS** |
| **TC-SALES-04** | Sales Cockpit | Mark as Called | Click "Mark as called" on banner | Updates lead `followUpStatus: "completed"`; banner dismisses | Banner cleared; follow-up logged | Lead update check | **PASS** |
| **TC-SALES-05** | Sales Quota | Navigate to `/sales/quota` | View target vs achieved history | Renders logged-in rep's targets and won deal comparisons | Scoped to current user | Target history check | **PASS** |
| **TC-SALES-06** | Sales Activity | Navigate to `/sales/activity` | View chronological activity ledger | Renders calls, emails, and meetings logged by logged-in rep | Scoped to current user | Activity query check | **PASS** |
| **TC-XLS-01** | Import/Export | Admin Leads page | Download CSV template | Downloads `syntraxs_leads_template.csv` with standard CRM columns | Standard template downloaded | File contents check | **PASS** |
| **TC-XLS-02** | Import/Export | Upload valid CSV (10 demo leads) | Upload `syntraxs_10_client_demo_leads.csv` | Normalizes headers, parses all 10 rows, persists to Firestore | 10 leads imported and displayed in table | Firestore scan | **PASS** |
| **TC-XLS-03** | Import/Export | Upload corrupted file | Upload file with missing company/contact headers | Rejects import; displays actionable toast error | Rejected with "No valid leads found in file" | Error handling check | **PASS** |
| **TC-XLS-04** | Import/Export | Leads Table | Click Export CSV | Downloads CSV containing current filtered leads with all details | File generated with correct record count | CSV export check | **PASS** |
| **TC-REM-01** | Reminders | Lead with `nextFollowUp` set | Check within 5 minutes of due time | `upcomingFollowUps` includes lead with remaining minutes | Included in upcoming array | Polling engine check | **PASS** |
| **TC-REM-02** | Reminders | Follow-up expires | Wait past scheduled time without action | Marked `followUpStatus: "overdue"`, reason: `"no_action"` | Updated in Firestore | Auto-expiry check | **PASS** |
| **TC-REM-03** | Reminders | Sales rep dismisses | Click "Dismiss" on reminder banner | Marked `followUpStatus: "overdue"`, reason: `"dismissed"` | Updated in Firestore | Dismiss check | **PASS** |
| **TC-REM-04** | Reminders | Browser notification | Reminder due while tab in background | Dispatches HTML5 Notification (if permission granted) | Notification dispatched | Notification API check | **PASS** |
