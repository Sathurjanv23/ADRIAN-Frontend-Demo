// ============================================================
// PROJECT NOVA / ADRIAN — Frontend-only Mock API Layer
// ------------------------------------------------------------
// This used to call a Spring Boot backend on localhost:8080.
// For the standalone frontend demo build every function below
// resolves against in-memory mock data instead of the network,
// while keeping the exact same exported shape so no page needs
// to change. State lives for the lifetime of the browser tab.
// ============================================================

import {
  MOCK_USERS, MOCK_INCIDENTS, MOCK_RESCUE_TEAMS, MOCK_HOSPITALS,
  MOCK_RESOURCES, MOCK_RISK_PREDICTIONS, MOCK_AUDIT_LOGS, MOCK_ANALYTICS,
} from '@/lib/mock/data';
import {
  MOCK_FOOD_SOURCES, MOCK_RELIEF_REQUESTS, MOCK_RELIEF_MISSIONS, computeReliefStats,
} from '@/lib/mock/relief-data';
import { getRegisteredUsers, updateRegisteredUser } from '@/lib/mock/registered-users';
import type {
  User, FoodSource, ReliefRequest, ReliefMission,
} from '@/types';

// ─── Helpers ──────────────────────────────────────────────────

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

class MockApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ─── In-memory "database" (seeded once per page session) ─────

let db_users: User[] = [
  ...clone(MOCK_USERS),
  {
    id: 'u007', name: 'Ishara Gunasekara', email: 'ishara.pending@nova.lk', role: 'rescue_team',
    phone: '+94775551122', district: 'Kandy', organization: 'Central Province Rescue Corps',
    language: 'en', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    lastActive: new Date(Date.now() - 2 * 3600000).toISOString(), isActive: false,
    isVerified: true, status: 'PENDING_VERIFICATION', approvalStatus: 'PENDING_APPROVAL',
  },
  {
    id: 'u008', name: 'Dr. Ruwan Jayasuriya', email: 'ruwan.pending@nova.lk', role: 'hospital',
    phone: '+94775553344', district: 'Galle', organization: 'Karapitiya Teaching Hospital',
    language: 'en', createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    lastActive: new Date(Date.now() - 5 * 3600000).toISOString(), isActive: false,
    isVerified: true, status: 'PENDING_VERIFICATION', approvalStatus: 'PENDING_APPROVAL',
  },
];
let db_auditLogs = clone(MOCK_AUDIT_LOGS);
let db_foodSources: FoodSource[] = clone(MOCK_FOOD_SOURCES);
let db_reliefRequests: ReliefRequest[] = clone(MOCK_RELIEF_REQUESTS);
let db_reliefMissions: ReliefMission[] = clone(MOCK_RELIEF_MISSIONS);

function addAuditLog(entry: Partial<(typeof db_auditLogs)[number]>) {
  db_auditLogs = [
    {
      id: genId('al'),
      userId: 'u005',
      userName: 'Admin Nova',
      action: 'ACTION',
      resource: 'system',
      resourceId: '-',
      details: '',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
      severity: 'info',
      ...entry,
    } as (typeof db_auditLogs)[number],
    ...db_auditLogs,
  ];
}

// ─── Auth API ────────────────────────────────────────────────
// NOTE: real sign-in/sign-up flows live in lib/auth.ts. These are
// kept only for shape-compatibility with any legacy caller.

export const authApi = {
  login: (_credentials: { email: string; password: string }) =>
    Promise.reject(new MockApiError('Use lib/auth.ts signIn() in the demo build.', 501)),
  register: (_data: Record<string, unknown>) =>
    Promise.reject(new MockApiError('Use lib/auth.ts signUp() in the demo build.', 501)),
  logout: () => delay({ success: true }),
  refreshToken: (_refreshToken: string) =>
    Promise.reject(new MockApiError('Not applicable in the demo build.', 501)),
};

// ─── Incidents API ───────────────────────────────────────────
// The Zustand store (lib/store/nova-store.ts) is the single source
// of truth for incidents in the demo build. These endpoints simply
// resolve successfully so callers that already fall back to local
// store state (citizen SOS, tracking, dispatch actions) proceed as
// if the write succeeded server-side.

export const incidentsApi = {
  getAll: (_params?: { severity?: string; status?: string; page?: number }) =>
    delay(clone(MOCK_INCIDENTS)),

  getById: (id: string) => {
    const found = MOCK_INCIDENTS.find((i) => i.id === id);
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('Incident not found.', 404));
  },

  getByTrackingCode: (code: string) => {
    const found = MOCK_INCIDENTS.find((i) => i.trackingCode === code || i.id === code);
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('Incident not found.', 404));
  },

  create: (_data: Record<string, unknown>) =>
    Promise.reject(new MockApiError('Demo mode: incident created locally only.', 501)),

  reportEmergency: (_formData: FormData) =>
    // Intentionally rejects — app/citizen/sos/page.tsx already has a complete,
    // fully-featured local fallback path that builds the Incident client-side.
    Promise.reject(new MockApiError('Demo mode: report handled by local store.', 501)),

  update: (_id: string, _data: Record<string, unknown>) => delay({ success: true }),

  assignTeam: (_incidentId: string, _teamId: string, _teamName?: string) => delay({ success: true }),

  acceptMission: (_incidentId: string, _teamId: string, _teamName?: string, _officerName?: string) =>
    delay({ success: true }),

  updateMissionStatus: (_incidentId: string, _status: string, _teamId?: string, _notes?: string) =>
    delay({ success: true }),

  acknowledge: (_id: string, _agency?: string, _officerName?: string) => delay({ success: true }),

  cancel: (_id: string, _reason?: string) => delay({ success: true }),

  escalate: (_id: string, _reason: string) => delay({ success: true }),

  resolve: (_id: string, _resolution: string) => delay({ success: true }),
};

// ─── AI API ──────────────────────────────────────────────────
// Deterministic heuristics stand in for the AWS Bedrock / FastAPI
// service. See lib/emergency-routing.ts for the on-device triage
// logic already used by the Citizen SOS + AI Analysis pages.

export const aiApi = {
  analyzeText: (_text: string, _language?: string) =>
    delay({ success: true, message: 'Analyzed locally using on-device heuristics.' }),
  analyzeVoice: (_audioBlob: Blob) => delay({ success: true, transcript: '' }),
  analyzeImage: (_imageBlob: Blob) => delay({ success: true, conditions: [] }),
  copilotChat: (message: string, _context?: Record<string, unknown>) =>
    delay({ success: true, message: `Copilot (offline demo mode) received: "${message}"` }),
  generateAfterActionReport: (_params: { startDate: string; endDate: string; district?: string }) =>
    delay({ success: true }),
  analyzeIncident: (_data: Record<string, unknown>) => delay({ success: true }),
  copilot: (query: string, _context = '{}') =>
    delay({ success: true, message: `Copilot (offline demo mode) received: "${query}"` }),
  reliefRecommendation: (_reliefRequestId: string) => delay({ success: true }),
  getStatus: () => delay({ online: true, model: 'ADRIAN-Local-Insight (demo)' }),
};

// ─── Predictions API ────────────────────────────────────────────

export const predictionsApi = {
  getAll: () => delay(clone(MOCK_RISK_PREDICTIONS)),
  getByZone: (zone: string) =>
    delay(clone(MOCK_RISK_PREDICTIONS.filter((p) => p.zone === zone))),
  getDigitalTwin: (_hoursAhead: number) => delay({ success: true }),
};

// ─── Rescue Teams API ─────────────────────────────────────────

export const rescueTeamsApi = {
  getAll: () => delay(clone(MOCK_RESCUE_TEAMS)),
  getById: (id: string) => {
    const found = MOCK_RESCUE_TEAMS.find((t) => t.id === id);
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('Team not found.', 404));
  },
  updateStatus: (_id: string, _status: string) => delay({ success: true }),
  assign: (_teamId: string, _incidentId: string) => delay({ success: true }),
};

// ─── Hospitals API ────────────────────────────────────────────
// The hospital dashboard already mutates lib/store/nova-store.ts
// locally right after these resolve, so we just acknowledge here.

export const hospitalsApi = {
  getAll: () => delay(clone(MOCK_HOSPITALS)),
  getById: (id: string) => {
    const found = MOCK_HOSPITALS.find((h) => h.id === id);
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('Hospital not found.', 404));
  },
  updateCapacity: (_id: string, _data: Record<string, unknown>) => delay({ success: true }),
  dispatchAmbulance: (_hospitalId: string, _incidentId: string) => delay({ success: true }),
  admitPatient: (_hospitalId: string, _data: Record<string, unknown>) => delay({ success: true }),
};

// ─── Resources API ────────────────────────────────────────────

export const resourcesApi = {
  getAll: () => delay(clone(MOCK_RESOURCES)),
  allocate: (_resourceId: string, _quantity: number, _incidentId: string) => delay({ success: true }),
};

// ─── Map API ──────────────────────────────────────────────────

export const mapApi = {
  getIncidents: () => delay(clone(MOCK_INCIDENTS)),
  getTeamLocations: () => delay(clone(MOCK_RESCUE_TEAMS)),
  getHospitals: () => delay(clone(MOCK_HOSPITALS)),
  getRiskZones: () => delay(clone(MOCK_RISK_PREDICTIONS)),
};

// ─── Analytics API ────────────────────────────────────────────

export const analyticsApi = {
  getSummary: (_period: string) => delay(clone(MOCK_ANALYTICS)),
  getIncidentTrends: () => delay(clone(MOCK_ANALYTICS.responseTimeTrend)),
  getResponseTimes: () => delay(clone(MOCK_ANALYTICS.responseTimeTrend)),
  getResourceUsage: () => delay(clone(MOCK_ANALYTICS.resourceUsageTrend)),
};

// ─── Admin API ────────────────────────────────────────────────

function selfRegisteredAsUsers(): User[] {
  return getRegisteredUsers().map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status,
    approvalStatus: r.approvalStatus,
    phone: r.phone,
    district: r.district,
    organization: r.organization,
    rescueTeamId: r.rescueTeamId,
    language: r.language,
    createdAt: r.createdAt,
    lastActive: r.lastActive,
    isActive: r.isActive,
    isVerified: r.isVerified,
  }));
}

export const adminApi = {
  getUsers: () => delay(clone([...db_users, ...selfRegisteredAsUsers()])),

  createUser: (data: Record<string, unknown>) => {
    const user: User = {
      id: genId('u'),
      name: String(data.name || 'New User'),
      email: String(data.email || `user-${Date.now()}@nova.lk`),
      role: (data.role as User['role']) || 'citizen',
      phone: data.phone as string | undefined,
      district: data.district as string | undefined,
      organization: data.organization as string | undefined,
      language: (data.language as User['language']) || 'en',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isActive: true,
      isVerified: true,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    };
    db_users = [user, ...db_users];
    addAuditLog({ userId: 'u005', userName: 'Admin Nova', action: 'USER_CREATED', resource: 'user', resourceId: user.id, details: `Created ${user.role} account for ${user.name}` });
    return delay(clone(user));
  },

  updateUser: (id: string, data: Record<string, unknown>) => {
    const idx = db_users.findIndex((u) => u.id === id);
    if (idx === -1) return Promise.reject(new MockApiError('User not found.', 404));
    db_users[idx] = { ...db_users[idx], ...data } as User;
    return delay(clone(db_users[idx]));
  },

  approveUser: (id: string, decision: 'APPROVE' | 'REJECT', rescueTeamId?: string) => {
    const idx = db_users.findIndex((u) => u.id === id);
    if (idx === -1) {
      // Might be a self-registered demo account instead of a seed user.
      const updatedReg = updateRegisteredUser(id, {
        approvalStatus: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        status: decision === 'APPROVE' ? 'ACTIVE' : 'DEACTIVATED',
        isActive: decision === 'APPROVE',
        rescueTeamId,
      });
      if (!updatedReg) return Promise.reject(new MockApiError('User not found.', 404));
      addAuditLog({
        userId: 'u005', userName: 'Admin Nova',
        action: decision === 'APPROVE' ? 'USER_APPROVED' : 'USER_REJECTED',
        resource: 'user', resourceId: id,
        details: `${decision === 'APPROVE' ? 'Approved' : 'Rejected'} ${updatedReg.name} (${updatedReg.role})`,
      });
      const asUser: User = {
        id: updatedReg.id, name: updatedReg.name, email: updatedReg.email, role: updatedReg.role,
        status: updatedReg.status, approvalStatus: updatedReg.approvalStatus, phone: updatedReg.phone,
        district: updatedReg.district, organization: updatedReg.organization, rescueTeamId: updatedReg.rescueTeamId,
        language: updatedReg.language, createdAt: updatedReg.createdAt, lastActive: updatedReg.lastActive,
        isActive: updatedReg.isActive, isVerified: updatedReg.isVerified,
      };
      return delay(clone(asUser));
    }
    const updated: User = {
      ...db_users[idx],
      approvalStatus: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      status: decision === 'APPROVE' ? 'ACTIVE' : 'DEACTIVATED',
      isActive: decision === 'APPROVE',
      rescueTeamId: decision === 'APPROVE' ? (rescueTeamId || db_users[idx].rescueTeamId) : db_users[idx].rescueTeamId,
    };
    db_users[idx] = updated;
    addAuditLog({
      userId: 'u005', userName: 'Admin Nova',
      action: decision === 'APPROVE' ? 'USER_APPROVED' : 'USER_REJECTED',
      resource: 'user', resourceId: id,
      details: `${decision === 'APPROVE' ? 'Approved' : 'Rejected'} ${updated.name} (${updated.role})`,
    });
    return delay(clone(updated));
  },

  deleteUser: (id: string) => {
    db_users = db_users.filter((u) => u.id !== id);
    return delay({ success: true });
  },

  getAuditLogs: () => delay(clone(db_auditLogs)),

  getSystemHealth: () => delay({
    status: 'operational',
    services: [
      { name: 'Frontend (Demo Mode)', status: 'operational' },
      { name: 'Mock Data Layer', status: 'operational' },
    ],
  }),
};

// ─── ADRN Food Sources API ────────────────────────────────────

export const foodSourcesApi = {
  getAll: (status?: string) =>
    delay(clone(status ? db_foodSources.filter((s) => s.status === status.toUpperCase()) : db_foodSources)),

  getNearby: (_lat: number, _lng: number, _radiusKm = 50, minMeals = 0) =>
    delay(clone(db_foodSources.filter((s) => s.availableMeals >= minMeals))),

  getById: (id: string) => {
    const found = db_foodSources.find((s) => s.id === id);
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('Food source not found.', 404));
  },

  create: (data: Record<string, unknown>) => {
    const source: FoodSource = {
      id: genId('fs'),
      name: String(data.name || 'Unnamed Source'),
      type: (data.type as FoodSource['type']) || 'RESTAURANT',
      location: (data.location as FoodSource['location']) || { lat: 6.9271, lng: 79.8612 },
      availableMeals: Number(data.availableMeals) || 0,
      waterBottles: Number(data.waterBottles) || 0,
      expiryTime: data.expiryTime as string | undefined,
      contact: data.contact as string | undefined,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db_foodSources = [source, ...db_foodSources];
    return delay(clone(source));
  },

  update: (id: string, data: Record<string, unknown>) => {
    const idx = db_foodSources.findIndex((s) => s.id === id);
    if (idx === -1) return Promise.reject(new MockApiError('Food source not found.', 404));
    db_foodSources[idx] = { ...db_foodSources[idx], ...data, updatedAt: new Date().toISOString() } as FoodSource;
    return delay(clone(db_foodSources[idx]));
  },

  updateStatus: (id: string, status: string) => {
    const idx = db_foodSources.findIndex((s) => s.id === id);
    if (idx === -1) return Promise.reject(new MockApiError('Food source not found.', 404));
    db_foodSources[idx] = { ...db_foodSources[idx], status: status as FoodSource['status'], updatedAt: new Date().toISOString() };
    return delay(clone(db_foodSources[idx]));
  },
};

// ─── ADRN Relief Requests API ─────────────────────────────────

export const reliefRequestsApi = {
  getAll: (status?: string) =>
    delay(clone(status ? db_reliefRequests.filter((r) => r.status === status.toUpperCase()) : db_reliefRequests)),

  getById: (id: string) => {
    const found = db_reliefRequests.find((r) => r.id === id);
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('Relief request not found.', 404));
  },

  create: (data: Record<string, unknown>) => {
    const request: ReliefRequest = {
      id: genId('rr'),
      incidentId: data.incidentId as string | undefined,
      incidentTrackingCode: data.incidentTrackingCode as string | undefined,
      disasterLocation: data.disasterLocation as ReliefRequest['disasterLocation'],
      peopleAffected: Number(data.peopleAffected) || 1,
      requiredMeals: Number(data.requiredMeals) || 0,
      requiredWater: Number(data.requiredWater) || 0,
      priority: (data.priority as ReliefRequest['priority']) || 'MEDIUM',
      requestType: (data.requestType as ReliefRequest['requestType']) || 'FOOD_AND_WATER',
      status: 'PENDING',
      createdBy: data.createdBy as string | undefined,
      createdAt: new Date().toISOString(),
    };
    db_reliefRequests = [request, ...db_reliefRequests];
    return delay(clone(request));
  },

  createFromIncident: (incidentId: string) => {
    const incident = MOCK_INCIDENTS.find((i) => i.id === incidentId);
    const request: ReliefRequest = {
      id: genId('rr'),
      incidentId,
      incidentTrackingCode: incident?.trackingCode,
      disasterLocation: incident?.location,
      peopleAffected: incident?.peopleAffected || 1,
      requiredMeals: (incident?.peopleAffected || 1) * 3,
      requiredWater: (incident?.peopleAffected || 1) * 4,
      priority: incident?.severity === 'critical' ? 'CRITICAL' : 'HIGH',
      requestType: 'FOOD_AND_WATER',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    db_reliefRequests = [request, ...db_reliefRequests];
    return delay(clone(request));
  },

  updateStatus: (id: string, status: string) => {
    const idx = db_reliefRequests.findIndex((r) => r.id === id);
    if (idx === -1) return Promise.reject(new MockApiError('Relief request not found.', 404));
    db_reliefRequests[idx] = { ...db_reliefRequests[idx], status: status as ReliefRequest['status'], updatedAt: new Date().toISOString() };
    return delay(clone(db_reliefRequests[idx]));
  },

  getStats: () => delay(computeReliefStats(db_foodSources, db_reliefRequests, db_reliefMissions)),
};

// ─── ADRN Relief Missions API ─────────────────────────────────

export const reliefMissionsApi = {
  getAll: (status?: string) =>
    delay(clone(status ? db_reliefMissions.filter((m) => m.status === status.toUpperCase()) : db_reliefMissions)),

  getActive: () =>
    delay(clone(db_reliefMissions.filter((m) => !['COMPLETED', 'CANCELLED'].includes(m.status)))),

  getById: (id: string) => {
    const found = db_reliefMissions.find((m) => m.id === id);
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('Relief mission not found.', 404));
  },

  getByIncidentId: (incidentId: string) => {
    const request = db_reliefRequests.find((r) => r.incidentId === incidentId || r.incidentTrackingCode === incidentId);
    const found = request ? db_reliefMissions.find((m) => m.reliefRequestId === request.id) : undefined;
    return found ? delay(clone(found)) : Promise.reject(new MockApiError('No relief mission for this incident yet.', 404));
  },

  getStats: () => delay(computeReliefStats(db_foodSources, db_reliefRequests, db_reliefMissions)),

  create: (data: {
    reliefRequestId: string;
    foodSourceId: string;
    vehicleId?: string;
    vehicleName?: string;
    driverName?: string;
    driverContact?: string;
  }) => {
    const request = db_reliefRequests.find((r) => r.id === data.reliefRequestId);
    const source = db_foodSources.find((s) => s.id === data.foodSourceId);
    const mission: ReliefMission = {
      id: genId('rm'),
      reliefRequestId: data.reliefRequestId,
      foodSourceId: data.foodSourceId,
      foodSourceName: source?.name,
      vehicleId: data.vehicleId,
      vehicleName: data.vehicleName || 'Relief Vehicle',
      driverName: data.driverName || 'Driver',
      driverContact: data.driverContact,
      pickupLocation: source?.location,
      destination: request?.disasterLocation,
      meals: request?.requiredMeals || 0,
      waterBottles: request?.requiredWater || 0,
      eta: 15,
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
    };
    db_reliefMissions = [mission, ...db_reliefMissions];

    if (request) {
      const rIdx = db_reliefRequests.findIndex((r) => r.id === request.id);
      db_reliefRequests[rIdx] = { ...request, status: 'ASSIGNED', updatedAt: new Date().toISOString() };
    }
    if (source) {
      const sIdx = db_foodSources.findIndex((s) => s.id === source.id);
      db_foodSources[sIdx] = {
        ...source,
        availableMeals: Math.max(0, source.availableMeals - (request?.requiredMeals || 0)),
        waterBottles: Math.max(0, source.waterBottles - (request?.requiredWater || 0)),
        updatedAt: new Date().toISOString(),
      };
    }

    return delay(clone(mission));
  },

  updateStatus: (id: string, status: string, notes?: string) => {
    const idx = db_reliefMissions.findIndex((m) => m.id === id);
    if (idx === -1) return Promise.reject(new MockApiError('Relief mission not found.', 404));
    const isDone = status === 'COMPLETED' || status === 'DELIVERED';
    db_reliefMissions[idx] = {
      ...db_reliefMissions[idx],
      status: status as ReliefMission['status'],
      notes: notes ?? db_reliefMissions[idx].notes,
      updatedAt: new Date().toISOString(),
      completedAt: isDone ? new Date().toISOString() : db_reliefMissions[idx].completedAt,
    };

    if (status === 'COMPLETED') {
      const mission = db_reliefMissions[idx];
      const rIdx = db_reliefRequests.findIndex((r) => r.id === mission.reliefRequestId);
      if (rIdx !== -1) {
        db_reliefRequests[rIdx] = { ...db_reliefRequests[rIdx], status: 'COMPLETED', updatedAt: new Date().toISOString() };
      }
    }

    return delay(clone(db_reliefMissions[idx]));
  },

  updateLocation: (id: string, lat: number, lng: number) => {
    const idx = db_reliefMissions.findIndex((m) => m.id === id);
    if (idx === -1) return Promise.reject(new MockApiError('Relief mission not found.', 404));
    db_reliefMissions[idx] = { ...db_reliefMissions[idx], currentLat: lat, currentLng: lng, updatedAt: new Date().toISOString() };
    return delay(clone(db_reliefMissions[idx]));
  },
};
