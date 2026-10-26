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
import { playNotificationSound } from '../utils/soundService';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

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
  interestedLeads: Lead[];
  login: (email: string, password?: string, preferredRole?: 'admin' | 'sales') => Promise<User | null>;
  logout: () => Promise<void>;
  addLead: (lead: Partial<Lead>) => Promise<string | null>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<boolean>;
  markLeadAsInterested: (leadId: string) => Promise<boolean>;
  deleteLead: (leadId: string) => Promise<boolean>;
  addTarget: (target: Omit<Target, 'id' | 'achieved'> & { achieved?: number }) => Promise<string | null>;
  updateTarget: (targetId: string, updates: Partial<Target>) => Promise<boolean>;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: string }) => Promise<string | null>;
  addUser: (user: Omit<User, 'id'>) => Promise<string | null>;
  createSalesRepresentative: (
    data: import('../types').CreateSalesRepresentativeInput
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  createAdminUser: (
    data: import('../types').CreateAdminInput
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  playNotificationSound: () => void;
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
  const isInitialLeadsLoadRef = useRef<boolean>(true);
  const previousLeadsStatusRef = useRef<Map<string, string>>(new Map());
  const sessionLoginTimeRef = useRef<number>(Date.now());

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
      isInitialLeadsLoadRef.current = true;
      previousLeadsStatusRef.current.clear();
      return;
    }

    // Reset initial load and record fresh session timestamp upon user login
    isInitialLeadsLoadRef.current = true;
    previousLeadsStatusRef.current.clear();
    sessionLoginTimeRef.current = Date.now();

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

      const handleLeadsSnapshot = (fetchedLeads: Lead[]) => {
        if (!cancelled) {
          const leadList = fetchedLeads || [];
          setLeads(leadList);
          setLoading(false);

          // Initial snapshot after login or page load:
          // Record current baseline statuses for all existing leads.
          // NEVER play sounds or show popups for old leads upon login or page refresh.
          if (isInitialLeadsLoadRef.current) {
            if (leadList.length > 0) {
              isInitialLeadsLoadRef.current = false;
              leadList.forEach((lead) => {
                previousLeadsStatusRef.current.set(lead.id, lead.status);
              });
            }
            return;
          }

          // Subsequent live real-time updates while Admin is actively logged in
          if (currentUser?.role === 'admin') {
            const liveInterestedEvents: Lead[] = [];

            leadList.forEach((lead) => {
              const prevStatus = previousLeadsStatusRef.current.get(lead.id);
              const isNowInterested = lead.status === 'interested';
              const isStatusTransition = isNowInterested && prevStatus !== 'interested';

              // Only trigger if this interest event happened during this active session (after login)
              const interestedTimestamp = lead.interestedAt ? new Date(lead.interestedAt).getTime() : 0;
              const isLiveEvent = interestedTimestamp > 0 && interestedTimestamp >= (sessionLoginTimeRef.current - 5000);

              if (isStatusTransition && isLiveEvent) {
                liveInterestedEvents.push(lead);
              }

              // Keep baseline status map updated
              previousLeadsStatusRef.current.set(lead.id, lead.status);
            });

            // Display notifications ONE AFTER ONE, each showing for 2.5s and disappearing cleanly!
            liveInterestedEvents.forEach((lead, idx) => {
              setTimeout(() => {
                const repName = lead.interestedByName || lead.rep || lead.assignedToName || 'Sales Representative';
                const compName = lead.companyName || lead.company || 'Unknown Client';
                const clientName = lead.contactName || lead.client || 'Contact';

                // 1. Play real-time notification sound chime
                playNotificationSound(0.5);

                // 2. High-visibility in-app toast (auto-dismisses cleanly in 2.5 seconds, includes X close)
                toast.success(`💡 Client Interested: ${compName}`, {
                  description: `${repName} marked ${clientName} (${compName}) as Interested!`,
                  duration: 2500,
                });

                // 3. Desktop browser notification (PII sanitized - phone numbers excluded)
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  try {
                    const n = new Notification(`💡 Client Interested: ${compName}`, {
                      body: `${repName} marked ${clientName} (${compName}) as Interested!`,
                      icon: '/favicon.png',
                      tag: `interest-${lead.id}-${Date.now()}`,
                    });
                    n.onclick = () => window.focus();
                  } catch {}
                }
              }, idx * 2800); // 2.8s apart: one after one!
            });
          } else {
            leadList.forEach((lead) => {
              previousLeadsStatusRef.current.set(lead.id, lead.status);
            });
          }
        }
      };

      // Real-time synchronization for all authenticated CRM users:
      unsubLeads = leadService.subscribeToLeads(handleLeadsSnapshot);

      unsubUsers = userService.subscribeToUsers((fetchedUsers) => {
        if (!cancelled) {
          const userList = fetchedUsers || [];
          setUsers(userList);

          // Auto-sync current user profile if stale or role was changed in Firestore
          setCurrentUser((prevUser) => {
            if (!prevUser) return prevUser;
            const liveMatch = userList.find(
              (u) =>
                u.id === prevUser.id ||
                (u.email && prevUser.email && u.email.toLowerCase() === prevUser.email.toLowerCase())
            );
            if (liveMatch && (liveMatch.role !== prevUser.role || liveMatch.name !== prevUser.name)) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('nexlead_active_user', JSON.stringify(liveMatch));
                localStorage.setItem('syntraxs_active_user', JSON.stringify(liveMatch));
              }
              return liveMatch;
            }
            return prevUser;
          });
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

    // Verify Firebase Auth session before attaching Firestore listeners
    authService
      .ensureFirebaseAuth()
      .then((ready) => {
        if (!cancelled && ready) {
          startSubscriptions();
        } else if (!cancelled) {
          setLoading(false);
        }
      })
      .catch(() => {
        logger.error('[CRM] Authentication session check failed before subscribing');
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

  // Interested leads ordered by most recently marked
  const interestedLeads = useMemo(() => {
    return leads
      .filter((l) => l.status === 'interested')
      .sort((a, b) => {
        const timeA = a.interestedAt ? new Date(a.interestedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.interestedAt ? new Date(b.interestedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
  }, [leads]);

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
                body: `Scheduled in ${minutesRemaining}m with ${lead.contactName || lead.client}`,
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
    try {
      const user = await authService.loginUser(email, password, preferredRole);
      if (user) {
        setCurrentUser(user);
      }
      return user;
    } finally {
      setLoading(false);
    }
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

  const markLeadAsInterested = useCallback(
    async (leadId: string) => {
      const targetLead = leads.find((l) => l.id === leadId);
      const repName = currentUser?.name || 'Sales Rep';
      const nowIso = new Date().toISOString();

      const ok = await leadService.updateLead(leadId, {
        status: 'interested',
        interestedAt: nowIso,
        interestedBy: currentUser?.id || 'sales',
        interestedByName: repName,
        lastContact: nowIso,
      });

      if (ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? leadService.normalizeLead({
                  ...l,
                  status: 'interested',
                  interestedAt: nowIso,
                  interestedBy: currentUser?.id || 'sales',
                  interestedByName: repName,
                  lastContact: nowIso,
                })
              : l
          )
        );

        if (targetLead) {
          const comp = targetLead.companyName || targetLead.company || 'Unknown Client';
          const client = targetLead.contactName || targetLead.client || 'Client';
          await activityService.addActivity({
            leadId,
            userId: currentUser?.id || 'sales',
            userName: repName,
            companyName: comp,
            type: 'note',
            description: `${repName} marked client ${client} (${comp}) as Interested`,
            what: 'Marked as Interested',
          });
        }
        toast.success(`Marked as Interested! Admin has been notified.`);
      } else {
        toast.error('Failed to update lead to interested.');
      }
      return ok;
    },
    [leads, currentUser]
  );

  const createSalesRepresentative = useCallback(
    async (data: import('../types').CreateSalesRepresentativeInput) => {
      const res = await userService.createSalesUser(data);
      return res;
    },
    []
  );

  const createAdminUser = useCallback(
    async (data: import('../types').CreateAdminInput) => {
      const res = await userService.createAdminUser(data);
      return res;
    },
    []
  );

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
      interestedLeads,
      login,
      logout,
      addLead,
      updateLead,
      markLeadAsInterested,
      deleteLead,
      addTarget,
      updateTarget,
      addActivity,
      addUser,
      createSalesRepresentative,
      createAdminUser,
      playNotificationSound: () => playNotificationSound(0.5),
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
      interestedLeads,
      login,
      logout,
      addLead,
      updateLead,
      markLeadAsInterested,
      deleteLead,
      addTarget,
      updateTarget,
      addActivity,
      addUser,
      createSalesRepresentative,
      createAdminUser,
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
