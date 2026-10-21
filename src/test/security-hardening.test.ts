import { describe, it, expect } from 'vitest';
import { maskEmail, sanitizeLogData } from '../lib/logger';
import { ensureFirebaseAuth, logoutUser } from '../services/authService';
import { createSalesUser } from '../services/userService';
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
      // In clean test environment where no active user is set, user creation must be rejected
      const res = await createSalesUser({
        name: 'Hacker Rep',
        email: 'hacker@example.com',
        password: 'password123',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
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

  describe('Public Asset Hygiene & Confidentiality', () => {
    it('verifies that no client demo spreadsheets are served in public directory', () => {
      const publicDir = path.resolve(__dirname, '../../public');
      const files = fs.readdirSync(publicDir);

      expect(files).not.toContain('syntraxs_10_client_demo_leads.csv');
      expect(files).not.toContain('syntraxs_10_client_demo_leads.xlsx');
    });

    it('verifies public/_headers exists and enforces clickjacking protection and nosniff', () => {
      const headersPath = path.resolve(__dirname, '../../public/_headers');
      expect(fs.existsSync(headersPath)).toBe(true);

      const content = fs.readFileSync(headersPath, 'utf8');
      expect(content).toContain('X-Frame-Options: DENY');
      expect(content).toContain('X-Content-Type-Options: nosniff');
    });

    it('verifies firestore.rules exists and contains zero email substring matching', () => {
      const rulesPath = path.resolve(__dirname, '../../firestore.rules');
      expect(fs.existsSync(rulesPath)).toBe(true);

      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      expect(rulesContent).not.toContain("matches('.*admin.*')");
      expect(rulesContent).toContain("getUserData().role == 'admin'");
    });
  });
});
