import React, { useState } from "react";
import { ShieldCheck, Mail, User, Lock, Phone, Building, Eye, EyeOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/context/CRMContext";
import { toast } from "sonner";

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAdminDialog({ open, onOpenChange }: AddAdminDialogProps) {
  const { createAdminUser } = useCRM();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Management");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setDepartment("Management");
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      setError("Please enter the administrator's full name (at least 2 characters).");
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
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your confirm password.");
      return;
    }

    setLoading(true);

    try {
      const res = await createAdminUser({
        name: cleanName,
        email: cleanEmail,
        password,
        phone: phone.trim(),
        department: department.trim() || "Management",
      });

      if (res.success) {
        toast.success(`Administrator account created for ${cleanName}!`, {
          description: `Firebase Authentication and Firestore profile initialized. ${cleanName} can now sign in with Admin privileges.`,
          duration: 4500,
        });
        resetForm();
        onOpenChange(false);
      } else {
        setError(res.error || "Failed to create administrator account.");
        toast.error("Account Creation Failed", {
          description: res.error || "Could not complete administrator provisioning.",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred during administrator account creation.";
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
              <ShieldCheck className="size-4" />
            </span>
            <DialogTitle className="text-[17px] font-bold text-foreground">Add Administrator</DialogTitle>
          </div>
          <DialogDescription className="text-[12.5px] text-muted-foreground">
            Create a genuine administrator account connected to Firebase Authentication with executive CRM permissions.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12.5px] text-destructive font-medium animate-rise">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5 pt-1">
          {/* Prevent browser password managers from auto-filling saved personal passwords */}
          <input type="text" name="fake_admin_username" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
          <input type="password" name="fake_admin_password" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />

          {/* Full Name */}
          <div>
            <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="text"
                name="admin_fullname"
                autoComplete="off"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sundaram"
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Work Email <span className="text-destructive">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="email"
                name="admin_work_email"
                autoComplete="off"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@nexlead.com"
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password */}
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="admin_initial_password"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="admin_confirm_password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-8 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
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
                  <option value="Management">Management</option>
                  <option value="Executive Leadership">Executive Leadership</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="System Administration">System Administration</option>
                </select>
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
                  name="admin_phone"
                  autoComplete="off"
                  disabled={loading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Role Enforcement Notice */}
          <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-[12px] text-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span>
              Role is granted as <strong>Administrator</strong>. The user will have full access to executive overviews, team performance, lead management, and CRM configurations.
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
                  <span>Provisioning Admin Account…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  <span>Create Administrator</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
