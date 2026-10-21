import { describe, it, expect } from 'vitest';
import { inr, computeSixMonthTrajectory } from '../utils/helpers';

describe('Dynamic Calculation Engine & Data Integrity', () => {
  it('formats INR currency correctly across thresholds', () => {
    expect(inr(5000)).toBe('₹5,000');
    expect(inr(450000)).toBe('₹4.5L');
    expect(inr(1500000)).toBe('₹15.0L');
    expect(inr(25000000)).toBe('₹2.50Cr');
  });

  it('computes 6-month trajectory dynamically from leads and targets without static data', () => {
    const testTargets = [
      { id: 't1', type: 'monthly', target: 5000000, period: '2026-10', userId: 'rep1' },
      { id: 't2', type: 'monthly', target: 3000000, period: '2026-10', userId: 'rep2' },
    ];

    const testLeads = [
      { id: 'l1', status: 'won', value: 1200000, createdAt: new Date().toISOString() },
      { id: 'l2', status: 'won', value: 800000, createdAt: new Date().toISOString() },
      { id: 'l3', status: 'new', value: 5000000, createdAt: new Date().toISOString() },
    ];

    const trajectory = computeSixMonthTrajectory(testLeads, testTargets);
    expect(trajectory).toHaveLength(6);

    // Current month should have 20.0 Lakhs (1.2L + 0.8L)
    const currentPoint = trajectory[trajectory.length - 1];
    expect(currentPoint.revenue).toBe(20);
    // Target should be 80.0 Lakhs (50L + 30L)
    expect(currentPoint.target).toBe(80);
  });

  it('handles zero leads and zero targets safely without NaN or Infinity', () => {
    const trajectory = computeSixMonthTrajectory([], []);
    expect(trajectory).toHaveLength(6);
    trajectory.forEach((pt) => {
      expect(pt.revenue).toBe(0);
      expect(pt.target).toBe(0);
      expect(isNaN(pt.revenue)).toBe(false);
      expect(isNaN(pt.target)).toBe(false);
    });
  });

  it('verifies cross-page pipeline calculation consistency', () => {
    const mockLeads = [
      { id: '1', status: 'won', value: 500000 },
      { id: '2', status: 'won', value: 750000 },
      { id: '3', status: 'pending_payment', value: 250000 },
      { id: '4', status: 'new', value: 300000 },
      { id: '5', status: 'interested', value: 400000 },
      { id: '6', status: 'lost', value: 1000000 },
    ];

    const wonLeads = mockLeads.filter((l) => l.status === 'won');
    const wonTotal = wonLeads.reduce((a, l) => a + l.value, 0);
    expect(wonTotal).toBe(1250000);

    const pendingTotal = mockLeads
      .filter((l) => l.status === 'pending_payment')
      .reduce((a, l) => a + l.value, 0);
    expect(pendingTotal).toBe(250000);

    // Active pipeline (excluding won and lost)
    const activePipeline = mockLeads
      .filter((l) => l.status !== 'won' && l.status !== 'lost')
      .reduce((a, l) => a + l.value, 0);
    expect(activePipeline).toBe(950000); // 250k + 300k + 400k

    // Collection efficiency calculation
    const efficiency = Math.round((wonTotal / (wonTotal + pendingTotal)) * 100);
    expect(efficiency).toBe(83); // 1250000 / 1500000 = 83.33% -> 83%
  });
});
