import React, { useState } from "react";
import { UserPlus, Mail, User, Lock, Phone, Building, Target, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/context/CRMContext";
import { toast } from "sonner";
import { inr } from "@/lib/crm-data";

interface AddSalesRepresentativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSalesRepresentativeDialog({ open, onOpenChange }: AddSalesRepresentativeDialogProps) {
  const { createSalesRepresentative } = useCRM();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Sales");
  const [targetQuota, setTargetQuota] = useState("1500000");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setDepartment("Sales");
    setTargetQuota("1500000");
    setError(null);
    setShowPassword(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!loading) {
      if (!nextOpen) resetForm();
      onOpenChange(nextOpen);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setError("Please enter the representative's full name (at least 2 characters).");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Initial password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await createSalesRepresentative({
        name: cleanName,
        email: cleanEmail,
        password,
        phone: phone.trim(),
        department: department.trim() || "Sales",
        targetQuota: Number(targetQuota) || 1500000,
      });

      if (res.success) {
        toast.success(`Sales account created for ${cleanName}!`, {
          description: `Firebase Authentication and Firestore profile initialized. ${cleanName} can now sign in.`,
          duration: 4500,
        });
        resetForm();
        onOpenChange(false);
      } else {
        setError(res.error || "Failed to create sales representative account.");
        toast.error("Account Creation Failed", {
          description: res.error || "Could not complete account provisioning.",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred during account creation.";
      setError(msg);
      toast.error("Error", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-border bg-surface sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-4" />
            </span>
            <DialogTitle className="text-[17px] font-bold text-foreground">Add Sales Representative</DialogTitle>
          </div>
          <DialogDescription className="text-[12.5px] text-muted-foreground">
            Create a genuine salesperson account connected to Firebase Authentication and the CRM team registry.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12.5px] text-destructive font-medium animate-rise">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Full Name */}
          <div>
            <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="text"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kavya Reddy"
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Work Email <span className="text-destructive">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kavya@syntraxs.com"
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Initial Password */}
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Initial Password <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-8 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="tel"
                  disabled={loading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Department */}
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Department
              </label>
              <div className="relative flex items-center">
                <Building className="absolute left-3 size-4 text-muted-foreground" />
                <select
                  disabled={loading}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
                >
                  <option value="Sales">Sales</option>
                  <option value="Enterprise Sales">Enterprise Sales</option>
                  <option value="Inside Sales">Inside Sales</option>
                  <option value="Business Development">Business Development</option>
                </select>
              </div>
            </div>

            {/* Monthly Target Quota */}
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly Quota (₹)
              </label>
              <div className="relative flex items-center">
                <Target className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="number"
                  disabled={loading}
                  value={targetQuota}
                  onChange={(e) => setTargetQuota(e.target.value)}
                  placeholder="1500000"
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
              <div className="mt-0.5 text-right text-[11px] font-medium text-muted-foreground">
                {inr(Number(targetQuota) || 0)}
              </div>
            </div>
          </div>

          {/* Role Enforcement Notice */}
          <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-[12px] text-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span>
              Role is restricted to <strong>Sales Representative</strong>. The salesperson will have access to their assigned pipeline, follow-ups, and quota cockpit.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Provisioning Account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  <span>Create Salesperson</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
