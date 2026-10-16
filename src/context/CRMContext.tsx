/**
 * CRM Data & Authentication Context
 * Connects Lovable UI to Real Firestore and Firebase Auth
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Lead, User, Target, Activity } from '../types';
import * as authService from '../services/authService';
import * as leadService from '../services/leadService';
import * as userService from '../services/userService';
import * as targetService from '../services/targetService';
import * as activityService from '../services/activityService';
import { isFirebaseEnabled } from '../config/firebase';
import { FollowUpReminderPopup } from '../components/crm/FollowUpReminderPopup';
import { toast } from 'sonner';

interface UpcomingFollowUp {
  lead: Lead;
  minutesRemaining: number;
}

interface OverdueFollowUp {
  lead: Lead;
  reason: 'dismissed' | 'no_action';
}

interface CRMContextType {
  currentUser: User | null;
  leads: Lead[];
  users: User[];
  targets: Target[];
  activities: Activity[];
  loading: boolean;
  upcomingFollowUps: UpcomingFollowUp[];
  overdueFollowUps: OverdueFollowUp[];
  login: (email: string, password?: string, preferredRole?: 'admin' | 'sales') => Promise<User | null>;
  logout: () => Promise<void>;
  addLead: (lead: Partial<Lead>) => Promise<string | null>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<boolean>;
  deleteLead: (leadId: string) => Promise<boolean>;
  addTarget: (target: Omit<Target, 'id' | 'achieved'> & { achieved?: number }) => Promise<string | null>;
  updateTarget: (targetId: string, updates: Partial<Target>) => Promise<boolean>;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: string }) => Promise<string | null>;
  addUser: (user: Omit<User, 'id'>) => Promise<string | null>;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getActiveUser());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !!authService.getActiveUser());

  const [activeReminder, setActiveReminder] = useState<UpcomingFollowUp | null>(null);
  const remindedLeads = useRef<Set<string>>(new Set());
  const notificationInterval = useRef<any>(null);

  // Sync session on mount
  useEffect(() => {
    const active = authService.getActiveUser();
    if (active) {
      setCurrentUser(active);
    }
  }, []);

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Real-time Firestore subscriptions tied strictly to authenticated user lifecycle
  useEffect(() => {
    // If not authenticated, do not attach protected Firestore listeners
    if (!currentUser) {
      setLeads([]);
      setUsers([]);
      setTargets([]);
      setActivities([]);
      setLoading(false);
      return;
    }

    if (!isFirebaseEnabled()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubLeads: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubTargets: () => void = () => {};
    let unsubActivities: () => void = () => {};
    let cancelled = false;

    const startSubscriptions = () => {
      if (cancelled) return;

      unsubLeads = leadService.subscribeToLeads((fetchedLeads) => {
        if (!cancelled) {
          setLeads(fetchedLeads || []);
          setLoading(false);
        }
      });

      unsubUsers = userService.subscribeToUsers((fetchedUsers) => {
        if (!cancelled) {
          setUsers(fetchedUsers || []);
        }
      });

      unsubTargets = targetService.subscribeToTargets((fetchedTargets) => {
        if (!cancelled) {
          setTargets(fetchedTargets || []);
        }
      });

      unsubActivities = activityService.subscribeToActivities((fetchedActs) => {
        if (!cancelled) {
          setActivities(fetchedActs || []);
        }
      });
    };

    // Ensure Firebase Auth session is verified before attaching Firestore listeners
    authService
      .ensureFirebaseAuth()
      .then((ready) => {
        if (!cancelled && ready) {
          startSubscriptions();
        } else if (!cancelled) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('❌ [CRM] Authentication failed before subscribing:', err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubLeads();
      unsubUsers();
      unsubTargets();
      unsubActivities();
    };
  }, [currentUser]);

  // Relevant leads for current user follow-up notifications
  const relevantLeads = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return leads;
    return leads.filter(
      (l) => l.assignedTo === currentUser.id || l.rep === currentUser.name || l.assignedToName === currentUser.name
    );
  }, [leads, currentUser]);

  // Upcoming follow-ups (within 5 minutes)
  const upcomingFollowUps = useMemo(() => {
    const now = new Date();
    const FIVE_MINUTES = 5 * 60 * 1000;
    const upcoming: UpcomingFollowUp[] = [];

    relevantLeads.forEach((lead) => {
      if (!lead.nextFollowUp) return;
      if (lead.followUpStatus === 'completed' || lead.followUpStatus === 'overdue') return;

      const followUpTime = new Date(lead.nextFollowUp);
      const diff = followUpTime.getTime() - now.getTime();

      if (diff > 0 && diff <= FIVE_MINUTES) {
        const minutesRemaining = Math.max(1, Math.ceil(diff / 60000));
        upcoming.push({ lead, minutesRemaining });
      }
    });

    return upcoming.sort((a, b) => a.minutesRemaining - b.minutesRemaining);
  }, [relevantLeads]);

  // Overdue follow-ups
  const overdueFollowUps = useMemo(() => {
    const overdue: OverdueFollowUp[] = [];
    relevantLeads.forEach((lead) => {
      if (lead.followUpStatus === 'overdue' && lead.followUpOverdueReason) {
        overdue.push({ lead, reason: lead.followUpOverdueReason });
      }
    });
    return overdue;
  }, [relevantLeads]);

  // Follow-up polling engine (every 10 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const checkFollowUps = () => {
      const now = new Date();
      const FIVE_MINUTES = 5 * 60 * 1000;

      relevantLeads.forEach((lead) => {
        if (!lead.nextFollowUp) return;
        if (
          lead.followUpStatus === 'reminded' ||
          lead.followUpStatus === 'completed' ||
          lead.followUpStatus === 'overdue'
        ) {
          return;
        }

        const followUpTime = new Date(lead.nextFollowUp);
        const diff = followUpTime.getTime() - now.getTime();

        if (diff > 0 && diff <= FIVE_MINUTES && !remindedLeads.current.has(lead.id)) {
          const minutesRemaining = Math.max(1, Math.ceil(diff / 60000));

          leadService.updateLead(lead.id, {
            followUpStatus: 'reminded',
            followUpRemindedAt: new Date().toISOString(),
          });

          setActiveReminder({ lead, minutesRemaining });

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const n = new Notification(`🔔 Follow-up: ${lead.companyName || lead.company}`, {
                body: `Scheduled in ${minutesRemaining}m with ${lead.contactName || lead.client} (${lead.phone})`,
                icon: '/favicon.png',
                tag: `followup-${lead.id}`,
              });
              n.onclick = () => window.focus();
            } catch {}
          }

          remindedLeads.current.add(lead.id);
        }
      });
    };

    checkFollowUps();
    notificationInterval.current = setInterval(checkFollowUps, 10000);

    return () => {
      if (notificationInterval.current) clearInterval(notificationInterval.current);
    };
  }, [relevantLeads, currentUser]);

  // Reminder Actions
  const handleCalled = useCallback(async () => {
    if (!activeReminder) return;
    const { lead } = activeReminder;
    await leadService.updateLead(lead.id, {
      followUpStatus: 'completed',
      followUpCompletedAt: new Date().toISOString(),
    });
    setActiveReminder(null);
    toast.success('Follow-up marked as completed');
  }, [activeReminder]);

  const handleDismiss = useCallback(async () => {
    if (!activeReminder) return;
    const { lead } = activeReminder;
    await leadService.updateLead(lead.id, {
      followUpStatus: 'overdue',
      followUpOverdueReason: 'dismissed',
    });
    setActiveReminder(null);
    toast.warning('Follow-up marked as overdue (dismissed)');
  }, [activeReminder]);

  const handleAutoExpire = useCallback(async () => {
    if (!activeReminder) return;
    const { lead } = activeReminder;
    await leadService.updateLead(lead.id, {
      followUpStatus: 'overdue',
      followUpOverdueReason: 'no_action',
    });
    setActiveReminder(null);
    toast.error('Follow-up expired without action');
  }, [activeReminder]);

  // Context Actions
  const login = useCallback(async (email: string, password?: string, preferredRole?: 'admin' | 'sales') => {
    setLoading(true);
    const user = await authService.loginUser(email, password, preferredRole);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logoutUser();
    setCurrentUser(null);
    setLeads([]);
    setUsers([]);
    setTargets([]);
    setActivities([]);
    setLoading(false);
  }, []);

  const addLead = useCallback(async (leadData: Partial<Lead>) => {
    const res = await leadService.addLead(leadData);
    if (res) {
      toast.success('Lead created successfully');
    }
    return res;
  }, []);

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    const ok = await leadService.updateLead(leadId, updates);
    if (ok) {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? leadService.normalizeLead({ ...l, ...updates }) : l))
      );
    }
    return ok;
  }, []);

  const deleteLead = useCallback(async (leadId: string) => {
    const ok = await leadService.deleteLead(leadId);
    if (ok) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success('Lead deleted');
    }
    return ok;
  }, []);

  const addTarget = useCallback(async (data: Omit<Target, 'id' | 'achieved'> & { achieved?: number }) => {
    const res = await targetService.addTarget(data);
    if (res) toast.success('Target set successfully');
    return res;
  }, []);

  const updateTarget = useCallback(async (id: string, updates: Partial<Target>) => {
    const ok = await targetService.updateTarget(id, updates);
    if (ok) toast.success('Target updated');
    return ok;
  }, []);

  const addActivity = useCallback(async (data: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const res = await activityService.addActivity(data);
    if (res) toast.success('Activity logged');
    return res;
  }, []);

  const addUser = useCallback(async (data: Omit<User, 'id'>) => {
    const res = await userService.addUser(data);
    if (res) toast.success('User added successfully');
    return res;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      leads,
      users,
      targets,
      activities,
      loading,
      upcomingFollowUps,
      overdueFollowUps,
      login,
      logout,
      addLead,
      updateLead,
      deleteLead,
      addTarget,
      updateTarget,
      addActivity,
      addUser,
    }),
    [
      currentUser,
      leads,
      users,
      targets,
      activities,
      loading,
      upcomingFollowUps,
      overdueFollowUps,
      login,
      logout,
      addLead,
      updateLead,
      deleteLead,
      addTarget,
      updateTarget,
      addActivity,
      addUser,
    ]
  );

  return (
    <CRMContext.Provider value={value}>
      {children}
      {activeReminder && (
        <FollowUpReminderPopup
          lead={activeReminder.lead}
          minutesRemaining={activeReminder.minutesRemaining}
          onCalled={handleCalled}
          onDismiss={handleDismiss}
          onAutoExpire={handleAutoExpire}
        />
      )}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
