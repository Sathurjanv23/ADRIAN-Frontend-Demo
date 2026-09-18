// ============================================================
// ADRN — AI Emergency Response & Relief Network
// TypeScript Type System — Core + Relief Logistics
// ============================================================

// ─── Severity & Status Enums ────────────────────────────────

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus =
  | 'submitted'
  | 'analysing'
  | 'verified'
  | 'dispatched'
  | 'acknowledged'
  | 'en_route'
  | 'on_scene'
  | 'transporting'
  | 'resolved'
  | 'cancelled'
  | 'reported'
  | 'ai_analyzed'
  | 'prioritized'
  | 'assigned'
  | 'responding'
  | 'closed';

export type TeamStatus = 'available' | 'assigned' | 'en_route' | 'on_scene' | 'unavailable';

export type ResourceStatus = 'available' | 'reserved' | 'deployed' | 'low_stock' | 'critical_stock';

export type UserRole = 'citizen' | 'officer' | 'rescue_team' | 'hospital' | 'admin';

export type EmergencyType =
  | 'flood'
  | 'landslide'
  | 'fire'
  | 'road_accident'
  | 'medical'
  | 'crime'
  | 'missing_person'
  | 'building_collapse'
  | 'severe_weather'
  | 'other'
  | 'unknown';

export type Language = 'en' | 'ta' | 'si';

export interface OperationalAlert {
  id: string;
  type: string;
  title?: string;
  message: string;
  severity: SeverityLevel;
  timestamp: string;
  incidentId?: string;
  trackingCode?: string;
}

export type AgencyType =
  | 'command_centre'
  | 'police'
  | 'ambulance'
  | 'fire_rescue'
  | 'hospital'
  | 'disaster_response'
  | 'search_rescue';

export type DeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'acknowledged';

export interface AgencyNotification {
  id: string;
  agency: AgencyType;
  agencyName: string;
  destination: string;
  channel: 'portal' | 'sms' | 'email' | 'push' | 'radio';
  sentAt: string;
  status: DeliveryStatus;
  failureReason?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface AssignedUnit {
  id: string;
  unitType: 'ambulance' | 'police' | 'rescue_team' | 'fire_engine';
  name: string;
  callSign: string;
  distanceKm: number;
  etaMinutes: number;
  status: 'assigned' | 'en_route' | 'on_scene' | 'transporting' | 'completed';
}

export type PermissionStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

// ─── User ───────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DEACTIVATED';
  phone?: string;
  district?: string;
  organization?: string;
  rescueTeamId?: string;
  approvalStatus?: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  language: Language;
  createdAt: string;
  lastActive: string;
  isActive: boolean;
  isVerified?: boolean;  // Email verification flag
  avatar?: string;
}

// ─── Location ───────────────────────────────────────────────

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
  zone?: string;
  accuracy?: number;
  capturedAt?: string;
}

// ─── AI Analysis ────────────────────────────────────

export interface AIAnalysis {
  id: string;
  incidentId: string;
  emergencyType: EmergencyType;
  severity: SeverityLevel;
  confidenceScore: number;
  peopleAffected: number;
  vulnerablePersons: VulnerablePerson[];
  requiredResources: ResourceRequirement[];
  recommendedAction: string;
  detectedLanguage: Language;
  processedAt: string;
  inputModalities: ('text' | 'voice' | 'image')[];
  imageAnalysis?: ImageAnalysisResult;
  riskFactors: string[];
  estimatedResponseTime: number; // minutes
  recommendedAgencies?: AgencyType[];
  duplicateWarning?: string;
  voiceTranscript?: string;
}

export interface VulnerablePerson {
  type: 'elderly' | 'child' | 'disabled' | 'pregnant' | 'medical';
  count: number;
}

export interface ResourceRequirement {
  type: string;
  quantity: number;
  priority: 'immediate' | 'urgent' | 'normal';
}

export interface ImageAnalysisResult {
  conditions: string[];
  hazards: string[];
  structuralDamage: boolean;
  waterPresence: boolean;
  crowding: boolean;
  accessibility: 'clear' | 'partially_blocked' | 'blocked';
}

// ─── Incident ───────────────────────────────────────────────

export interface Incident {
  id: string;
  trackingCode?: string;
  type: EmergencyType;
  severity: SeverityLevel;
  status: IncidentStatus;
  title: string;
  description: string;
  location: GeoLocation;
  reportedBy?: string;
  reporterName: string;
  reporterPhone?: string;
  reportedAt: string;
  updatedAt?: string;
  peopleAffected: number;
  aiAnalysis?: AIAnalysis;
  assignedTeam?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedHospital?: string;
  eta?: number; // minutes
  notes?: IncidentNote[];
  attachments?: Attachment[];
  updates: IncidentUpdate[];
  resourcesAllocated?: ResourceAllocation[];
  priority?: number; // 1 = highest
  isSimulation?: boolean;
  isSilentSos?: boolean;
  audioUrl?: string;
  audioTranscript?: string;
  photoUrls?: string[];
  manualAddress?: string;
  locationAccuracy?: number;
  locationCapturedAt?: string;
  recommendedAgencies?: AgencyType[];
  notifiedAgencies?: AgencyNotification[];
  assignedUnits?: AssignedUnit[];
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export type EmergencyIncident = Incident;

export interface IncidentNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isAI?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  name: string;
  size: number;
}

export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  updatedBy: string;
  updatedAt: string;
  isAI?: boolean;
}

export interface ResourceAllocation {
  resourceId: string;
  resourceType: string;
  quantity: number;
  allocatedAt: string;
}

// ─── Rescue Team ────────────────────────────────────────────

export interface RescueTeam {
  id: string;
  name: string;
  code: string;
  status: TeamStatus;
  location: GeoLocation;
  members: TeamMember[];
  equipment: Equipment[];
  currentIncident?: string;
  eta?: number;
  capabilities: string[];
  district: string;
  contact: string;
  vehicleType: string;
  lastUpdated: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'standby' | 'off_duty';
}

export interface Equipment {
  type: string;
  quantity: number;
  status: 'available' | 'in_use' | 'maintenance';
}

// ─── Hospital ───────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  type: 'general' | 'specialist' | 'field' | 'teaching';
  district?: string;
  location: GeoLocation;
  contact: string;
  totalBeds: number;
  availableBeds: number;
  icuTotal: number;
  icuAvailable: number;
  emergencyTeams: number;
  ambulances: AmbulanceUnit[];
  incomingCases: IncomingCase[];
  specializations: string[];
  isActive: boolean;
  lastUpdated: string;
}

export interface AmbulanceUnit {
  id: string;
  code: string;
  status: 'available' | 'dispatched' | 'maintenance';
  location?: GeoLocation;
  eta?: number;
  assignedCase?: string;
}

export interface IncomingCase {
  id: string;
  incidentId: string;
  severity: SeverityLevel;
  eta: number;
  patientCount: number;
  condition: string;
  requiredCare: string[];
  ambulanceId?: string;
}

// ─── Resource ───────────────────────────────────────────────

export interface Resource {
  id: string;
  type: ResourceType;
  category?: string;
  name: string;
  quantity: number;
  available: number;
  reserved: number;
  deployed: number;
  status: ResourceStatus;
  location: GeoLocation;
  lastRestocked: string;
  unit: string;
  lowStockThreshold: number;
}

export type ResourceType =
  | 'ambulance'
  | 'rescue_boat'
  | 'fire_vehicle'
  | 'medical_kit'
  | 'food_pack'
  | 'water_unit'
  | 'medicine'
  | 'shelter'
  | 'rescue_personnel';

// ─── Risk Prediction ────────────────────────────────────────

export interface RiskPrediction {
  id: string;
  zone: string;
  district: string;
  location: GeoLocation;
  floodRisk: number; // 0-100
  landslideRisk: number;
  fireRisk: number;
  overallRisk: number;
  riskLevel: SeverityLevel;
  rainfall: number; // mm
  riverLevel: number; // meters
  temperature: number; // celsius
  windSpeed: number;
  populationDensity: number;
  predictionWindow: 1 | 3 | 6; // hours
  confidence: number;
  aiRecommendations: string[];
  historicalComparison: string;
  affectedPopulation: number;
  updatedAt: string;
}

export interface DigitalTwinSnapshot {
  timestamp: string;
  hoursAhead: 0 | 1 | 3 | 6;
  zones: ZoneRiskSnapshot[];
}

export interface ZoneRiskSnapshot {
  zone: string;
  district: string;
  floodRisk: number;
  landslideRisk: number;
  affectedArea: number; // sq km
  populationAtRisk: number;
  riverLevel: number;
}

// ─── Shelter ────────────────────────────────────────────────

export interface Shelter {
  id: string;
  name: string;
  location: GeoLocation;
  capacity: number;
  currentOccupancy: number;
  status: 'active' | 'standby' | 'full' | 'closed';
  amenities: string[];
  contact: string;
  district: string;
}

// ─── Notification ───────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: SeverityLevel;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  targetRole?: UserRole[];
}

export type NotificationType =
  | 'critical_incident'
  | 'new_assignment'
  | 'weather_alert'
  | 'resource_shortage'
  | 'hospital_capacity'
  | 'prediction_alert'
  | 'system_alert'
  | 'team_status'
  | 'simulation';

// ─── Analytics ──────────────────────────────────────────────

export interface AnalyticsSummary {
  period: string;
  totalIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  avgResponseTime: number; // minutes
  peopleAssisted: number;
  resourcesDeployed: number;
  predictionAccuracy: number; // percentage
  resolutionRate: number; // percentage
  incidentsByType: { type: EmergencyType; count: number }[];
  incidentsByRegion: { region: string; count: number }[];
  responseTimeTrend: { date: string; avgTime: number }[];
  resourceUsageTrend: { date: string; usage: number }[];
}

// ─── Audit Log ──────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

// ─── Simulation ─────────────────────────────────────────────

export interface SimulationStep {
  id: number;
  title: string;
  description: string;
  timestamp: number; // milliseconds from start
  type: 'prediction' | 'report' | 'ai' | 'map' | 'team' | 'hospital' | 'resource' | 'alert';
  data?: Record<string, unknown>;
}

export interface SimulationState {
  isActive: boolean;
  currentStep: number;
  elapsedTime: number;
  startTime?: number;
  scenario: 'flood_colombo';
  incidents: Incident[];
  riskLevel: number;
  riverLevel: number;
  rainfall: number;
}

// ─── NOVA Copilot ───────────────────────────────────────────

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  confidence?: number;
  sources?: string[];
}

// ─── API Response Wrappers ──────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

// ─── Auth ───────────────────────────────────────────────────

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  district?: string;
  organization?: string;
}

// ─── After-Action Report ────────────────────────────────────

export interface AfterActionReport {
  id: string;
  incidentId?: string;
  title: string;
  period: string;
  generatedAt: string;
  generatedBy: string;
  isAIGenerated?: boolean;
  executiveSummary: string;
  incidentStats?: {
    total: number;
    resolved: number;
    ongoing: number;
    bySeverity: Record<SeverityLevel, number>;
  };
  responseMetrics: {
    avgFirstResponseTime: number;
    avgResolutionTime: number;
    teamUtilizationRate?: number;
    teamDeploymentRate?: number;
    resourceUtilization?: number;
    citizenSatisfaction?: number;
  };
  resourceStats?: {
    teamsDeployed: number;
    rescueBoatsUsed: number;
    shelteredPersons: number;
    totalCost: number;
  };
  timeline?: ReportTimelineEvent[];
  incidentCount?: number;
  criticalIncidents?: number;
  bottlenecks: string[];
  recommendations: string[];
  predictionPerformance?: number;
  resourceEfficiency?: number;
  lessonsLearned?: string[];
}

export interface ReportTimelineEvent {
  time: string;
  event: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ResponseMetrics {
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  teamDeploymentRate: number;
  resourceUtilization: number;
  citizenSatisfaction?: number;
}

// ─── Digital Twin Snapshot ────────────────────────────────────

export interface DigitalTwinZone {
  zone: string;
  district: string;
  floodRisk: number;
  landslideRisk: number;
  affectedArea: number;
  populationAtRisk: number;
  riverLevel: number;
}

export interface DigitalTwinSnapshot {
  timestamp: string;
  hoursAhead: 0 | 1 | 3 | 6;
  zones: DigitalTwinZone[];
}


// ─── ADRN Relief Logistics Types ────────────────────────────

export type FoodSourceType = 'RESTAURANT' | 'HOTEL' | 'SUPERMARKET' | 'WAREHOUSE';
export type FoodSourceStatus = 'ACTIVE' | 'INACTIVE' | 'DEPLETED';

export interface FoodSourceLocation {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
}

export interface FoodSource {
  id: string;
  name: string;
  type: FoodSourceType;
  location: FoodSourceLocation;
  availableMeals: number;
  waterBottles: number;
  expiryTime?: string;
  contact?: string;
  status: FoodSourceStatus;
  createdAt?: string;
  updatedAt?: string;
  // Computed client-side
  distanceKm?: number;
}

export type ReliefPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReliefRequestStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ReliefRequestType = 'FOOD_AND_WATER' | 'FOOD_ONLY' | 'WATER_ONLY' | 'MEDICAL_SUPPLIES';

export interface ReliefGeoLocation {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
}

export interface ReliefRequest {
  id: string;
  incidentId?: string;
  incidentTrackingCode?: string;
  disasterLocation?: ReliefGeoLocation;
  peopleAffected: number;
  requiredMeals: number;
  requiredWater: number;
  priority: ReliefPriority;
  requestType: ReliefRequestType;
  status: ReliefRequestStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ReliefMissionStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ReliefGeoPoint {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
}

export interface ReliefMission {
  id: string;
  reliefRequestId: string;
  foodSourceId: string;
  foodSourceName?: string;
  vehicleId?: string;
  vehicleName?: string;
  driverName?: string;
  driverContact?: string;
  pickupLocation?: ReliefGeoPoint;
  destination?: ReliefGeoPoint;
  meals: number;
  waterBottles: number;
  eta: number; // minutes
  status: ReliefMissionStatus;
  currentLat?: number;
  currentLng?: number;
  distanceKm?: number;
  route?: ReliefGeoPoint[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface Inventory {
  id: string;
  sourceId: string;
  sourceName?: string;
  itemType: 'MEALS' | 'WATER';
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  expiryTime?: string;
  updatedAt?: string;
}

export interface ReliefStats {
  totalMealsAvailable: number;
  totalWaterAvailable: number;
  activeMissions: number;
  completedMissions: number;
  pendingRequests: number;
  criticalShortages: number;
  activeFoodSources: number;
  aiServiceStatus: 'ONLINE' | 'FALLBACK_ACTIVE';
}

// ─── AI Types ────────────────────────────────────────────────

export interface AIIncidentAnalysis {
  emergencyType: string;
  severity: SeverityLevel;
  confidenceScore: number;
  estimatedPeopleAffected: number;
  recommendedAction: string;
  riskFactors: string[];
  estimatedResponseTimeMinutes: number;
  requiresRelief: boolean;
  detectedLanguage: string;
  explanation: string;
}

export interface AICopilotResponse {
  answer: string;
  recommendations: string[];
  sources: string[];
  confidenceScore: number;
  requiresHumanReview: boolean;
}

export interface AIReliefRecommendation {
  bestSourceId: string | null;
  bestSourceName: string;
  reasoning: string;
  estimatedDeliveryMinutes: number;
  alternativeSources: string[];
  routeWarnings: string[];
  deliveryPriority: string;
  confidenceScore: number;
}
