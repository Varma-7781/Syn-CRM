import { describe, it, expect } from 'vitest';
import { loginUser, findUserByEmail } from './authService';

describe('Strict Enterprise Authentication', () => {
  it('authenticates valid admin credentials', async () => {
    const user = await loginUser('admin@syntraxs.com', 'password123');
    expect(user).toBeDefined();
    expect(user.email).toBe('admin@syntraxs.com');
    expect(user.role).toBe('admin');
  }, 15000);

  it('authenticates valid sales credentials', async () => {
    const user = await loginUser('sales@syntraxs.com', 'password123');
    expect(user).toBeDefined();
    expect(user.email).toBe('sales@syntraxs.com');
    expect(user.role).toBe('sales');
  }, 15000);

  it('strictly rejects incorrect password', async () => {
    await expect(loginUser('admin@syntraxs.com', 'wrongpassword')).rejects.toThrow(
      'Invalid email or password'
    );
  }, 15000);

  it('strictly rejects non-existent fake email and does not create user in Firestore', async () => {
    const fakeEmail = 'unauthorized_hacker_' + Date.now() + '@example.com';
    await expect(loginUser(fakeEmail, 'password123')).rejects.toThrow();

    // Verify user was NOT created in Firestore
    const userInDb = await findUserByEmail(fakeEmail);
    expect(userInDb).toBeNull();
  }, 15000);
});
