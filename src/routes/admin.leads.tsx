import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useId } from "react";
import { Download, Plus, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { AppPage } from "@/components/crm/AppPage";
import { LeadTable } from "@/components/crm/LeadTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCRM } from "@/context/CRMContext";
import { toast } from "sonner";
import { LEAD_STATUSES, STATUS_META } from "@/lib/crm-data";
import { logger } from "@/lib/logger";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMPORT_ROWS = 500;
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

/**
 * Sanitizes CSV cell contents against Formula Injection (CWE-1236).
 * Escapes quotes and prefixes formula characters (=, +, -, @, \t, \r) with an apostrophe.
 */
function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Lead Management — NexLead CRM" },
      { name: "description", content: "Search, filter, assign and update every lead in the pipeline." },
      { property: "og:title", content: "Lead Management — NexLead CRM" },
      { property: "og:description", content: "Search, filter, assign and update every lead in the pipeline." },
    ],
  }),
  component: AdminLeadsPage,
});

function AdminLeadsPage() {
  const { leads, addLead, users } = useCRM();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // Add lead form state
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [requirement, setRequirement] = useState("");
  const [category, setCategory] = useState("Enterprise");
  const [value, setValue] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [adding, setAdding] = useState(false);

  const salesMembers = users.filter((u) => u.role === "sales");

  const unassignedCount = leads.filter((l) => !l.rep && !l.assignedToName).length;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim()) {
      toast.error("Company name and contact name are required");
      return;
    }

    setAdding(true);
    try {
      const repUser = salesMembers.find((u) => u.id === assignedTo);
      await addLead({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        email: email.trim(),
        requirement: requirement.trim(),
        category,
        value: Number(value) || 0,
        priority,
        status: "new",
        assignedTo: assignedTo || undefined,
        assignedToName: repUser ? repUser.name : undefined,
        notes: "",
        callHistory: [],
        createdAt: new Date().toISOString(),
      });

      // Reset form
      setCompanyName("");
      setContactName("");
      setDesignation("");
      setPhone("");
      setEmail("");
      setRequirement("");
      setValue("");
      setAssignedTo("");
      setIsAddOpen(false);
    } catch {
      toast.error("Failed to add lead");
    } finally {
      setAdding(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Company Name",
      "Contact Name",
      "Designation",
      "Requirement",
      "Mobile No.",
      "Email",
      "Category",
      "Source",
      "Date",
      "Expected value ₹",
      "Priority",
      "Status",
      "Notes",
    ];

    const sampleRow = [
      "Sample Company Pvt Ltd",
      "John Doe",
      "CTO",
      "Custom CRM rollout",
      "+91 9876543210",
      "john@sample.com",
      "Enterprise",
      "Excel Import",
      new Date().toISOString().split("T")[0],
      "500000",
      "high",
      "new",
      "Imported via NexLead template",
    ];

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexlead_leads_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV template downloaded");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Invalid file format. Please upload a .xlsx, .xls, or .csv file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size (max 5 MB)
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error("File size exceeds 5 MB limit. Please upload a smaller file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (!jsonData || jsonData.length < 2) {
          toast.error("File is empty or contains no data rows");
          return;
        }

        if (jsonData.length > MAX_IMPORT_ROWS + 1) {
          toast.error(`Spreadsheet exceeds maximum batch limit of ${MAX_IMPORT_ROWS} rows.`);
          return;
        }

        const headers = (jsonData[0] as string[]).map((h) => String(h).trim().toLowerCase().replace(/[*"]/g, ""));
        const leadsToImport: any[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i] as any[];
          if (!values || values.length === 0) continue;

          const leadData: Record<string, any> = Object.create(null);
          headers.forEach((header, index) => {
            if (header === "__proto__" || header === "constructor" || header === "prototype") return;
            const val = values[index];
            if (val === undefined || val === null) return;
            const strValue = String(val).trim();

            if (header.includes("company")) leadData.companyName = strValue;
            else if (header.includes("contact") || header.includes("client")) leadData.contactName = strValue;
            else if (header.includes("designation")) leadData.designation = strValue;
            else if (header.includes("requirement")) leadData.requirement = strValue;
            else if (header.includes("email")) leadData.email = strValue;
            else if (header.includes("phone") || header.includes("mobile")) leadData.phone = strValue;
            else if (header.includes("category")) leadData.category = strValue;
            else if (header.includes("industry")) leadData.industry = strValue;
            else if (header.includes("source")) leadData.source = strValue || "Excel Import";
            else if (header.includes("date") || header.includes("created")) {
              if (val instanceof Date) leadData.createdAt = val.toISOString();
              else if (typeof val === "number") {
                const date = new Date((val - (25567 + 2)) * 86400 * 1000);
                leadData.createdAt = date.toISOString();
              } else if (strValue) {
                const parsed = new Date(strValue);
                leadData.createdAt = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
              }
            } else if (header.includes("value")) leadData.value = Number(val) || 0;
            else if (header.includes("status")) {
              const sClean = strValue.toLowerCase().trim().replace(/[\s-]/g, "_");
              leadData.status = sClean || "new";
            }
            else if (header.includes("priority")) {
              const pClean = strValue.toLowerCase().trim();
              leadData.priority = (pClean === "high" || pClean === "low") ? pClean : "medium";
            }
            else if (header.includes("rep") || header.includes("assign")) {
              leadData.rep = strValue;
              leadData.assignedToName = strValue;
              const matchedUser = salesMembers.find(
                (u) =>
                  u.name.toLowerCase() === strValue.toLowerCase() ||
                  (u.email && u.email.toLowerCase() === strValue.toLowerCase()) ||
                  u.id === strValue
              );
              if (matchedUser) {
                leadData.assignedTo = matchedUser.id;
                leadData.assignedToName = matchedUser.name;
                leadData.rep = matchedUser.name;
              }
            }
            else if (header.includes("note")) leadData.notes = strValue;
          });

          if (leadData.companyName && leadData.contactName) {
            leadsToImport.push(leadData);
          }
        }

        if (leadsToImport.length === 0) {
          toast.error("No valid leads found in file. Ensure Company and Contact columns exist.");
          return;
        }

        setUploading(true);
        setUploadProgress(0);
        let imported = 0;

        for (let i = 0; i < leadsToImport.length; i++) {
          if (i % 5 === 0) await new Promise((r) => setTimeout(r, 15));
          await addLead(leadsToImport[i]);
          imported++;
          setUploadProgress(Math.round((imported / leadsToImport.length) * 100));
        }

        toast.success(`Successfully imported ${imported} leads!`);
        setIsUploadOpen(false);
      } catch {
        toast.error("Error processing file. Please verify file format.");
        logger.error("[LEADS] Spreadsheet parsing failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }

    const headers = [
      "ID",
      "Company",
      "Contact",
      "Designation",
      "Phone",
      "Email",
      "Category",
      "Requirement",
      "Value",
      "Status",
      "Priority",
      "Assigned Rep",
      "Created Date",
    ];

    const rows = leads.map((l, i) => [
      sanitizeCsvCell(l.id || `L-${1000 + i}`),
      sanitizeCsvCell(l.companyName || l.company || ""),
      sanitizeCsvCell(l.contactName || l.client || ""),
      sanitizeCsvCell(l.designation || ""),
      sanitizeCsvCell(l.phone || ""),
      sanitizeCsvCell(l.email || ""),
      sanitizeCsvCell(l.category || ""),
      sanitizeCsvCell(l.requirement || ""),
      l.value || 0,
      sanitizeCsvCell(l.status || "new"),
      sanitizeCsvCell(l.priority || "medium"),
      sanitizeCsvCell(l.assignedToName || l.rep || "Unassigned"),
      sanitizeCsvCell(l.createdAt?.split("T")[0] || l.date || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexlead_leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} leads to CSV`);
  };

  return (
    <AppPage
      title="Lead Management"
      sub={`${leads.length} leads · ${unassignedCount} unassigned`}
      actions={
        <>
          <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
            <Upload className="size-4" /> Upload Excel
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="size-4" /> Add lead
          </Button>
        </>
      }
    >
      <LeadTable leads={leads} admin />

      {/* Add Lead Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg border-border bg-surface">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Create a new lead opportunity in your CRM pipeline.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-foreground">Company Name *</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-foreground">Contact Person *</label>
                <input
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-foreground">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-foreground">Expected Value (₹)</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="500000"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-foreground">Assign Sales Rep</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {salesMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13.5px] text-foreground outline-none focus:border-primary"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="SMB">SMB</option>
                  <option value="Startup">Startup</option>
                  <option value="Government">Government</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-foreground">Requirement / Scope</label>
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Product or solution requirements…"
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background p-2 text-[13.5px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? <><Loader2 className="size-4 animate-spin" /> Adding…</> : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Excel Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md border-border bg-surface">
          <DialogHeader>
            <DialogTitle>Upload Leads via Excel / CSV</DialogTitle>
            <DialogDescription>
              Upload your .xlsx, .xls, or .csv file to import leads directly into Firestore.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-lg border border-border bg-background p-3 text-[13px]">
              <div>
                <div className="font-medium text-foreground">Need a sample format?</div>
                <div className="text-[11.5px] text-muted-foreground">Download our pre-formatted CSV template.</div>
              </div>
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="shrink-0 self-start sm:self-auto">
                <FileSpreadsheet className="size-3.5" /> Template
              </Button>
            </div>

            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id={fileInputId}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor={fileInputId}
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
                </div>
                <div className="text-[14px] font-medium text-foreground">
                  {uploading ? `Importing leads… ${uploadProgress}%` : "Click to select Excel or CSV file"}
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">Supports .xlsx, .xls, and .csv</div>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}
