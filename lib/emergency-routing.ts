import type {
  EmergencyType,
  AgencyType,
  AgencyNotification,
  AssignedUnit,
  RescueTeam,
  Hospital,
} from '@/types';

// ─── Emergency Routing Rules Matrix ───────────────────────────

export const EMERGENCY_ROUTING_RULES: Record<EmergencyType, AgencyType[]> = {
  medical: ['command_centre', 'ambulance', 'hospital'],
  road_accident: ['command_centre', 'ambulance', 'police', 'hospital', 'search_rescue'],
  fire: ['command_centre', 'fire_rescue', 'ambulance', 'police', 'hospital'],
  crime: ['command_centre', 'police', 'ambulance'],
  missing_person: ['command_centre', 'police', 'search_rescue'],
  building_collapse: ['command_centre', 'fire_rescue', 'ambulance', 'police', 'hospital'],
  flood: ['command_centre', 'disaster_response', 'search_rescue', 'police', 'ambulance', 'hospital'],
  landslide: ['command_centre', 'disaster_response', 'search_rescue', 'police', 'ambulance', 'hospital'],
  severe_weather: ['command_centre', 'disaster_response', 'search_rescue'],
  other: ['command_centre', 'police', 'ambulance', 'search_rescue'],
  unknown: ['command_centre', 'police', 'ambulance', 'hospital', 'search_rescue'],
};

export const AGENCY_METADATA: Record<AgencyType, { name: string; icon: string; defaultChannel: 'portal' | 'sms' | 'radio' }> = {
  command_centre: { name: 'NOVA Command Centre', icon: '🚨', defaultChannel: 'portal' },
  police: { name: 'Emergency Police Dispatch', icon: '👮', defaultChannel: 'portal' },
  ambulance: { name: '1990 Emergency Ambulance', icon: '🚑', defaultChannel: 'portal' },
  fire_rescue: { name: 'Fire & Rescue Service', icon: '🚒', defaultChannel: 'portal' },
  hospital: { name: 'Emergency Triage & Hospital Unit', icon: '🏥', defaultChannel: 'portal' },
  disaster_response: { name: 'Disaster Management Centre (DMC)', icon: '🛡️', defaultChannel: 'portal' },
  search_rescue: { name: 'Special Task Rescue Forces', icon: '🛟', defaultChannel: 'portal' },
};

// ─── Haversine Distance Formula ───────────────────────────────

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function calculateEtaMinutes(distanceKm: number, averageSpeedKmH: number = 40): number {
  const hours = distanceKm / averageSpeedKmH;
  const minutes = Math.max(3, Math.round(hours * 60) + 2); // Minimum 3 mins + 2 mins dispatch delay
  return minutes;
}

// ─── Generate Authority Notifications ──────────────────────────

export function generateAgencyNotifications(
  emergencyType: EmergencyType,
  isSimulation: boolean = true
): AgencyNotification[] {
  const agencies = EMERGENCY_ROUTING_RULES[emergencyType] || EMERGENCY_ROUTING_RULES.unknown;
  const now = new Date().toISOString();

  return agencies.map((agency) => {
    const meta = AGENCY_METADATA[agency];
    return {
      id: `notif-${agency}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      agency,
      agencyName: isSimulation ? `[SIMULATION] ${meta.name}` : meta.name,
      destination: `${agency}@nova.emergency.lk`,
      channel: meta.defaultChannel,
      sentAt: now,
      status: 'delivered', // Delivered to internal portal bus
    };
  });
}

// ─── Find Nearest Responder Units ─────────────────────────────

export function findNearestResponders(
  lat: number,
  lng: number,
  teams: RescueTeam[] = [],
  hospitals: Hospital[] = []
): {
  assignedTeam?: RescueTeam;
  assignedHospital?: Hospital;
  assignedUnits: AssignedUnit[];
  nearestDistanceKm: number;
  etaMinutes: number;
} {
  let nearestTeam: RescueTeam | undefined;
  let nearestTeamDist = Infinity;

  // Filter available teams
  const availableTeams = teams.filter((t) => t.status === 'available' || t.status === 'assigned');
  const searchPool = availableTeams.length > 0 ? availableTeams : teams;

  for (const team of searchPool) {
    if (team.location && team.location.lat && team.location.lng) {
      const dist = calculateDistanceKm(lat, lng, team.location.lat, team.location.lng);
      if (dist < nearestTeamDist) {
        nearestTeamDist = dist;
        nearestTeam = team;
      }
    }
  }

  // Find nearest hospital
  let nearestHospital: Hospital | undefined;
  let nearestHospDist = Infinity;

  for (const hosp of hospitals) {
    if (hosp.location && hosp.location.lat && hosp.location.lng) {
      const dist = calculateDistanceKm(lat, lng, hosp.location.lat, hosp.location.lng);
      if (dist < nearestHospDist) {
        nearestHospDist = dist;
        nearestHospital = hosp;
      }
    }
  }

  const effectiveDist = nearestTeamDist !== Infinity ? nearestTeamDist : 4.2;
  const etaMinutes = calculateEtaMinutes(effectiveDist);

  const assignedUnits: AssignedUnit[] = [];

  if (nearestTeam) {
    assignedUnits.push({
      id: `unit-${nearestTeam.id}`,
      unitType: 'rescue_team',
      name: nearestTeam.name,
      callSign: nearestTeam.code || 'ALPHA-01',
      distanceKm: effectiveDist,
      etaMinutes,
      status: 'assigned',
    });
  }

  if (nearestHospital) {
    const hospDist = nearestHospDist !== Infinity ? nearestHospDist : 5.8;
    assignedUnits.push({
      id: `unit-hosp-${nearestHospital.id}`,
      unitType: 'ambulance',
      name: `Ambulance Unit (${nearestHospital.name})`,
      callSign: 'MEDIC-1990',
      distanceKm: hospDist,
      etaMinutes: calculateEtaMinutes(hospDist),
      status: 'assigned',
    });
  }

  return {
    assignedTeam: nearestTeam,
    assignedHospital: nearestHospital,
    assignedUnits,
    nearestDistanceKm: effectiveDist,
    etaMinutes,
  };
}
