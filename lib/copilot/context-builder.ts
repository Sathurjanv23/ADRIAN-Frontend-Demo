import type { ContextBundle } from './types';
import { getLiveOperationalData } from './data-source';

/**
 * Builds a dynamic RAG context from the real backend emergency database.
 */
export async function buildEmergencyContext(
  query: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<ContextBundle> {
  const data = await getLiveOperationalData();
  const q = `${query} ${conversationHistory.map((m) => m.content).join(' ')}`.toLowerCase();

  const sections: string[] = [];
  const sources: string[] = [];
  let completenessSignals = 0;
  let totalSignalsChecked = 0;

  const isGeneral =
    q.includes('summary') ||
    q.includes('situation') ||
    q.includes('overview') ||
    q.includes('current') ||
    q.includes('plan') ||
    q.includes('status') ||
    q.includes('action');

  // 1. INCIDENTS CONTEXT
  totalSignalsChecked++;
  const matchIncidents = isGeneral || q.includes('incident') || q.includes('critical') || q.includes('urgent') || q.includes('priority') || q.includes('flood') || q.includes('landslide') || q.includes('trapped') || q.includes('nov-');
  if (matchIncidents) {
    if (data.incidents.length > 0) {
      completenessSignals++;
      sources.push('Active Incidents');
      const incList = data.incidents
        .map((inc) => {
          return `- **${inc.id}** (${inc.severity.toUpperCase()}): "${inc.title}"
  * Status: ${inc.status}, Priority: ${inc.priority ?? 'N/A'}, Affected: ${inc.peopleAffected} people
  * Location: ${inc.location.district || 'District N/A'}, ${inc.location.zone || 'Zone N/A'} (${inc.location.address || ''})
  * Assigned Team: ${inc.assignedTeamName || inc.assignedTeam || 'None'} (ETA: ${inc.eta !== undefined ? `${inc.eta}m` : 'N/A'})
  * AI Assessment: ${inc.aiAnalysis?.recommendedAction || 'Pending'}`;
        })
        .join('\n');
      sections.push(`### ACTIVE INCIDENTS (${data.incidents.length} total):\n${incList}`);
    } else {
      sections.push('### ACTIVE INCIDENTS:\nNo active incidents currently reported in the system database.');
    }
  }

  // 2. RESCUE TEAMS CONTEXT
  totalSignalsChecked++;
  const matchTeams = isGeneral || q.includes('team') || q.includes('deploy') || q.includes('dispatch') || q.includes('available') || q.includes('rescue');
  if (matchTeams) {
    if (data.rescueTeams.length > 0) {
      completenessSignals++;
      sources.push('Rescue Teams');
      const teamList = data.rescueTeams
        .map((t) => {
          return `- **${t.name}** [${t.code}]: Status: ${t.status.toUpperCase()}, District: ${t.district}
  * Capabilities: ${(t.capabilities || []).join(', ') || 'General rescue'}
  * Vehicle/Boat: ${t.vehicleType || 'Standard'}
  * Current Assignment: ${t.currentIncident || 'None'} (ETA: ${t.eta !== undefined ? `${t.eta}m` : 'N/A'})`;
        })
        .join('\n');
      sections.push(`### RESCUE TEAMS (${data.rescueTeams.length} registered):\n${teamList}`);
    } else {
      sections.push('### RESCUE TEAMS:\nNo rescue teams currently registered in the system database.');
    }
  }

  // 3. RISK PREDICTIONS & WEATHER CONTEXT
  totalSignalsChecked++;
  const matchRisk = isGeneral || q.includes('risk') || q.includes('predict') || q.includes('zone') || q.includes('flood') || q.includes('landslide') || q.includes('river') || q.includes('rain') || q.includes('weather');
  if (matchRisk) {
    if (data.riskPredictions.length > 0) {
      completenessSignals++;
      sources.push('Risk Predictions');
      const riskList = data.riskPredictions
        .map((rp) => {
          return `- **${rp.zone}** (${rp.district}): Overall Risk ${rp.overallRisk}% (${rp.riskLevel.toUpperCase()})
  * Flood Risk: ${rp.floodRisk}%, Landslide Risk: ${rp.landslideRisk}%
  * River Level: ${rp.riverLevel}m, Rainfall: ${rp.rainfall}mm
  * Population at Risk: ${rp.affectedPopulation || rp.populationDensity}
  * AI Recommendations: ${(rp.aiRecommendations || []).join('; ') || 'Continuous monitoring'}`;
        })
        .join('\n');
      sections.push(`### RISK PREDICTIONS & SENSORS:\n${riskList}`);
    } else {
      sections.push('### RISK PREDICTIONS & SENSORS:\nNo verified risk prediction telemetry available in system database.');
    }
  }

  // 4. HOSPITALS & MEDICAL CONTEXT
  totalSignalsChecked++;
  const matchHospitals = isGeneral || q.includes('hospital') || q.includes('medical') || q.includes('icu') || q.includes('bed') || q.includes('ambulance') || q.includes('patient') || q.includes('doctor');
  if (matchHospitals) {
    if (data.hospitals.length > 0) {
      completenessSignals++;
      sources.push('Hospitals & Capacity');
      const hospList = data.hospitals
        .map((h) => {
          return `- **${h.name}** (${h.district || 'Colombo'}): Total Beds: ${h.totalBeds}, Available Beds: ${h.availableBeds}
  * ICU Beds Available: ${h.icuAvailable}/${h.icuTotal}
  * Emergency Teams: ${h.emergencyTeams}, Ambulances: ${(h.ambulances || []).length}
  * Specializations: ${(h.specializations || []).join(', ')}`;
        })
        .join('\n');
      sections.push(`### HOSPITAL CAPACITY:\n${hospList}`);
    } else {
      sections.push('### HOSPITAL CAPACITY:\nNo hospital capacity records available in system database.');
    }
  }

  // 5. RESOURCES CONTEXT
  totalSignalsChecked++;
  const matchResources = isGeneral || q.includes('resource') || q.includes('supply') || q.includes('boat') || q.includes('stock') || q.includes('water') || q.includes('food') || q.includes('equipment');
  if (matchResources) {
    if (data.resources.length > 0) {
      completenessSignals++;
      sources.push('Emergency Resources');
      const resList = data.resources
        .map((r) => {
          return `- **${r.name}**: Total: ${r.quantity} ${r.unit}, Available: ${r.available} ${r.unit}, Deployed: ${r.deployed} ${r.unit} (Status: ${r.status.toUpperCase()})`;
        })
        .join('\n');
      sections.push(`### RESOURCE INVENTORY:\n${resList}`);
    } else {
      sections.push('### RESOURCE INVENTORY:\nNo resource inventory records available in system database.');
    }
  }

  // 6. LIVE SYSTEM ALERTS
  if (data.alerts.length > 0) {
    sources.push('System Notifications');
    const alertList = data.alerts
      .slice(0, 5)
      .map((a) => `- [${a.severity?.toUpperCase() || 'INFO'}] ${a.title}: ${a.message}`)
      .join('\n');
    sections.push(`### ACTIVE SYSTEM ALERTS:\n${alertList}`);
  }

  // Calculate dynamic data completeness confidence
  const dataCompletenessScore = totalSignalsChecked > 0
    ? Math.round((completenessSignals / totalSignalsChecked) * 100)
    : 80;

  const systemContext = sections.join('\n\n');

  return {
    systemContext: systemContext || 'No operational records found in the database.',
    relevantSources: sources.length > 0 ? sources : ['Operational Database'],
    dataCompletenessScore: dataCompletenessScore || 0,
  };
}
