import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAdminUser, createSalesUser } from '../services/userService';
import { STORAGE_KEY } from '../services/authService';

describe('Admin Account Creation & Enterprise Security Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Session Preservation Verification (Requirement 4)', () => {
    it('guarantees active administrator session is completely preserved and untouched in localStorage', async () => {
      // Simulate currently signed-in Admin session
      const existingAdmin = {
        id: 'admin_master_123',
        name: 'Master Admin',
        email: 'master.admin@nexlead.com',
        role: 'admin',
        department: 'Management',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingAdmin));

      // Attempt to create a new administrator
      const res = await createAdminUser({
        name: 'New Branch Admin',
        email: 'branch.admin@nexlead.com',
        password: 'password123',
        department: 'Executive Leadership',
      });

      // Session in localStorage MUST still be the existing administrator!
      const activeRaw = localStorage.getItem(STORAGE_KEY);
      expect(activeRaw).not.toBeNull();
      const activeParsed = JSON.parse(activeRaw!);
      expect(activeParsed.id).toBe('admin_master_123');
      expect(activeParsed.email).toBe('master.admin@nexlead.com');
      expect(activeParsed.role).toBe('admin');
    });
  });

  describe('Form Validation & Error Handling (Requirement 2 & 8)', () => {
    beforeEach(() => {
      // Set authorized admin session
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: 'admin_test',
          name: 'Authorized Admin',
          email: 'admin@nexlead.com',
          role: 'admin',
        })
      );
    });

    it('rejects missing or too short full name (< 2 chars)', async () => {
      const resEmpty = await createAdminUser({
        name: '',
        email: 'test@nexlead.com',
        password: 'password123',
      });
      expect(resEmpty.success).toBe(false);
      expect(resEmpty.error).toMatch(/Full name is required/i);

      const resSingleChar = await createAdminUser({
        name: 'A',
        email: 'test@nexlead.com',
        password: 'password123',
      });
      expect(resSingleChar.success).toBe(false);
      expect(resSingleChar.error).toMatch(/at least 2 characters/i);
    });

    it('rejects invalid email formatting', async () => {
      const invalidEmails = ['plainaddress', '@missingusername.com', 'user@domain'];
      for (const email of invalidEmails) {
        const res = await createAdminUser({
          name: 'Priya Sundaram',
          email,
          password: 'password123',
        });
        expect(res.success).toBe(false);
        expect(res.error).toMatch(/valid.*email|invalid.*email/i);
      }
    });

    it('rejects short passwords (< 6 characters)', async () => {
      const res = await createAdminUser({
        name: 'Priya Sundaram',
        email: 'priya@nexlead.com',
        password: '12345',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/at least 6 characters/i);
    });
  });

  describe('Access Control & Privilege Escalation Prevention (Requirement 5)', () => {
    it('prevents an unauthenticated visitor from provisioning an admin account', async () => {
      localStorage.removeItem(STORAGE_KEY);
      const res = await createAdminUser({
        name: 'Rogue Admin',
        email: 'rogue@attack.com',
        password: 'password123',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized/i);
    });

    it('prevents a sales representative from creating an administrator account', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: 'sales_rep_456',
          name: 'Sales Rep 1',
          email: 'sales1@nexlead.com',
          role: 'sales',
        })
      );

      const res = await createAdminUser({
        name: 'Self Escalated Admin',
        email: 'escalation@nexlead.com',
        password: 'password123',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized: Only CRM administrators can create administrator accounts/i);
    });

    it('prevents sales users from creating sales reps as well', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: 'sales_rep_456',
          name: 'Sales Rep 1',
          email: 'sales1@nexlead.com',
          role: 'sales',
        })
      );

      const res = await createSalesUser({
        name: 'Another Rep',
        email: 'another@nexlead.com',
        password: 'password123',
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized: Only CRM administrators can create sales representatives/i);
    });
  });
});
