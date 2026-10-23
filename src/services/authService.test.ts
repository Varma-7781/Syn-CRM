import { describe, it, expect } from 'vitest';
import { loginUser, findUserByEmail, resetPassword } from './authService';

describe('Strict Enterprise Authentication', () => {
  it('authenticates valid admin credentials', async () => {
    const user = await loginUser('admin1@nexlead.com', 'Admin1@NexLead2026');
    expect(user).toBeDefined();
    expect(user.email).toBe('admin1@nexlead.com');
    expect(user.role).toBe('admin');
  }, 15000);

  it('authenticates valid sales credentials', async () => {
    const user = await loginUser('rajesh@nexlead.com', 'Rajesh@NexLead2026');
    expect(user).toBeDefined();
    expect(user.email).toBe('rajesh@nexlead.com');
    expect(user.role).toBe('sales');
  }, 15000);

  it('strictly rejects incorrect password', async () => {
    await expect(loginUser('admin1@nexlead.com', 'wrongpassword')).rejects.toThrow(
      'Invalid email or password'
    );
  }, 15000);

  it('strictly rejects old removed accounts', async () => {
    await expect(loginUser('admin@syntraxs.com', 'password123')).rejects.toThrow();
    await expect(loginUser('sales@syntraxs.com', 'password123')).rejects.toThrow();
  }, 15000);

  it('strictly rejects non-existent fake email and does not create user in Firestore', async () => {
    const fakeEmail = 'unauthorized_hacker_' + Date.now() + '@example.com';
    await expect(loginUser(fakeEmail, 'password123')).rejects.toThrow();

    // Verify user was NOT created in Firestore
    const userInDb = await findUserByEmail(fakeEmail);
    expect(userInDb).toBeNull();
  }, 15000);

  it('validates email address before attempting password reset', async () => {
    await expect(resetPassword('')).rejects.toThrow('Please enter your work email');
  });
});
