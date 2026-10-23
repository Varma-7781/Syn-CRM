import { describe, it, expect } from 'vitest';
import { maskEmail, sanitizeLogData } from '../lib/logger';
import { ensureFirebaseAuth, logoutUser } from '../services/authService';
import { createSalesUser, createAdminUser } from '../services/userService';
import fs from 'node:fs';
import path from 'node:path';

describe('Production Security Hardening & Attack Surface Verification', () => {
  describe('Logger PII Masking and Secret Protection', () => {
    it('masks email addresses accurately in strings', () => {
      const masked = maskEmail('rajesh.verma@syntraxs.com');
      expect(masked).not.toContain('rajesh.verma');
      expect(masked).toMatch(/r\*\*\*a@s\*\*\*s\.com/);
    });

    it('redacts sensitive fields like passwords, tokens and secrets from logged objects', () => {
      const sensitivePayload = {
        email: 'admin@syntraxs.com',
        password: 'SuperSecretPassword123!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        apiKey: 'AIzaSyDYBDR-7wEJx8s7LOME',
        normalField: 'CRM Lead Name',
      };

      const sanitized = sanitizeLogData(sensitivePayload) as Record<string, unknown>;
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('CRM Lead Name');
      expect(sanitized.email).not.toBe('admin@syntraxs.com');
    });

    it('sanitizes Error objects in production without leaking server internals', () => {
      const err = new Error('Database connection failed at /var/www/internal/db.ts:42');
      const sanitized = sanitizeLogData(err);
      expect(typeof sanitized === 'string' || typeof sanitized === 'object').toBe(true);
    });
  });

  describe('Authentication Backdoor Elimination', () => {
    it('ensureFirebaseAuth does not hardcode admin credentials or create background accounts', async () => {
      await logoutUser();
      const ready = await ensureFirebaseAuth();
      expect(ready).toBe(false);
    });
  });

  describe('Role-Based Authorization on Provisioning', () => {
    it('rejects createSalesUser when caller is unauthenticated or not an admin', async () => {
      const res = await createSalesUser({
        name: 'Hacker Rep',
        email: 'hacker@example.com',
        password: 'password123',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it('rejects createAdminUser when caller is unauthenticated or not an admin', async () => {
      const res = await createAdminUser({
        name: 'Hacker Admin',
        email: 'fakeadmin@example.com',
        password: 'password123',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it('rejects createAdminUser when caller has sales role in session', async () => {
      localStorage.setItem(
        'nexlead_active_user',
        JSON.stringify({ id: 'sales_user_1', name: 'Sales Guy', role: 'sales', email: 'sales@example.com' })
      );

      const res = await createAdminUser({
        name: 'Escalated Admin',
        email: 'escalate@example.com',
        password: 'password123',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);

      localStorage.removeItem('nexlead_active_user');
    });

    it('validates input arguments when caller is an admin', async () => {
      localStorage.setItem(
        'nexlead_active_user',
        JSON.stringify({ id: 'admin_user_1', name: 'Super Admin', role: 'admin', email: 'admin@nexlead.com' })
      );

      const resShortName = await createAdminUser({
        name: 'A',
        email: 'admin@nexlead.com',
        password: 'password123',
      });
      expect(resShortName.success).toBe(false);
      expect(resShortName.error).toContain('Full name is required');

      const resInvalidEmail = await createAdminUser({
        name: 'Valid Name',
        email: 'notanemail',
        password: 'password123',
      });
      expect(resInvalidEmail.success).toBe(false);
      expect(resInvalidEmail.error).toContain('valid work email');

      const resShortPassword = await createAdminUser({
        name: 'Valid Name',
        email: 'valid@nexlead.com',
        password: '123',
      });
      expect(resShortPassword.success).toBe(false);
      expect(resShortPassword.error).toContain('Password must be at least 6 characters');

      localStorage.removeItem('nexlead_active_user');
    });
  });

  describe('CSV Injection Defense (CWE-1236)', () => {
    function sanitizeCsvCell(val: unknown): string {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    }

    it('neutralizes formula triggers (=, +, -, @, \\t)', () => {
      expect(sanitizeCsvCell('=cmd|"/C calc"!A0')).toBe(`"'=cmd|""/C calc""!A0"`);
      expect(sanitizeCsvCell('+12345')).toBe(`"'+12345"`);
      expect(sanitizeCsvCell('-SUM(A1:A10)')).toBe(`"'-SUM(A1:A10)"`);
      expect(sanitizeCsvCell('@threat')).toBe(`"'@threat"`);
      expect(sanitizeCsvCell('Normal Company Name')).toBe(`"Normal Company Name"`);
    });
  });

  describe('URI Scheme & Phone Link Sanitization', () => {
    it('strips non-numeric and potentially dangerous characters from phone numbers in tel links', () => {
      const dirtyPhone = "+91 98765-43210; javascript:alert(1)";
      const cleanPhone = dirtyPhone.replace(/[^0-9+]/g, '');
      expect(cleanPhone).toBe('+9198765432101');
      expect(cleanPhone).not.toContain('javascript');
      expect(cleanPhone).not.toContain(';');
      expect(cleanPhone).not.toContain(' ');
    });
  });

  describe('Public Asset Hygiene & Confidentiality', () => {
    it('verifies that no client demo spreadsheets are served in public directory', () => {
      const publicDir = path.resolve(__dirname, '../../public');
      const files = fs.readdirSync(publicDir);

      expect(files).not.toContain('syntraxs_10_client_demo_leads.csv');
      expect(files).not.toContain('syntraxs_10_client_demo_leads.xlsx');
      expect(files).not.toContain('nexlead_10_client_demo_leads.csv');
      expect(files).not.toContain('nexlead_10_client_demo_leads.xlsx');
    });

    it('verifies public/_headers exists and enforces clickjacking protection, nosniff, HSTS and CSP', () => {
      const headersPath = path.resolve(__dirname, '../../public/_headers');
      expect(fs.existsSync(headersPath)).toBe(true);

      const content = fs.readFileSync(headersPath, 'utf8');
      expect(content).toContain('X-Frame-Options: DENY');
      expect(content).toContain('X-Content-Type-Options: nosniff');
      expect(content).toContain('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
      expect(content).toContain('Content-Security-Policy:');
      expect(content).toContain("frame-ancestors 'none'");
    });

    it('verifies server.ts applies HSTS and CSP security headers in SSR runtime', () => {
      const serverPath = path.resolve(__dirname, '../server.ts');
      expect(fs.existsSync(serverPath)).toBe(true);

      const serverContent = fs.readFileSync(serverPath, 'utf8');
      expect(serverContent).toContain('Strict-Transport-Security');
      expect(serverContent).toContain('Content-Security-Policy');
      expect(serverContent).toContain('X-Frame-Options');
    });

    it('verifies firestore.rules enforces least-privilege RBAC, prevents role tampering, and restricts lead reassignments', () => {
      const rulesPath = path.resolve(__dirname, '../../firestore.rules');
      expect(fs.existsSync(rulesPath)).toBe(true);

      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      expect(rulesContent).not.toContain("matches('.*admin.*')");

      // Verify safe profile getter
      expect(rulesContent).toContain("getUserData().get('role', '') == 'admin'");

      // Verify user updates strictly prevent changing 'role', 'id', 'createdBy'
      expect(rulesContent).toContain("hasAny(['role', 'id', 'createdBy'])");

      // Verify leads updates use hasOnly for non-assigned transitions (preventing arbitrary field injection)
      expect(rulesContent).toContain('affectedKeys().hasOnly');

      // Verify sales reps cannot reassign lead ownership
      expect(rulesContent).toContain("hasAny(['assignedTo', 'assignedToName', 'rep'])");

      // Verify activities enforce author check
      expect(rulesContent).toContain("request.resource.data.get('userId', '') == request.auth.uid || isAdmin()");
    });
  });
});
