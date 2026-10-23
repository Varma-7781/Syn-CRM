import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AddAdminDialog } from '../components/crm/AddAdminDialog';

// Mock CRM Context
const mockCreateAdminUser = vi.fn();
vi.mock('@/context/CRMContext', () => ({
  useCRM: () => ({
    createAdminUser: mockCreateAdminUser,
  }),
}));

describe('AddAdminDialog Component', () => {
  it('renders all form fields when dialog is open', () => {
    render(<AddAdminDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Add Administrator')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Priya Sundaram')).toBeDefined();
    expect(screen.getByPlaceholderText('priya@nexlead.com')).toBeDefined();
    expect(screen.getByPlaceholderText('Min 6 characters')).toBeDefined();
    expect(screen.getByPlaceholderText('Re-enter password')).toBeDefined();
    expect(screen.getByText('Create Administrator')).toBeDefined();
  });

  it('validates password mismatch before calling createAdminUser', async () => {
    render(<AddAdminDialog open={true} onOpenChange={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('e.g. Priya Sundaram');
    const emailInput = screen.getByPlaceholderText('priya@nexlead.com');
    const pwInput = screen.getByPlaceholderText('Min 6 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter password');
    const submitBtn = screen.getByText('Create Administrator');

    fireEvent.change(nameInput, { target: { value: 'Priya Sundaram' } });
    fireEvent.change(emailInput, { target: { value: 'priya@nexlead.com' } });
    fireEvent.change(pwInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'differentpassword' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeDefined();
    });

    expect(mockCreateAdminUser).not.toHaveBeenCalled();
  });

  it('calls createAdminUser when form inputs are valid and match', async () => {
    mockCreateAdminUser.mockResolvedValueOnce({ success: true });
    const onOpenChange = vi.fn();

    render(<AddAdminDialog open={true} onOpenChange={onOpenChange} />);

    const nameInput = screen.getByPlaceholderText('e.g. Priya Sundaram');
    const emailInput = screen.getByPlaceholderText('priya@nexlead.com');
    const pwInput = screen.getByPlaceholderText('Min 6 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter password');
    const submitBtn = screen.getByText('Create Administrator');

    fireEvent.change(nameInput, { target: { value: 'Priya Sundaram' } });
    fireEvent.change(emailInput, { target: { value: 'priya@nexlead.com' } });
    fireEvent.change(pwInput, { target: { value: 'securePass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'securePass123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAdminUser).toHaveBeenCalledWith({
        name: 'Priya Sundaram',
        email: 'priya@nexlead.com',
        password: 'securePass123!',
        phone: '',
        department: 'Management',
      });
    });
  });
});
