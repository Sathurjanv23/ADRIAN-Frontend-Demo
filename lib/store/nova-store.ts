'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Incident, RescueTeam, Hospital, Resource, RiskPrediction,
  Notification, OperationalAlert, SimulationState, User, UserRole, Language
} from '@/types';
import {
  MOCK_INCIDENTS, MOCK_RESCUE_TEAMS, MOCK_HOSPITALS, MOCK_RESOURCES,
  MOCK_RISK_PREDICTIONS, MOCK_NOTIFICATIONS,
} from '@/lib/mock/data';

// ─── Frontend-only demo data layer ─────────────────────────────
// This used to call a Spring Boot backend on localhost:8080. The
// fetch* actions below now resolve against the mock data in
// lib/mock/data.ts instead, with a short artificial delay so
// loading states still render naturally.

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function synthesizeAlerts(incidents: Incident[]): OperationalAlert[] {
  return incidents
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 8)
    .map((i) => ({
      id: `alert-${i.id}`,
      type: i.type,
      title: i.title,
      message: `${i.severity.toUpperCase()} — ${i.location.district || i.location.zone || 'Unknown area'}: ${i.description}`,
      severity: i.severity,
      timestamp: i.updatedAt || i.reportedAt,
      incidentId: i.id,
      trackingCode: i.trackingCode,
    }));
}

// ─── App State ──────────────────────────────────────────────

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Loading states
  loading: {
    incidents: boolean;
    teams: boolean;
    hospitals: boolean;
    resources: boolean;
    predictions: boolean;
    notifications: boolean;
    alerts: boolean;
  };
  errors: {
    incidents: string | null;
    teams: string | null;
    resources: string | null;
    hospitals: string | null;
    alerts: string | null;
  };

  // Incidents
  incidents: Incident[];
  fetchIncidents: (params?: { severity?: string; status?: string }) => Promise<void>;
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  acceptMission: (incidentId: string, teamId: string, teamName?: string) => Promise<void>;
  updateMissionStatus: (incidentId: string, status: string, teamId?: string, notes?: string) => Promise<void>;

  // Teams
  rescueTeams: RescueTeam[];
  fetchTeams: () => Promise<void>;
  updateTeam: (id: string, updates: Partial<RescueTeam>) => void;

  // Hospitals
  hospitals: Hospital[];
  fetchHospitals: () => Promise<void>;
  updateHospital: (id: string, updates: Partial<Hospital>) => void;

  // Resources
  resources: Resource[];
  fetchResources: () => Promise<void>;
  updateResource: (id: string, updates: Partial<Resource>) => void;

  // Risk Predictions
  riskPredictions: RiskPrediction[];
  fetchPredictions: () => Promise<void>;
  updateRiskPrediction: (id: string, updates: Partial<RiskPrediction>) => void;

  // Notifications
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  addNotification: (notif: Notification) => void;
  markNotificationRead: (id: string) => Promise<void> | void;
  markAllRead: () => Promise<void> | void;
  unreadCount: number;
  alerts: OperationalAlert[];
  fetchAlerts: () => Promise<void>;

  // Initial data fetch (called once on app mount)
  fetchAllData: () => Promise<void>;

  // Simulation (kept as frontend-only feature)
  simulation: SimulationState;
  startSimulation: () => void;
  stopSimulation: () => void;
  advanceSimulation: () => void;

  // Global stats (live counters)
  stats: {
    activeIncidents: number;
    criticalIncidents: number;
    peopleAffected: number;
    teamsDeployed: number;
    avgResponseTime: number;
    aiPredictions: number;
  };
  refreshStats: () => void;
}

// ─── Simulation Steps (frontend-only — no backend needed) ─────

const SIMULATION_STEPS_DATA = [
  {
    id: 1,
    title: 'Rainfall intensifying over Western Province',
    description: 'Meteorological AI detects abnormal rainfall pattern. Zone 04 flood risk rising.',
    delay: 0,
    action: (state: AppState) => {
      state.updateRiskPrediction('rp001', { floodRisk: 82, overallRisk: 78, rainfall: 187, riverLevel: 4.8 });
      state.addNotification({
        id: `sim-notif-${Date.now()}`,
        type: 'prediction_alert',
        title: '⚠️ SIMULATION: Zone 04 Flood Risk Rising',
        message: 'AI detected critical rainfall pattern. Zone 04 at 82% flood risk.',
        severity: 'critical',
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
  },
  {
    id: 2,
    title: 'River Station 02 exceeds alert threshold',
    description: 'Kelani River at 5.2m — Emergency threshold breached. AI escalates risk.',
    delay: 3000,
    action: (state: AppState) => {
      state.updateRiskPrediction('rp001', { floodRisk: 88, riverLevel: 5.2, riskLevel: 'critical' });
    },
  },
  {
    id: 3,
    title: 'Citizen SOS Report received',
    description: 'Tamil-language voice + image report received. AI processing multimodal input.',
    delay: 6000,
    action: (state: AppState) => {
      const newIncident: Incident = {
        id: 'NOV-SIM-001',
        type: 'flood',
        severity: 'critical',
        status: 'reported',
        title: '[SIM] SIMULATION: House flooding — Kelani River bank',
        description: 'Water entering ground floor. Family of 4 trapped. Elderly father cannot walk.',
        location: { lat: 6.9450, lng: 79.9700, address: 'Simulation: 12 River View Lane, Kaduwela', district: 'Colombo', zone: 'Zone 04' },
        reportedBy: 'sim-citizen',
        reporterName: 'Simulation Citizen',
        reportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        peopleAffected: 4,
        notes: [],
        attachments: [],
        updates: [{ id: 'sim-upd1', status: 'reported', message: 'SIMULATION incident received.', updatedBy: 'System', updatedAt: new Date().toISOString() }],
        resourcesAllocated: [],
        priority: 1,
        isSimulation: true,
      };
      state.addIncident(newIncident);
      state.addNotification({
        id: `sim-notif-${Date.now() + 1}`,
        type: 'critical_incident',
        title: '🔴 SIMULATION: New Critical Incident',
        message: 'Flood emergency reported via voice+image in Zone 04. AI analyzing.',
        severity: 'critical',
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: 'NOV-SIM-001',
        relatedType: 'incident',
      });
    },
  },
  {
    id: 4,
    title: 'NOVA AI analyzing multimodal report',
    description: 'Speech-to-text, image analysis, language normalization — Critical detected.',
    delay: 10000,
    action: (state: AppState) => {
      state.updateIncident('NOV-SIM-001', {
        status: 'ai_analyzed',
        severity: 'critical',
        aiAnalysis: {
          id: 'ai-sim-001',
          incidentId: 'NOV-SIM-001',
          emergencyType: 'flood',
          severity: 'critical',
          confidenceScore: 93,
          peopleAffected: 4,
          vulnerablePersons: [{ type: 'elderly', count: 1 }],
          requiredResources: [{ type: 'Rescue Boat', quantity: 1, priority: 'immediate' }],
          recommendedAction: 'Deploy nearest rescue team immediately.',
          detectedLanguage: 'ta',
          processedAt: new Date().toISOString(),
          inputModalities: ['voice', 'image'],
          riskFactors: ['Elderly occupant', 'Rising water'],
          estimatedResponseTime: 10,
        },
      });
    },
  },
  {
    id: 5,
    title: 'Incident appears on Live Map',
    description: 'Critical incident marker pulsing on command center GIS map.',
    delay: 13000,
    action: (state: AppState) => {
      state.updateIncident('NOV-SIM-001', { status: 'prioritized', priority: 1 });
    },
  },
  {
    id: 6,
    title: 'AI assigns Priority: CRITICAL',
    description: 'NOVA Copilot recommends Team Alpha based on proximity and equipment.',
    delay: 16000,
    action: (state: AppState) => {
      state.addNotification({
        id: `sim-notif-${Date.now() + 2}`,
        type: 'critical_incident',
        title: '🤖 AI Recommendation: Deploy Team Alpha',
        message: 'NOVA Copilot: Team Alpha recommended for NOV-SIM-001. Distance: 1.8km. ETA: 6 min.',
        severity: 'critical',
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
  },
  {
    id: 7,
    title: 'Team Alpha dispatched to incident',
    description: 'Emergency officer approves AI recommendation. Team Alpha assigned and en route.',
    delay: 20000,
    action: (state: AppState) => {
      state.updateIncident('NOV-SIM-001', {
        status: 'en_route',
        assignedTeam: 'RT-ALPHA-01',
        assignedTeamName: 'Team Alpha',
        eta: 6,
        updates: [
          { id: 'sim-upd2', status: 'en_route', message: '[SIM] Team Alpha dispatched. ETA: 6 minutes.', updatedBy: 'Officer', updatedAt: new Date().toISOString() },
        ],
      });
      state.updateTeam('RT-ALPHA-01', { status: 'en_route', currentIncident: 'NOV-SIM-001', eta: 6 });
    },
  },
  {
    id: 8,
    title: 'Hospital alerted for incoming patient',
    description: 'Kelaniya Hospital receives automatic alert for elderly patient.',
    delay: 23000,
    action: (state: AppState) => {
      state.addNotification({
        id: `sim-notif-${Date.now() + 3}`,
        type: 'hospital_capacity',
        title: '🏥 Hospital Alert: Incoming Patient',
        message: 'Kelaniya Hospital: Incoming elderly patient from NOV-SIM-001. Prepare emergency bay.',
        severity: 'high',
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: 'h003',
        relatedType: 'hospital',
      });
    },
  },
  {
    id: 9,
    title: 'Resources allocated automatically',
    description: 'AI deploys rescue boat and medical kit. Water supply reserve activated.',
    delay: 26000,
    action: (state: AppState) => {
      const r001 = state.resources.find(r => r.id === 'r001');
      if (r001) {
        state.updateResource('r001', { deployed: r001.deployed + 1, available: r001.available - 1 });
      }
    },
  },
  {
    id: 10,
    title: 'Citizen notified: Team En Route',
    description: 'Citizen tracking timeline updated. \"Rescue Team En Route — ETA 6 minutes.\"',
    delay: 29000,
    action: () => { /* tracking update visual */ },
  },
  {
    id: 11,
    title: 'Command center live update',
    description: 'All dashboards reflect real-time status. River level continues rising.',
    delay: 33000,
    action: (state: AppState) => {
      state.updateRiskPrediction('rp001', { riverLevel: 5.6, floodRisk: 91 });
    },
  },
  {
    id: 12,
    title: 'Team Alpha on scene',
    description: 'Rescue team arrives. Extraction operation begins.',
    delay: 40000,
    action: (state: AppState) => {
      state.updateIncident('NOV-SIM-001', { status: 'responding', eta: 0 });
      state.updateTeam('RT-ALPHA-01', { status: 'on_scene' });
    },
  },
  {
    id: 13,
    title: 'After-action analytics generated',
    description: 'NOVA AI compiles operational report. Response time: 10.2 minutes.',
    delay: 48000,
    action: (state: AppState) => {
      state.addNotification({
        id: `sim-notif-${Date.now() + 4}`,
        type: 'simulation',
        title: '✅ SIMULATION COMPLETE',
        message: 'Flood response simulation completed. Avg response time: 10.2 min. 4 persons assisted.',
        severity: 'low',
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
  },
];

// ─── Store ───────────────────────────────────────────────────

let fetchAllDataPromise: Promise<void> | null = null;
const acceptingMissionIds = new Set<string>();

export const useNovaStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Auth
    currentUser: null,
    isAuthenticated: false,
    login: (user) => set({ currentUser: user, isAuthenticated: true }),
    logout: () => set({ currentUser: null, isAuthenticated: false }),

    // Language
    language: 'en',
    setLanguage: (lang) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('adrian_lang', lang);
        } catch {}
      }
      set({ language: lang });
    },

    // Loading states
    loading: {
      incidents: false,
      teams: false,
      hospitals: false,
      resources: false,
      predictions: false,
      notifications: false,
      alerts: false,
    },
    errors: {
      incidents: null,
      teams: null,
      resources: null,
      hospitals: null,
      alerts: null,
    },

    // ─── Incidents ──────────────────────────────────────────
    incidents: [],
    fetchIncidents: async (params) => {
      set(s => ({ loading: { ...s.loading, incidents: true }, errors: { ...s.errors, incidents: null } }));
      try {
        let incidents = clone(MOCK_INCIDENTS);
        if (params?.severity) incidents = incidents.filter((i) => i.severity === params.severity);
        if (params?.status) incidents = incidents.filter((i) => i.status === params.status);
        await mockDelay(null, 250);
        if (Array.isArray(incidents)) {
          // Merge with local state to avoid wiping out already-loaded/edited incidents.
          // Once the mock data has been loaded once, only ever ADD incidents that
          // aren't already known locally — never overwrite local edits (e.g. a
          // status change from acceptMission) with the pristine seed data again.
          set((state) => {
            if (state.incidents.length > 0) {
              const knownIds = new Set(state.incidents.map((i) => i.id));
              const knownCodes = new Set(state.incidents.map((i) => i.trackingCode).filter(Boolean));
              const newOnes = incidents.filter((i) => !knownIds.has(i.id) && (!i.trackingCode || !knownCodes.has(i.trackingCode)));
              return newOnes.length > 0 ? { incidents: [...state.incidents, ...newOnes] } : {};
            }
            const backendIds = new Set(incidents.map((i) => i.id));
            const backendCodes = new Set(incidents.map((i) => i.trackingCode).filter(Boolean));
            const localOnly = state.incidents.filter(
              (i) => !backendIds.has(i.id) && (!i.trackingCode || !backendCodes.has(i.trackingCode))
            );
            return { incidents: [...localOnly, ...incidents] };
          });
        }
      } catch (err) {
        console.warn('Mock incidents load error:', err);
        set(s => ({ errors: { ...s.errors, incidents: err instanceof Error ? err.message : 'Unable to load incidents.' } }));
      } finally {
        set(s => ({ loading: { ...s.loading, incidents: false } }));
        get().refreshStats();
      }
    },
    addIncident: (incident) =>
      set((state) => {
        // Prevent duplicate incidents by id or trackingCode
        const filtered = state.incidents.filter(
          (i) => i.id !== incident.id && (!incident.trackingCode || i.trackingCode !== incident.trackingCode)
        );
        const updated = [incident, ...filtered];

        // Link incident to rescue team if assigned
        let updatedTeams = state.rescueTeams;
        const effectiveTeamId = incident.assignedTeamId || incident.assignedTeam;
        if (effectiveTeamId) {
          updatedTeams = state.rescueTeams.map((t) => {
            if (t.id === effectiveTeamId) {
              return {
                ...t,
                status: (t.status === 'available' ? 'assigned' : t.status) as any,
                currentIncident: incident.id,
                lastUpdated: new Date().toISOString(),
              };
            }
            return t;
          });
        }

        // Broadcast to other open browser tabs
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('nova-emergency-bus');
            bc.postMessage({ type: 'incident_created', data: incident });
            bc.close();
          } catch { }
        }
        return { incidents: updated, rescueTeams: updatedTeams };
      }),
    updateIncident: (id, updates) =>
      set((state) => {
        const updated = state.incidents.map((inc) =>
          inc.id === id || inc.trackingCode === id ? { ...inc, ...updates, updatedAt: new Date().toISOString() } : inc
        );
        const updatedInc = updated.find((inc) => inc.id === id || inc.trackingCode === id);
        // Broadcast to other open browser tabs
        if (updatedInc && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('nova-emergency-bus');
            bc.postMessage({ type: 'incident_updated', data: updatedInc });
            bc.close();
          } catch { }
        }
        return { incidents: updated };
      }),

    acceptMission: async (incidentId, teamId, teamName) => {
      if (acceptingMissionIds.has(incidentId)) {
        throw new ApiError('Mission acceptance is already in progress.', 409, 'REQUEST_IN_PROGRESS');
      }

      const state = get();
      const incident = state.incidents.find((item) => item.id === incidentId || item.trackingCode === incidentId);
      const team = state.rescueTeams.find((item) => item.id === teamId);

      if (incident) {
        const normalizedStatus = incident.status.toLowerCase();
        if (['resolved', 'closed', 'cancelled'].includes(normalizedStatus)) {
          throw new ApiError('This mission is no longer active.', 409, 'INVALID_STATUS_TRANSITION');
        }
        const assignedTeamId = incident.assignedTeamId || incident.assignedTeam;
        if (assignedTeamId && assignedTeamId !== teamId && ['acknowledged', 'en_route', 'on_scene', 'transporting', 'responding'].includes(normalizedStatus)) {
          throw new ApiError('This mission has already been accepted by another team.', 409, 'INCIDENT_ALREADY_ASSIGNED');
        }
      }

      if (team) {
        if (team.status === 'unavailable') {
          throw new ApiError(`Rescue team '${team.name}' is currently unavailable.`, 409, 'TEAM_BUSY');
        }
        const isCurrentIncident = team.currentIncident === incidentId
          || team.currentIncident === incident?.id
          || team.currentIncident === incident?.trackingCode;
        if (team.currentIncident && !isCurrentIncident && team.status !== 'available') {
          throw new ApiError(`Rescue team '${team.name}' is already assigned to another mission.`, 409, 'TEAM_BUSY');
        }
      }

      acceptingMissionIds.add(incidentId);
      try {
        // Simulate a backend round-trip, then build the "confirmed" entity
        // locally — this is the frontend-only demo's single source of truth.
        await mockDelay(null, 300);

        const latest = get();
        const target = latest.incidents.find((item) => item.id === incidentId || item.trackingCode === incidentId);
        if (!target) {
          throw new ApiError('Incident not found.', 404, 'INCIDENT_NOT_FOUND');
        }
        const resolvedTeamName = teamName || latest.rescueTeams.find((t) => t.id === teamId)?.name;
        const confirmedIncident: Incident = {
          ...target,
          status: 'acknowledged',
          assignedTeam: teamId,
          assignedTeamId: teamId,
          assignedTeamName: resolvedTeamName,
          acknowledgedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updates: [
            {
              id: `upd-${Date.now()}`,
              status: 'acknowledged',
              message: `Mission accepted by ${resolvedTeamName || 'rescue team'}.`,
              updatedBy: resolvedTeamName || 'Rescue Team',
              updatedAt: new Date().toISOString(),
            },
            ...(target.updates || []),
          ],
        };

        // Update store with the confirmed entity
        set((state) => {
          const updatedIncidents = state.incidents.map((inc) =>
            inc.id === confirmedIncident.id || (confirmedIncident.trackingCode && inc.trackingCode === confirmedIncident.trackingCode)
              ? confirmedIncident
              : inc
          );

          const updatedTeams = state.rescueTeams.map((t) => {
            if (t.id === teamId) {
              return { ...t, status: 'assigned' as const, currentIncident: confirmedIncident.id, lastUpdated: new Date().toISOString() };
            }
            return t;
          });

          return { incidents: updatedIncidents, rescueTeams: updatedTeams };
        });

        // Broadcast confirmed update to other tabs
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('nova-emergency-bus');
            bc.postMessage({
              type: 'mission_accepted',
              data: confirmedIncident,
            });
            bc.close();
          } catch { }
        }

        get().refreshStats();
      } catch (err: any) {
        // Re-throw the original error (preserving ApiError status/code for UI)
        throw err;
      } finally {
        acceptingMissionIds.delete(incidentId);
      }
    },

    updateMissionStatus: async (incidentId, status, teamId, notes) => {
      try {
        await mockDelay(null, 300);

        const latest = get();
        const target = latest.incidents.find((item) => item.id === incidentId || item.trackingCode === incidentId);
        if (!target) {
          throw new ApiError('Incident not found.', 404, 'INCIDENT_NOT_FOUND');
        }
        const confirmedIncident: Incident = {
          ...target,
          status: status as Incident['status'],
          updatedAt: new Date().toISOString(),
          resolvedAt: status === 'resolved' ? new Date().toISOString() : target.resolvedAt,
          updates: [
            {
              id: `upd-${Date.now()}`,
              status: status as Incident['status'],
              message: notes || `Status updated to ${status.replace('_', ' ')}.`,
              updatedBy: 'Field Update',
              updatedAt: new Date().toISOString(),
            },
            ...(target.updates || []),
          ],
        };

        // Update store with the confirmed entity
        set((state) => {
          const updatedIncidents = state.incidents.map((inc) =>
            inc.id === confirmedIncident.id || (confirmedIncident.trackingCode && inc.trackingCode === confirmedIncident.trackingCode)
              ? confirmedIncident
              : inc
          );

          const updatedTeams = state.rescueTeams.map((t) => {
            if (t.id === teamId || t.currentIncident === confirmedIncident.id) {
              if (confirmedIncident.status === 'resolved') {
                return { ...t, status: 'available' as const, currentIncident: undefined, lastUpdated: new Date().toISOString() };
              } else if (confirmedIncident.status === 'on_scene') {
                return { ...t, status: 'on_scene' as const, lastUpdated: new Date().toISOString() };
              } else if (confirmedIncident.status === 'en_route') {
                return { ...t, status: 'en_route' as const, lastUpdated: new Date().toISOString() };
              }
            }
            return t;
          });

          return { incidents: updatedIncidents, rescueTeams: updatedTeams };
        });

        // Broadcast confirmed update to other tabs
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('nova-emergency-bus');
            bc.postMessage({
              type: 'mission_status_updated',
              data: confirmedIncident,
            });
            bc.close();
          } catch { }
        }

        get().refreshStats();
      } catch (err: any) {
        // Re-throw the original error (preserving ApiError status/code for UI)
        throw err;
      }
    },

    // ─── Teams ──────────────────────────────────────────────
    rescueTeams: [],
    fetchTeams: async () => {
      // Only seed once — repeated polling must never wipe out local
      // status changes made via updateTeam()/acceptMission().
      if (get().rescueTeams.length > 0) return;
      set(s => ({ loading: { ...s.loading, teams: true }, errors: { ...s.errors, teams: null } }));
      try {
        const teams = await mockDelay(clone(MOCK_RESCUE_TEAMS), 250);
        if (Array.isArray(teams) && get().rescueTeams.length === 0) {
          set({ rescueTeams: teams });
        }
      } catch (err) {
        console.warn('Mock rescue teams load error:', err);
        set(s => ({ errors: { ...s.errors, teams: err instanceof Error ? err.message : 'Unable to load rescue teams.' } }));
      } finally {
        set(s => ({ loading: { ...s.loading, teams: false } }));
        get().refreshStats();
      }
    },
    updateTeam: (id, updates) =>
      set((state) => ({
        rescueTeams: state.rescueTeams.map((t) =>
          t.id === id ? { ...t, ...updates, lastUpdated: new Date().toISOString() } : t
        ),
      })),

    // ─── Hospitals ──────────────────────────────────────────
    hospitals: [],
    fetchHospitals: async () => {
      if (get().hospitals.length > 0) return;
      set(s => ({ loading: { ...s.loading, hospitals: true }, errors: { ...s.errors, hospitals: null } }));
      try {
        const hospitals = await mockDelay(clone(MOCK_HOSPITALS), 250);
        if (Array.isArray(hospitals) && get().hospitals.length === 0) {
          set({ hospitals });
        }
      } catch (err) {
        console.warn('Mock hospitals load error:', err);
        set(s => ({ errors: { ...s.errors, hospitals: err instanceof Error ? err.message : 'Unable to load hospitals.' } }));
      } finally {
        set(s => ({ loading: { ...s.loading, hospitals: false } }));
      }
    },
    updateHospital: (id, updates) =>
      set((state) => ({
        hospitals: state.hospitals.map((h) =>
          h.id === id ? { ...h, ...updates, lastUpdated: new Date().toISOString() } : h
        ),
      })),

    // ─── Resources ──────────────────────────────────────────
    resources: [],
    fetchResources: async () => {
      if (get().resources.length > 0) return;
      set(s => ({ loading: { ...s.loading, resources: true }, errors: { ...s.errors, resources: null } }));
      try {
        const resources = await mockDelay(clone(MOCK_RESOURCES), 250);
        if (Array.isArray(resources) && get().resources.length === 0) {
          set({ resources });
        }
      } catch (err) {
        console.warn('Mock resources load error:', err);
        set(s => ({ errors: { ...s.errors, resources: err instanceof Error ? err.message : 'Unable to load resources.' } }));
      } finally {
        set(s => ({ loading: { ...s.loading, resources: false } }));
      }
    },
    updateResource: (id, updates) =>
      set((state) => ({
        resources: state.resources.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      })),

    // ─── Risk Predictions ────────────────────────────────────
    riskPredictions: [],
    fetchPredictions: async () => {
      if (get().riskPredictions.length > 0) return;
      set(s => ({ loading: { ...s.loading, predictions: true } }));
      try {
        const predictions = await mockDelay(clone(MOCK_RISK_PREDICTIONS), 250);
        if (Array.isArray(predictions) && get().riskPredictions.length === 0) {
          set({ riskPredictions: predictions });
        }
      } catch (err) {
        console.warn('Mock predictions load error:', err);
      } finally {
        set(s => ({ loading: { ...s.loading, predictions: false } }));
        get().refreshStats();
      }
    },
    updateRiskPrediction: (id, updates) =>
      set((state) => ({
        riskPredictions: state.riskPredictions.map((rp) =>
          rp.id === id ? { ...rp, ...updates, updatedAt: new Date().toISOString() } : rp
        ),
      })),

    // ─── Notifications ───────────────────────────────────────
    notifications: [],
    fetchNotifications: async () => {
      if (get().notifications.length > 0) return;
      set(s => ({ loading: { ...s.loading, notifications: true } }));
      try {
        const notifications = await mockDelay(clone(MOCK_NOTIFICATIONS), 250);
        if (Array.isArray(notifications) && get().notifications.length === 0) {
          set({
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          });
        }
      } catch (err) {
        console.warn('Mock notifications load error:', err);
      } finally {
        set(s => ({ loading: { ...s.loading, notifications: false } }));
      }
    },
    addNotification: (notif) =>
      set((state) => {
        const next = [notif, ...state.notifications];
        return {
          notifications: next,
          unreadCount: next.filter((n) => !n.read).length,
        };
      }),
    markNotificationRead: async (id) => {
      set((state) => {
        const next = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: next,
          unreadCount: next.filter((n) => !n.read).length,
        };
      });
      await mockDelay(null, 120);
    },
    markAllRead: async () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
      await mockDelay(null, 120);
    },
    unreadCount: 0,
    alerts: [],
    fetchAlerts: async () => {
      if (get().alerts.length > 0) return;
      set(s => ({ loading: { ...s.loading, alerts: true }, errors: { ...s.errors, alerts: null } }));
      try {
        const alerts = await mockDelay(synthesizeAlerts(get().incidents.length > 0 ? get().incidents : clone(MOCK_INCIDENTS)), 250);
        if (Array.isArray(alerts) && get().alerts.length === 0) set({ alerts });
      } catch (err) {
        console.warn('Mock alerts load error:', err);
        set(s => ({ errors: { ...s.errors, alerts: err instanceof Error ? err.message : 'Unable to load alerts.' } }));
      } finally {
        set(s => ({ loading: { ...s.loading, alerts: false } }));
      }
    },

    // ─── Fetch All Data (called on app mount with request deduplication) ─────────────────
    fetchAllData: async () => {
      if (fetchAllDataPromise) {
        return fetchAllDataPromise;
      }

      fetchAllDataPromise = (async () => {
        const state = get();
        const userRole = state.currentUser?.role;

        if (userRole === 'citizen') {
          await Promise.allSettled([
            state.fetchIncidents(),
            state.fetchNotifications(),
            state.fetchAlerts(),
          ]);
        } else {
          await Promise.allSettled([
            state.fetchIncidents(),
            state.fetchTeams(),
            state.fetchHospitals(),
            state.fetchResources(),
            state.fetchPredictions(),
            state.fetchNotifications(),
            state.fetchAlerts(),
          ]);
        }

        get().refreshStats();
        // Clear promise cache after 4 seconds to allow fresh updates
        setTimeout(() => {
          fetchAllDataPromise = null;
        }, 4000);
      })();

      return fetchAllDataPromise;
    },

    // ─── Simulation (frontend-only) ──────────────────────────
    simulation: {
      isActive: false,
      currentStep: 0,
      elapsedTime: 0,
      startTime: undefined,
      scenario: 'flood_colombo',
      incidents: [],
      riskLevel: 0,
      riverLevel: 0,
      rainfall: 0,
    },
    startSimulation: () => {
      const state = get();
      const now = Date.now();
      set({ simulation: { ...state.simulation, isActive: true, currentStep: 0, startTime: now } });

      SIMULATION_STEPS_DATA.forEach((step) => {
        setTimeout(() => {
          const currentState = get();
          if (!currentState.simulation.isActive) return;
          step.action(currentState);
          set((s) => ({
            simulation: { ...s.simulation, currentStep: step.id },
          }));
          currentState.refreshStats();
        }, step.delay);
      });

      setTimeout(() => {
        set((s) => ({ simulation: { ...s.simulation, isActive: false } }));
      }, 55000);
    },
    stopSimulation: () =>
      set((state) => ({ simulation: { ...state.simulation, isActive: false } })),
    advanceSimulation: () => { },

    // ─── Stats ───────────────────────────────────────────────
    stats: {
      activeIncidents: 0,
      criticalIncidents: 0,
      peopleAffected: 0,
      teamsDeployed: 0,
      avgResponseTime: 0,
      aiPredictions: 0,
    },
    refreshStats: () => {
      const state = get();
      const activeInc = state.incidents.filter((i) => !['resolved', 'closed', 'cancelled'].includes(i.status?.toLowerCase()));
      const critInc = activeInc.filter((i) => i.severity?.toLowerCase() === 'critical');
      const people = activeInc.reduce((sum, i) => sum + (i.peopleAffected || 0), 0);
      const deployed = state.rescueTeams.filter((t) => t.status !== 'available' && t.status !== 'unavailable');
      const activeWithEta = activeInc.filter((i) => typeof i.eta === 'number' && i.eta > 0);
      const avgTime = activeWithEta.length > 0
        ? +(activeWithEta.reduce((sum, i) => sum + (i.eta || 0), 0) / activeWithEta.length).toFixed(1)
        : 0;

      set({
        stats: {
          activeIncidents: activeInc.length,
          criticalIncidents: critInc.length,
          peopleAffected: people > 0 ? people : state.incidents.reduce((sum, i) => sum + (i.peopleAffected || 0), 0),
          teamsDeployed: deployed.length,
          avgResponseTime: avgTime,
          aiPredictions: state.riskPredictions.length,
        },
      });
    },
  }))
);

// ─── Computed Selectors ──────────────────────────────────────

export const selectCriticalIncidents = (state: AppState) =>
  state.incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved');

export const selectActiveIncidents = (state: AppState) =>
  state.incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed');

export const selectAvailableTeams = (state: AppState) =>
  state.rescueTeams.filter((t) => t.status === 'available');

export const selectLowResources = (state: AppState) =>
  state.resources.filter((r) => r.status === 'low_stock' || r.status === 'critical_stock');
