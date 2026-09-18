import {
  MOCK_INCIDENTS, MOCK_RESCUE_TEAMS, MOCK_HOSPITALS, MOCK_RESOURCES,
  MOCK_RISK_PREDICTIONS, MOCK_NOTIFICATIONS,
} from '@/lib/mock/data';

/**
 * Builds the RAG context bundle from the local mock operational
 * data instead of a live Spring Boot backend. Kept async to match
 * the original signature used by lib/copilot/context-builder.ts.
 */
export async function getLiveOperationalData() {
  return {
    incidents: MOCK_INCIDENTS,
    rescueTeams: MOCK_RESCUE_TEAMS,
    hospitals: MOCK_HOSPITALS,
    resources: MOCK_RESOURCES,
    riskPredictions: MOCK_RISK_PREDICTIONS,
    alerts: MOCK_NOTIFICATIONS,
  };
}
