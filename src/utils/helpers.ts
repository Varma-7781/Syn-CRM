export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    new: 'bg-blue-500',
    contacted: 'bg-yellow-500',
    qualified: 'bg-orange-500',
    proposal: 'bg-purple-500',
    negotiation: 'bg-indigo-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
    dnp: 'bg-gray-600',
  };
  return colors[status] || 'bg-gray-500';
};

export const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not set';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const getCurrentPeriod = (type: 'weekly' | 'monthly'): string => {
  const now = new Date();

  if (type === 'monthly') {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } else {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }
};

export const inr = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)}Cr`
    : n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${n.toLocaleString('en-IN')}`;

export interface TrajectoryPoint {
  m: string;
  revenue: number;
  target: number;
}

/**
 * Computes live 6-month revenue and target trajectory from actual leads and targets
 */
export const computeSixMonthTrajectory = (
  leads: any[],
  targets: any[]
): TrajectoryPoint[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0-based
  const currentYear = now.getFullYear();

  // Generate last 6 months in chronological order
  const last6Months: { name: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonthIdx - i, 1);
    last6Months.push({
      name: monthNames[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }

  // Calculate total monthly target in Lakhs
  const monthlyTargetSum = targets
    .filter((t) => t.type === 'monthly')
    .reduce((acc, t) => acc + (Number(t.target) || 0), 0);
  const targetLakhs = monthlyTargetSum > 0
    ? Math.round((monthlyTargetSum / 100000) * 10) / 10
    : 0;

  return last6Months.map(({ name, year, month }) => {
    // Sum all won leads in this month
    const wonInMonth = leads.filter((l) => {
      if (l.status !== 'won') return false;
      const rawDate = l.createdAt || l.date;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month;
    });

    const totalWon = wonInMonth.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
    const revenueLakhs = Math.round((totalWon / 100000) * 10) / 10;

    return {
      m: name,
      revenue: revenueLakhs,
      target: targetLakhs,
    };
  });
};
