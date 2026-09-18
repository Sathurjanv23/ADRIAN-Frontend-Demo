'use client';

import { useEffect } from 'react';
import { useNovaStore } from '@/lib/store/nova-store';
import { fetchCurrentUser, getSession, getToken } from '@/lib/auth';

/**
 * AuthProvider — Mounts once in the layout and rehydrates the auth session
 * from localStorage so users stay logged in across page refreshes.
 * Also initiates authenticated live data polling.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, isAuthenticated, fetchAllData, addIncident, updateIncident } = useNovaStore();

  useEffect(() => {
    if (!isAuthenticated) {
      const session = getSession();
      const isVerified = session?.isVerified ?? (session as any)?.verified ?? (session?.status === 'ACTIVE');
      if (session && isVerified) {
        login({
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          status: session.status,
          approvalStatus: session.approvalStatus,
          rescueTeamId: session.rescueTeamId,
          language: session.language,
          createdAt: session.createdAt,
          lastActive: session.lastActive,
          isActive: session.isActive,
        });
      }
    }

    const token = getToken();
    if (!token) return;

    let active = true;
    const hydrate = async () => {
      try {
        const user = await fetchCurrentUser();
        if (!active) return;

        const isVerified = user.isVerified ?? (user as any)?.verified ?? (user.status === 'ACTIVE');

        // Commit auth state first
        login({
          id: user.id, name: user.name, email: user.email, role: user.role,
          language: user.language || 'en', createdAt: user.createdAt,
          lastActive: user.lastActive, isActive: user.isActive,
          status: user.status, isVerified,
          rescueTeamId: user.rescueTeamId,
          approvalStatus: user.approvalStatus,
        });

        // Wait a tick so the Zustand store commits currentUser before
        // fetchAllData reads currentUser?.role — fixes the role-based
        // fetch branch race condition.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        if (!active) return;
        await fetchAllData();
      } catch {
        // API errors are retained by the store for the relevant page to display.
      }
    };
    hydrate();

    const pollingTimer = window.setInterval(() => {
      if (getToken()) fetchAllData();
    }, 30000);

    // Setup Cross-Tab BroadcastChannel listener
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannel = new BroadcastChannel('nova-emergency-bus');
        broadcastChannel.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type === 'incident_created' && data) {
            addIncident(data);
          } else if (type === 'incident_updated' && data) {
            updateIncident(data.id, data);
          } else if (type === 'mission_accepted' && data) {
            updateIncident(data.incidentId, {
              status: 'acknowledged',
              assignedTeam: data.teamName || data.teamId,
              assignedTeamId: data.teamId,
              assignedTeamName: data.teamName || data.teamId,
            });
          } else if (type === 'mission_status_updated' && data) {
            updateIncident(data.incidentId, {
              status: data.status,
            });
          }
        };
      } catch {}
    }

    return () => {
      active = false;
      window.clearInterval(pollingTimer);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [isAuthenticated, fetchAllData, login, addIncident, updateIncident]);

  return <>{children}</>;
}
