// ============================================================
// PROJECT NOVA — Comprehensive Tri-Lingual (EN / TA / SI) i18n
// ============================================================

import { useNovaStore } from './store/nova-store';
import type { SeverityLevel, IncidentStatus, TeamStatus, EmergencyType } from '@/types';

export const DICTIONARY: Record<string, Record<string, string>> = {
  en: {
    // Portals
    'portal.citizen': 'Citizen Portal',
    'portal.command': 'Command Center',
    'portal.rescue': 'Rescue Operations',
    'portal.hospital': 'Hospital Portal',
    'portal.admin': 'Administrator',
    'portal.select': 'Select Portal',

    // Section Titles
    'section.command_center': 'Command Center',
    'section.operations': 'Operations',
    'section.intelligence': 'Intelligence',
    'section.system': 'System',
    'section.configuration': 'Configuration',
    'section.actions': 'Quick Actions',

    // Sidebar & Navigation
    'nav.dashboard': 'Dashboard',
    'nav.map': 'Live Map',
    'nav.incidents': 'Incidents',
    'nav.ai_analysis': 'AI Analysis',
    'nav.prediction': 'Prediction',
    'nav.rescue_ops': 'Rescue Ops',
    'nav.resources': 'Resources',
    'nav.hospitals': 'Hospitals',
    'nav.copilot': 'ADRIAN Copilot',
    'nav.alerts': 'Alerts',
    'nav.analytics': 'Analytics',
    'nav.sos': 'SOS Distress',
    'nav.safety': 'Safety Guide',
    'nav.reports': 'My Reports',
    'nav.team_status': 'Team Status',
    'nav.navigation': 'Navigation',
    'nav.triage': 'Triage Queue',
    'nav.incoming': 'Incoming',
    'nav.capacity': 'Capacity',
    'nav.ambulances': 'Ambulances',
    'nav.users': 'Users',
    'nav.organizations': 'Organizations',
    'nav.audit_logs': 'Audit Logs',
    'nav.ai_config': 'AI Config',
    'nav.monitoring': 'Monitoring',

    // Stats / KPI Labels
    'stats.active_incidents': 'Active Incidents',
    'stats.critical': 'Critical Emergencies',
    'stats.people_affected': 'People Affected',
    'stats.teams_deployed': 'Teams Deployed',
    'stats.avg_response': 'Avg Response',
    'stats.ai_predictions': 'AI Predictions',
    'stats.total_users': 'Total Users',
    'stats.ai_analyses_today': 'AI Analyses Today',
    'stats.system_uptime': 'System Uptime',
    'stats.available_beds': 'Available Beds',
    'stats.icu_available': 'ICU Available',
    'stats.medical_teams': 'Medical Teams',
    'stats.incoming_cases': 'Incoming Cases',
    'stats.team_members': 'Team Members',
    'stats.equipment_items': 'Equipment Items',
    'stats.active_assignment': 'Active Assignment',
    'stats.status': 'Status',
    'stats.eta_minutes': 'ETA (minutes)',

    // Common Action buttons
    'btn.report': 'Report Emergency',
    'btn.sos': 'Trigger SOS',
    'btn.start_sim': 'Start Simulation',
    'btn.stop_sim': 'Stop Sim',
    'btn.select_portal': 'Select Portal',
    'btn.sign_out': 'Sign Out / Login',
    'btn.home': 'Home Page',
    'btn.auto_assign': 'Auto-Assign Team',
    'btn.dispatch': 'Dispatch Team',
    'btn.resolve': 'Mark Resolved',
    'btn.gps': 'Start Navigation',
    'btn.view_all': 'View all',
    'btn.filter': 'Filter',
    'btn.search': 'Search',
    'btn.edit': 'Edit',
    'btn.manage': 'Manage',
    'btn.submit_report': 'File Emergency Report',
    'btn.submitting': 'Submitting Report...',
    'btn.save_config': 'Save Threshold Configuration',
    'btn.update_ai': 'Update AI Inference Settings',
    'btn.arrival_scene': 'Report Arrival On Scene',
    'btn.start_mission_nav': 'Start Mission Navigation',
    'btn.track_dispatch': 'Track Dispatch',

    // Headings & Labels
    'heading.queue': 'AI Priority Queue',
    'heading.triage_action': 'Triage Actions',
    'heading.crew': 'My Rescue Crew',
    'heading.safety_guide': 'Safety Guidelines',
    'heading.command_center': 'Command Center',
    'heading.authority_dashboard': 'Emergency Authority Dashboard',
    'heading.team_status': 'Team Status',
    'heading.risk_overview': 'Risk Overview',
    'heading.full_prediction': 'Full prediction',
    'heading.view_all': 'View all',
    'heading.rescue_deployments': 'Rescue Team Deployments',
    'heading.resources_inventory': 'Emergency Resources Inventory',
    'heading.hospital_capacity': 'Hospital Capacity & ICU Status',
    'heading.alert_logs': 'Alert Logs & Notifications',
    'heading.assigned_incidents': 'Assigned Incidents Queue',
    'heading.mission_navigation': 'Mission Route Navigation',
    'heading.mission_details': 'Mission Details',
    'heading.roster': 'Squad Members Roster',
    'heading.incoming_emergencies': 'Incoming Emergency Cases',
    'heading.triage_queue': 'Patient Triage Priority Queue',
    'heading.ward_capacity': 'Ward Capacity Adjustment',
    'heading.ambulance_fleet': 'Ambulance Fleet Dispatch Log',
    'heading.user_directory': 'User Accounts Directory',
    'heading.organizations': 'Collaborating Response Organizations',
    'heading.reserves_config': 'Reserves Stock Configuration',
    'heading.ai_model_config': 'AI Model Parameters Config',
    'heading.system_monitoring': 'System Monitoring',
    'heading.audit_logs_full': 'Admin Audit Logs',
    'heading.distress_form': 'File Emergency Distress Report',
    'heading.my_reports': 'My Emergency Reports',
    'heading.safety_guidelines': 'Safety Guidelines',
    'heading.disaster_prediction': 'Disaster Prediction',
    'heading.system_dashboard': 'System Dashboard',
    'heading.rescue_dashboard': 'Rescue Dashboard',
    'heading.hospital_dashboard': 'Hospital Dashboard',
    'heading.citizen_dashboard': 'Citizen Dashboard',
    'heading.system_health': 'System Health Monitor',
    'heading.users_by_role': 'Users by Role',
    'heading.ai_config': 'AI Configuration',
    'heading.recent_audit_logs': 'Recent Audit Logs',

    // Copilot
    'copilot.situation_summary': 'Situation Summary',
    'copilot.risk_alert': 'Risk Alert',
    'copilot.recommendation': 'Recommendation',
    'copilot.summary_text': 'Zone 4 currently has 6 critical incidents including 2 flood emergencies with trapped civilians. I recommend deploying the reserve rescue boat from Depot B.',
    'copilot.risk_text': 'River level at 4.8m — 23% above critical threshold. Zone 4 residents should be pre-evacuated within 2 hours.',
    'copilot.rec_text': 'Activate Shelter B now. Move 2 rescue boats to Zone 4 staging area. Alert Kelaniya Hospital for incoming cases.',
    'copilot.full_copilot': 'Open full Copilot',
    'copilot.ask_placeholder': 'Ask ADRIAN Copilot anything about active emergencies, teams, or risks...',

    // Common Phrases / Units
    'common.affected': 'affected',
    'common.min': 'min',
    'common.eta': 'ETA',
    'common.confidence': 'confidence',
    'common.live': 'LIVE',
    'common.active': 'Active',
    'common.ready': 'Ready',
    'common.online': 'ONLINE',
    'common.degraded': 'DEGRADED',
    'common.search_placeholder': 'Search incidents, teams, zones...',
    'common.notifications': 'Notifications',
    'common.mark_all_read': 'Mark all read',
    'common.view_all_notifications': 'View all notifications',
    'common.no_active_incidents': 'No active incidents',
    'common.no_active_reports': 'No active reports',
    'common.current': 'CURRENT',
    'common.ai_analyzed': 'AI Analyzing',

    // Severities
    'severity.critical': 'CRITICAL',
    'severity.high': 'HIGH',
    'severity.medium': 'MEDIUM',
    'severity.low': 'LOW',

    // Statuses
    'status.reported': 'Report Received',
    'status.ai_analyzed': 'AI Analyzing',
    'status.prioritized': 'Priority Assigned',
    'status.assigned': 'Team Assigned',
    'status.en_route': 'En Route',
    'status.responding': 'On Scene',
    'status.resolved': 'Resolved',
    'status.closed': 'Closed',
    'status.available': 'Available',
    'status.on_scene': 'On Scene',
    'status.standby': 'Standby',
    'status.low_stock': 'Low Stock',
    'status.critical_stock': 'Critical Stock',
    'status.dispatched': 'Dispatched',

    // Emergency Types
    'type.flood': '🌊 Flood',
    'type.landslide': '⛰️ Landslide',
    'type.fire': '🔥 Fire',
    'type.road_accident': '🚗 Road Accident',
    'type.medical': '🏥 Medical Emergency',
    'type.missing_person': '👤 Missing Person',
    'type.building_collapse': '🏚️ Building Collapse',
    'type.severe_weather': '🌪️ Severe Weather',
    'type.other': '⚠️ Other',

    // Relative Time
    'time.just_now': 'Just now',
    'time.m_ago': 'm ago',
    'time.h_ago': 'h ago',
    'time.d_ago': 'd ago',
  },

  ta: {
    // Portals
    'portal.citizen': 'குடிமக்கள் போர்டல்',
    'portal.command': 'கட்டளை மையம்',
    'portal.rescue': 'மீட்பு நடவடிக்கைகள்',
    'portal.hospital': 'மருத்துவமனை போர்டல்',
    'portal.admin': 'நிர்வாகி',
    'portal.select': 'போர்டல் தேர்வுசெய்க',

    // Section Titles
    'section.command_center': 'கட்டளை மையம்',
    'section.operations': 'செயல்பாடுகள்',
    'section.intelligence': 'நுண்ணறிவு & AI',
    'section.system': 'கணினி முறைமை',
    'section.configuration': 'கட்டமைப்பு',
    'section.actions': 'விரைவு நடவடிக்கைகள்',

    // Sidebar & Navigation
    'nav.dashboard': 'முகப்பு பலகை',
    'nav.map': 'நேரடி வரைபடம்',
    'nav.incidents': 'சம்பவங்கள்',
    'nav.ai_analysis': 'AI பகுப்பாய்வு',
    'nav.prediction': 'முன்கணிப்பு',
    'nav.rescue_ops': 'மீட்புப்பணி',
    'nav.resources': 'வளங்கள்',
    'nav.hospitals': 'மருத்துவமனைகள்',
    'nav.copilot': 'நோவா கோபைலட்',
    'nav.alerts': 'எச்சரிக்கைகள்',
    'nav.analytics': 'பகுப்பாய்வு',
    'nav.sos': 'SOS அவசரநிலை',
    'nav.safety': 'பாதுகாப்பு கையேடு',
    'nav.reports': 'எனது புகார்கள்',
    'nav.team_status': 'குழு நிலை',
    'nav.navigation': 'வழி வழிகாட்டுதல்',
    'nav.triage': 'முன்னுரிமை வரிசை',
    'nav.incoming': 'வருகை',
    'nav.capacity': 'படுக்கை கொள்ளளவு',
    'nav.ambulances': 'ஆம்புலன்ஸ்கள்',
    'nav.users': 'பயனர்கள்',
    'nav.organizations': 'அமைப்புகள்',
    'nav.audit_logs': 'தணிக்கை பதிவுகள்',
    'nav.ai_config': 'AI கட்டமைப்பு',
    'nav.monitoring': 'கண்காணிப்பு',

    // Stats / KPI Labels
    'stats.active_incidents': 'செயலில் உள்ள சம்பவங்கள்',
    'stats.critical': 'தீவிர அவசரநிலை',
    'stats.people_affected': 'பாதிக்கப்பட்ட மக்கள்',
    'stats.teams_deployed': 'மீட்புக் குழுக்கள்',
    'stats.avg_response': 'சராசரி பதில் நேரம்',
    'stats.ai_predictions': 'AI கணிப்புகள்',
    'stats.total_users': 'மொத்த பயனர்கள்',
    'stats.ai_analyses_today': 'இன்றைய AI பகுப்பாய்வுகள்',
    'stats.system_uptime': 'கணினி இயங்கு நேரம்',
    'stats.available_beds': 'கிடைக்கும் படுக்கைகள்',
    'stats.icu_available': 'ICU படுக்கைகள்',
    'stats.medical_teams': 'மருத்துவக் குழுக்கள்',
    'stats.incoming_cases': 'வருகை தரும் நோயாளிகள்',
    'stats.team_members': 'குழு உறுப்பினர்கள்',
    'stats.equipment_items': 'உபகரணங்கள்',
    'stats.active_assignment': 'செயலில் உள்ள பணி',
    'stats.status': 'நிலை',
    'stats.eta_minutes': 'வருகை நேரம் (நிமிடம்)',

    // Common Action buttons
    'btn.report': 'அவசரநிலையைப் புகாரளி',
    'btn.sos': 'SOS தூண்டு',
    'btn.start_sim': 'அனுவகப்படுத்துதலைத் தொடங்கு',
    'btn.stop_sim': 'அனுவகப்படுத்துதலை நிறுத்து',
    'btn.select_portal': 'போர்டல் தேர்வுசெய்',
    'btn.sign_out': 'வெளியேறு / உள்நுழை',
    'btn.home': 'முதன்மைப் பக்கம்',
    'btn.auto_assign': 'தானியங்கி ஒதுக்கீடு',
    'btn.dispatch': 'மீட்புக் குழுவை அனுப்பு',
    'btn.resolve': 'தீர்க்கப்பட்டது என குறி',
    'btn.gps': 'வழிகாட்டுதலைத் தொடங்கு',
    'btn.view_all': 'அனைத்தையும் பார்',
    'btn.filter': 'வடிகட்டுக',
    'btn.search': 'தேடுக',
    'btn.edit': 'திருத்து',
    'btn.manage': 'நிர்வகி',
    'btn.submit_report': 'அவசர அறிக்கையைப் பதிவுசெய்க',
    'btn.submitting': 'அறிக்கை சமர்ப்பிக்கப்படுகிறது...',
    'btn.save_config': 'இருப்பு வரம்புகளை சேமிக்க',
    'btn.update_ai': 'AI அனுமான அமைப்புகளை புதுப்பிக்க',
    'btn.arrival_scene': 'சம்பவ இடத்தை அடைந்ததை பதிவுசெய்க',
    'btn.start_mission_nav': 'மீட்புப் பணி வழிசெலுத்தலைத் தொடங்கு',
    'btn.track_dispatch': 'மீட்பு வாகனத்தைக் கண்காணிக்க',

    // Headings & Labels
    'heading.queue': 'AI முன்னுரிமை வரிசை',
    'heading.triage_action': 'அவசர சிகிச்சை நடவடிக்கைகள்',
    'heading.crew': 'எனது மீட்புக் குழுவினர்',
    'heading.safety_guide': 'பாதுகாப்பு வழிகாட்டுதல்கள்',
    'heading.command_center': 'கட்டளை மையம்',
    'heading.authority_dashboard': 'அவசரகால அதிகார முகப்பு',
    'heading.team_status': 'குழு நிலை',
    'heading.risk_overview': 'ஆபத்து மேலோட்டம்',
    'heading.full_prediction': 'முழு முன்கணிப்பு',
    'heading.view_all': 'அனைத்தையும் பார்',
    'heading.rescue_deployments': 'மீட்புக் குழு தயாரிப்புகள்',
    'heading.resources_inventory': 'அவசரகால வளங்கள் இருப்பு',
    'heading.hospital_capacity': 'மருத்துவமனை கொள்ளளவு மற்றும் தீவிர சிகிச்சை நிலை',
    'heading.alert_logs': 'அறிவிப்புகள் மற்றும் எச்சரிக்கை பதிவுகள்',
    'heading.assigned_incidents': 'ஒதுக்கப்பட்ட சம்பவங்களின் வரிசை',
    'heading.mission_navigation': 'மீட்புப் பணி வழி வழிகாட்டுதல்',
    'heading.mission_details': 'பணி விவரங்கள்',
    'heading.roster': 'குழுவினர் பட்டியல்',
    'heading.incoming_emergencies': 'வருகை தரும் அவசர நோயாளிகள்',
    'heading.triage_queue': 'நோயாளி சிகிச்சை முன்னுரிமை வரிசை',
    'heading.ward_capacity': 'படுக்கை கொள்ளளவு சரிசெய்தல்',
    'heading.ambulance_fleet': 'ஆம்புலன்ஸ் வாகனக் குழுப் பதிவு',
    'heading.user_directory': 'பயனர் கணக்குகள் அடைவு',
    'heading.organizations': 'ஒத்துழைக்கும் பேரிடர் அமைப்புகள்',
    'heading.reserves_config': 'வள இருப்பு கட்டமைப்பு',
    'heading.ai_model_config': 'AI மாதிரி அளவுரு கட்டமைப்பு',
    'heading.system_monitoring': 'கணினி கண்காணிப்பு',
    'heading.audit_logs_full': 'நிர்வாக தணிக்கை பதிவுகள்',
    'heading.distress_form': 'அவசரகால பேரிடர் புகாரைப் பதிவுசெய்க',
    'heading.my_reports': 'எனது அவசரக்கால புகார்கள்',
    'heading.safety_guidelines': 'பாதுகாப்பு வழிகாட்டுதல்கள்',
    'heading.disaster_prediction': 'பேரிடர் முன்கணிப்பு',
    'heading.system_dashboard': 'கணினி கட்டுப்பாட்டுப் பலகை',
    'heading.rescue_dashboard': 'மீட்பு முகப்புப் பலகை',
    'heading.hospital_dashboard': 'மருத்துவமனை முகப்புப் பலகை',
    'heading.citizen_dashboard': 'குடிமக்கள் முகப்புப் பலகை',
    'heading.system_health': 'கணினி இயக்க நிலை கண்காணிப்பு',
    'heading.users_by_role': 'பணி வாரியான பயனர்கள்',
    'heading.ai_config': 'AI கட்டமைப்பு',
    'heading.recent_audit_logs': 'சமீபத்திய தணிக்கை பதிவுகள்',

    // Copilot
    'copilot.situation_summary': 'சூழ்நிலை சுருக்கம்',
    'copilot.risk_alert': 'ஆபத்து எச்சரிக்கை',
    'copilot.recommendation': 'பரிந்துரை',
    'copilot.summary_text': 'மண்டலம் 4 இல் தற்போது 2 வெள்ள அவசரநிலைகள் மற்றும் சிக்கிய பொதுமக்கள் உட்பட 6 தீவிர சம்பவங்கள் உள்ளன. டிப்போ B இலிருந்து மாற்று மீட்பு படகை அனுப்ப பரிந்துரைக்கிறேன்.',
    'copilot.risk_text': 'ஆற்று நீர் மட்டம் 4.8 மீ - ஆபத்தான அளவை விட 23% அதிகம். மண்டலம் 4 இல் வசிப்பவர்கள் 2 மணி நேரத்திற்குள் வெளியேற்றப்பட வேண்டும்.',
    'copilot.rec_text': 'தங்குமிடம் B ஐ உடனடியாக செயல்படுத்தவும். 2 மீட்பு படகுகளை மண்டலம் 4 இன் முகாமுக்கு நகர்த்தவும். களனி மருத்துவமனைக்கு எச்சரிக்கை அனுப்பவும்.',
    'copilot.full_copilot': 'முழு கோபைலட்டைத் திற',
    'copilot.ask_placeholder': 'செயலில் உள்ள சம்பவங்கள், குழுக்கள் அல்லது அபாயங்கள் பற்றி நோவா கோபைலட்டிடம் கேளுங்கள்...',

    // Common Phrases / Units
    'common.affected': 'பாதிக்கப்பட்டோர்',
    'common.min': 'நிமிடம்',
    'common.eta': 'வருகை நேரம்',
    'common.confidence': 'நம்பகத்தன்மை',
    'common.live': 'நேரலை',
    'common.active': 'செயலில்',
    'common.ready': 'தயார் நிலை',
    'common.online': 'இணைப்பில் உள்ளது',
    'common.degraded': 'மந்த நிலை',
    'common.search_placeholder': 'சம்பவங்கள், குழுக்கள், பகுதிகளைத் தேடுக...',
    'common.notifications': 'அறிவிப்புகள்',
    'common.mark_all_read': 'அனைத்தையும் வாசித்ததாக குறி',
    'common.view_all_notifications': 'அனைத்து அறிவிப்புகளையும் பார்க்க',
    'common.no_active_incidents': 'செயலில் சம்பவங்கள் இல்லை',
    'common.no_active_reports': 'செயலில் உள்ள புகார்கள் இல்லை',
    'common.current': 'தற்போதைய நிலை',
    'common.ai_analyzed': 'AI பகுப்பாய்வு செய்கிறது',

    // Severities
    'severity.critical': 'தீவிரம்',
    'severity.high': 'உயர்',
    'severity.medium': 'நடுத்தரம்',
    'severity.low': 'குறைவு',

    // Statuses
    'status.reported': 'பதிவானது',
    'status.ai_analyzed': 'AI பகுப்பாய்வு',
    'status.prioritized': 'முன்னுரிமை அளிக்கப்பட்டது',
    'status.assigned': 'ஒதுக்கப்பட்டது',
    'status.en_route': 'வழியில் உள்ளது',
    'status.responding': 'சம்பவ இடத்தில்',
    'status.resolved': 'தீர்க்கப்பட்டது',
    'status.closed': 'முடிக்கப்பட்டது',
    'status.available': 'கிடைக்கக்கூடியது',
    'status.on_scene': 'சம்பவ இடத்தில்',
    'status.standby': 'தயார் நிலை',
    'status.low_stock': 'குறைந்த இருப்பு',
    'status.critical_stock': 'ஆபத்தான இருப்பு',
    'status.dispatched': 'அனுப்பப்பட்டது',

    // Emergency Types
    'type.flood': '🌊 வெள்ளப்பெருக்கு',
    'type.landslide': '⛰️ நிலச்சரிவு',
    'type.fire': '🔥 தீ விபத்து',
    'type.road_accident': '🚗 சாலை விபத்து',
    'type.medical': '🏥 மருத்துவ அவசரநிலை',
    'type.missing_person': '👤 காணாமல் போனவர்',
    'type.building_collapse': '🏚️ கட்டிட இடிவு',
    'type.severe_weather': '🌪️ கடும் வானிலை',
    'type.other': '⚠️ பிற அவசரநிலை',

    // Relative Time
    'time.just_now': 'சற்று முன்',
    'time.m_ago': 'நிமிடம் முன்',
    'time.h_ago': 'மணி முன்',
    'time.d_ago': 'நாட்கள் முன்',
  },

  si: {
    // Portals
    'portal.citizen': 'පුරවැසි ද්වාරය',
    'portal.command': 'විධාන මධ්‍යස්ථානය',
    'portal.rescue': 'මුදාගැනීමේ මෙහෙයුම්',
    'portal.hospital': 'රෝහල් ද්වාරය',
    'portal.admin': 'පරිපාලක',
    'portal.select': 'ද්වාරය තෝරන්න',

    // Section Titles
    'section.command_center': 'විධාන මධ්‍යස්ථානය',
    'section.operations': 'මෙහෙයුම්',
    'section.intelligence': 'බුද්ධි අංශ සහ AI',
    'section.system': 'පද්ධතිය',
    'section.configuration': 'සැකසුම්',
    'section.actions': 'ක්ෂණික ක්‍රියාමාර්ග',

    // Sidebar & Navigation
    'nav.dashboard': 'ප්‍රධාන පුවරුව',
    'nav.map': 'සජීවී සිතියම',
    'nav.incidents': 'සිදුවීම්',
    'nav.ai_analysis': 'AI විශ්ලේෂණය',
    'nav.prediction': 'අනාවැකි',
    'nav.rescue_ops': 'මුදාගැනීම්',
    'nav.resources': 'සම්පත්',
    'nav.hospitals': 'රෝහල්',
    'nav.copilot': 'NOVA සහායකයා',
    'nav.alerts': 'නිවේදන',
    'nav.analytics': 'විශ්ලේෂණ',
    'nav.sos': 'SOS හදිසි ඇමතුම්',
    'nav.safety': 'ආරක්ෂිත උපදෙස්',
    'nav.reports': 'මගේ වාර්තා',
    'nav.team_status': 'කණ්ඩායම් තත්ත්වය',
    'nav.navigation': 'මාර්ග සංචලනය',
    'nav.triage': 'ප්‍රමුඛතා පෝලිම',
    'nav.incoming': 'පැමිණෙන',
    'nav.capacity': 'ධාරිතාවය',
    'nav.ambulances': 'ගිලන්රථ',
    'nav.users': 'පරිශීලකයින්',
    'nav.organizations': 'සංවිධාන',
    'nav.audit_logs': 'පද්ධති ලඝු-සටහන්',
    'nav.ai_config': 'AI සැකසුම්',
    'nav.monitoring': 'නිරීක්ෂණ',

    // Stats / KPI Labels
    'stats.active_incidents': 'සක්‍රිය සිදුවීම්',
    'stats.critical': 'අතිශය හදිසි',
    'stats.people_affected': 'බලපෑමට ලක්වූවන්',
    'stats.teams_deployed': 'යොදවා ඇති කණ්ඩායම්',
    'stats.avg_response': 'සරාසරි ප්‍රතිචාර කාලය',
    'stats.ai_predictions': 'AI අනාවැකි',
    'stats.total_users': 'මුළු පරිශීලකයින්',
    'stats.ai_analyses_today': 'අද දින AI විශ්ලේෂණ',
    'stats.system_uptime': 'පද්ධති ක්‍රියාකාරිත්වය',
    'stats.available_beds': 'පවතින ඇඳන්',
    'stats.icu_available': 'ICU ඇඳන්',
    'stats.medical_teams': 'වෛද්‍ය කණ්ඩායම්',
    'stats.incoming_cases': 'පැමිණෙන රෝගීන්',
    'stats.team_members': 'කණ්ඩායම් සාමාජිකයින්',
    'stats.equipment_items': 'උපකරණ',
    'stats.active_assignment': 'ක්‍රියාකාරී මෙහෙයුම්',
    'stats.status': 'තත්ත්වය',
    'stats.eta_minutes': 'පැමිණීමේ කාලය (මිනි)',

    // Common Action buttons
    'btn.report': 'හදිසි සිදුවීමක් වාර්තා කරන්න',
    'btn.sos': 'SOS සක්‍රිය කරන්න',
    'btn.start_sim': 'අනුකරණය අරඹන්න',
    'btn.stop_sim': 'අනුකරණය නවත්වන්න',
    'btn.select_portal': 'ද්වාරය තෝරන්න',
    'btn.sign_out': 'පද්ධතියෙන් ඉවත් වන්න',
    'btn.home': 'මුල් පිටුව',
    'btn.auto_assign': 'කණ්ඩායම ස්වයංක්‍රීයව යොදවන්න',
    'btn.dispatch': 'කණ්ඩායම පිටත් කර හරින්න',
    'btn.resolve': 'විසඳන ලදී',
    'btn.gps': 'මඟපෙන්වීම අරඹන්න',
    'btn.view_all': 'සියල්ල බලන්න',
    'btn.filter': 'පෙරහන් කරන්න',
    'btn.search': 'සොයන්න',
    'btn.edit': 'සංස්කරණය',
    'btn.manage': 'කළමනාකරණය',
    'btn.submit_report': 'හදිසි ආපදා වාර්තාවක් ඉදිරිපත් කරන්න',
    'btn.submitting': 'වාර්තාව යොමු කෙරෙමින් පවතී...',
    'btn.save_config': 'තොග සීමාවන් සුරකින්න',
    'btn.update_ai': 'AI ආකෘති සැකසුම් යාවත්කාලීන කරන්න',
    'btn.arrival_scene': 'ස්ථානයට ළඟාවීම සලකුණු කරන්න',
    'btn.start_mission_nav': 'මෙහෙයුම් සංචලනය අරඹන්න',
    'btn.track_dispatch': 'සහන රථය නිරීක්ෂණය කරන්න',

    // Headings & Labels
    'heading.queue': 'AI ප්‍රමුඛතා පෝලිම',
    'heading.triage_action': 'ප්‍රතිකාර ක්‍රියාමාර්ග',
    'heading.crew': 'මගේ සහන සේවා කණ්ඩායම',
    'heading.safety_guide': 'ආරක්ෂිත මාර්ගෝපදේශ',
    'heading.command_center': 'විධාන මධ්‍යස්ථානය',
    'heading.authority_dashboard': 'හදිසි අවස්ථා කළමනාකරණ පුවරුව',
    'heading.team_status': 'කණ්ඩායම් තත්ත්වය',
    'heading.risk_overview': 'අවදානම් දළ විශ්ලේෂණය',
    'heading.full_prediction': 'සම්පූර්ණ අනාවැකිය',
    'heading.view_all': 'සියල්ල බලන්න',
    'heading.rescue_deployments': 'සහන සේවා කණ්ඩායම් යෙදවීම්',
    'heading.resources_inventory': 'හදිසි සම්පත් තොගය',
    'heading.hospital_capacity': 'රෝහල් ධාරිතාවය සහ දැඩි සත්කාර තත්ත්වය',
    'heading.alert_logs': 'අනතුරු ඇඟවීමේ ලඝු-සටහන්',
    'heading.assigned_incidents': 'නියමිත සිදුවීම් පෝලිම',
    'heading.mission_navigation': 'මෙහෙයුම් මාර්ග සිතියම',
    'heading.mission_details': 'මෙහෙයුම් විස්තර',
    'heading.roster': 'සේවා කණ්ඩායම් නාමලේඛනය',
    'heading.incoming_emergencies': 'පැමිණෙන හදිසි රෝගීන්',
    'heading.triage_queue': 'රෝගී වර්ගීකරණ ප්‍රමුඛතා පෝලිම',
    'heading.ward_capacity': 'රෝහල් ධාරිතා ගැලපීම්',
    'heading.ambulance_fleet': 'ගිලන්රථ ධාවන ලඝු-සටහන',
    'heading.user_directory': 'පරිශීලක ගිණුම් නාමාවලිය',
    'heading.organizations': 'සහයෝගීතා ආයතන ලැයිස්තුව',
    'heading.reserves_config': 'හදිසි තොග සැකසුම්',
    'heading.ai_model_config': 'AI ආදර්ශ සැකසුම්',
    'heading.system_monitoring': 'පද්ධති නිරීක්ෂණ',
    'heading.audit_logs_full': 'පරිපාලක විගණන ලඝු-සටහන්',
    'heading.distress_form': 'හදිසි ආපදා වාර්තාවක් ඉදිරිපත් කරන්න',
    'heading.my_reports': 'මගේ හදිසි වාර්තා',
    'heading.safety_guidelines': 'ආරක්ෂිත මාර්ගෝපදේශ',
    'heading.disaster_prediction': 'ආපදා අනාවැකි පද්ධතිය',
    'heading.system_dashboard': 'පද්ධති පාලන පුවරුව',
    'heading.rescue_dashboard': 'මුදාගැනීමේ මෙහෙයුම් පුවරුව',
    'heading.hospital_dashboard': 'රෝහල් කළමනාකරණ පුවරුව',
    'heading.citizen_dashboard': 'පුරවැසි සේවා පුවරුව',
    'heading.system_health': 'පද්ධති සෞඛ්‍ය නිරීක්ෂණය',
    'heading.users_by_role': 'කාර්යභාරය අනුව පරිශීලකයින්',
    'heading.ai_config': 'AI ආකෘති සැකසුම්',
    'heading.recent_audit_logs': 'මෑතකාලීන පද්ධති ලඝු-සටහන්',

    // Copilot
    'copilot.situation_summary': 'තත්ත්ව සාරාංශය',
    'copilot.risk_alert': 'අවදානම් නිවේදනය',
    'copilot.recommendation': 'නිර්දේශය',
    'copilot.summary_text': 'කලාපය 4 හි මේ වන විට ගංවතුර හදිසි අවස්ථා 2ක් සහ සිරවී සිටින සිවිල් වැසියන් ඇතුළු බරපතල සිදුවීම් 6ක් පවතී. ඩිපෝ B වෙතින් අතිරේක බෝට්ටුව යෙදවීමට නිර්දේශ කරමි.',
    'copilot.risk_text': 'ගංගා ජල මට්ටම මීටර් 4.8 කි - අනතුරු ඇඟවීමේ සීමාවට වඩා 23% වැඩිය. පැය 2ක් ඇතුළත කලාපය 4 වැසියන් ඉවත් කළ යුතුය.',
    'copilot.rec_text': 'ප්‍රතිකාර මධ්‍යස්ථානය B සක්‍රිය කරන්න. කලාපය 4 වෙත බෝට්ටු 2ක් යොමු කරන්න. කැලණිය රෝහල සූදානම් කරන්න.',
    'copilot.full_copilot': 'සම්පූර්ණ සහායකයා වෙත',
    'copilot.ask_placeholder': 'සිදුවීම්, කණ්ඩායම් හෝ අවදානම් ගැන NOVA AI සහායකයාගෙන් විමසන්න...',

    // Common Phrases / Units
    'common.affected': 'බලපෑමට ලක්වූවන්',
    'common.min': 'මිනිත්තු',
    'common.eta': 'පැමිණීමේ කාලය',
    'common.confidence': 'විශ්වාසනීයත්වය',
    'common.live': 'සජීවී',
    'common.active': 'ක්‍රියාකාරී',
    'common.ready': 'සූදානම්',
    'common.online': 'සම්බන්ධිතයි',
    'common.degraded': 'මන්දගාමී',
    'common.search_placeholder': 'සිදුවීම්, කණ්ඩායම්, කලාප සොයන්න...',
    'common.notifications': 'නිවේදන',
    'common.mark_all_read': 'සියල්ල කියවූ බව සලකුණු කරන්න',
    'common.view_all_notifications': 'සියලු නිවේදන බලන්න',
    'common.no_active_incidents': 'සක්‍රිය සිදුවීම් නොමැත',
    'common.no_active_reports': 'සක්‍රිය වාර්තා නොමැත',
    'common.current': 'වර්තමාන',
    'common.ai_analyzed': 'AI විශ්ලේෂණය කරමින්',

    // Severities
    'severity.critical': 'අතිශය හදිසි',
    'severity.high': 'ඉහළ',
    'severity.medium': 'මධ්‍යම',
    'severity.low': 'අඩු',

    // Statuses
    'status.reported': 'වාර්තා විය',
    'status.ai_analyzed': 'AI විශ්ලේෂණය',
    'status.prioritized': 'ප්‍රමුඛතාවය දෙන ලදී',
    'status.assigned': 'කණ්ඩායම නියමිතයි',
    'status.en_route': 'මඟ ගමන් කරමින්',
    'status.responding': 'ස්ථානයට පැමිණ ඇත',
    'status.resolved': 'විසඳන ලදී',
    'status.closed': 'අවසන්',
    'status.available': 'සූදානම්',
    'status.on_scene': 'ස්ථානයට පැමිණ ඇත',
    'status.standby': 'සූදානමින්',
    'status.low_stock': 'අඩු තොග',
    'status.critical_stock': 'අවදානම් තොග',
    'status.dispatched': 'පිටත් කර යවන ලදී',

    // Emergency Types
    'type.flood': '🌊 ගංවතුර',
    'type.landslide': '⛰️ නායයාම',
    'type.fire': '🔥 ගිනිගැනීම',
    'type.road_accident': '🚗 රිය අනතුර',
    'type.medical': '🏥 වෛද්‍ය හදිසි අවස්ථාව',
    'type.missing_person': '👤 අතුරුදහන් වූ අයෙක්',
    'type.building_collapse': '🏚️ ගොඩනැගිලි කඩාවැටීම',
    'type.severe_weather': '🌪️ අයහපත් කාලගුණය',
    'type.other': '⚠️ වෙනත් හදිසි අවස්ථා',

    // Relative Time
    'time.just_now': 'මීට සුළු වේලාවකට පෙර',
    'time.m_ago': 'මිනි පෙර',
    'time.h_ago': 'පැය පෙර',
    'time.d_ago': 'දින පෙර',
  }
};

// ─── Dynamic Translation Table for Mock Data & Free Text ─────────

const DYNAMIC_TEXT_TRANSLATIONS: Record<string, { ta: string; si: string }> = {
  // Incidents Titles
  'House surrounded by floodwater — elderly trapped': {
    ta: 'வெள்ளத்தால் சூழப்பட்ட வீடு — முதியவர் சிக்கியுள்ளார்',
    si: 'ගංවතුරෙන් වටවූ නිවස — වැඩිහිටියෙකු සිරවී ඇත',
  },
  'Residential collapse risk — family of 6 stranded on rooftop': {
    ta: 'வீடு இடிந்து விழும் அபாயம் — கூரையில் 6 பேர் கொண்ட குடும்பம் தவிப்பு',
    si: 'නිවස කඩාවැටීමේ අවදානම — වහලය මත පවුලේ 6 දෙනෙකු සිරවී ඇත',
  },
  'Landslide on hillside road — bus with 18 passengers partially buried': {
    ta: 'மலைப்பாதையில் நிலச்சரிவு — 18 பயணிகளுடன் பேருந்து பகுதி புதையுண்டது',
    si: 'කඳුකර මාර්ගයේ නායයාමක් — මගීන් 18ක් සහිත බස් රථය අර්ධ වශයෙන් යටවිය',
  },
  'Factory chemical spill during heavy storm flooding': {
    ta: 'கடும் புயல் வெள்ளத்தின் போது தொழிற்சாலையில் இரசாயனக் கசிவு',
    si: 'දැඩි කුණාටු ගංවතුර අතරතුර කර්මාන්තශාලා රසායනික කාන්දුවක්',
  },
  'Bridge collapse isolated community of ~200 residents': {
    ta: 'பாலம் இடிந்து விழுந்ததால் ~200 குடியிருப்பாளர்கள் தனிமைப்படுத்தப்பட்டனர்',
    si: 'පාලම කඩාවැටීමෙන් ~200ක ජනතාවක් හුදකලා විය',
  },
  'Hospital power failure — backup generator flooded': {
    ta: 'மருத்துவமனை மின் தடை — அவசர ஜெனரேட்டர் வெள்ளத்தில் மூழ்கியது',
    si: 'රෝහල් විදුලිය විසන්ධි වීම — අතිරේක ජනන යන්ත්‍රය ගංවතුරට හසුවිය',
  },
  'Water level rising rapidly near school — 45 children shelter on 2nd floor': {
    ta: 'பள்ளிக்கு அருகில் நீர்மட்டம் வேகமாக உயர்கிறது — 45 குழந்தைகள் 2வது தளத்தில் தஞ்சம்',
    si: 'පාසල අසල ජල මට්ටම වේගයෙන් ඉහළ යයි — ළමුන් 45ක් 2 වන මහලේ සිරවී ඇත',
  },
  'Fallen electrical line submerged in floodwater on main road': {
    ta: 'பிரதான சாலையில் வெள்ளநீரில் மூழ்கிய மின்கம்பி',
    si: 'ප්‍රධාන මාර්ගයේ ගංවතුරට හසුවූ විදුලි රැහැනක්',
  },

  // Descriptions
  'Entire ground floor submerged. Elderly man unable to move. Water still rising. Located near Kelani River bank.': {
    ta: 'முழு தரைத்தளமும் நீரில் மூழ்கியுள்ளது. முதியவர் நகர முடியவில்லை. தண்ணீர் தொடர்ந்து உயர்கிறது. களனி ஆற்றங்கரை அருகில்.',
    si: 'මුළු බිම් මහලම ජලයෙන් යටවී ඇත. වැඩිහිටි පුද්ගලයාට ඇවිදීමට නොහැක. ජලය තවමත් ඉහළ යයි. කැලණි ගඟ අසල.',
  },
  'Family of 6 including a pregnant woman stranded on rooftop. Structural damage visible. Water level at 1.5m.': {
    ta: 'கர்ப்பிணிப் பெண் உட்பட 6 பேர் கொண்ட குடும்பம் கூரையில் தவிப்பு. கட்டிட சேதம் தெரிகிறது. நீர்மட்டம் 1.5 மீ.',
    si: 'ගර්භනී කාන්තාවක් ඇතුළු 6 දෙනෙකුගෙන් යුත් පවුලක් වහලය මත සිරවී ඇත. ව්‍යුහාත්මක හානි පෙනේ. ජල මට්ටම මීටර් 1.5 කි.',
  },
  'Slope failure collapsed onto private intercity bus. 18 aboard, several injuries reported. Road completely blocked.': {
    ta: 'தனியார் பேருந்தின் மீது சரிவு இடிந்து விழுந்தது. 18 பயணிகள் இருந்தனர், பலருக்கு காயம். சாலை முழுமையாக மூடப்பட்டது.',
    si: 'පෞද්ගලික බස් රථයක් මතට පස් කන්දක් කඩාවැටී ඇත. 18 දෙනෙකු සිටින අතර කිහිප දෙනෙකුට තුවාල සිදුව ඇත. මාර්ගය සම්පූර්ණයෙන්ම අවහිරයි.',
  },

  // AI Recommended Actions
  'Deploy nearest rescue team immediately. Priority evacuation for elderly.': {
    ta: 'அருகிலுள்ள மீட்புக் குழுவை உடனடியாக அனுப்பவும். முதியவருக்கு முன்னுரிமை வெளியேற்றம்.',
    si: 'ළඟම ඇති සහන කණ්ඩායම වහාම යොදවන්න. වැඩිහිටියන් ප්‍රමුඛතාවයෙන් ඉවත් කරන්න.',
  },
  'Immediate extraction. Pregnant woman needs medical attention.': {
    ta: 'உடனடி மீட்பு தேவை. கர்ப்பிணிப் பெண்ணுக்கு மருத்துவ சிகிச்சை தேவை.',
    si: 'ක්ෂණික මුදාගැනීම. ගර්භනී කාන්තාවට වෛද්‍ය ප්‍රතිකාර අවශ්‍යයි.',
  },
  'Heavy excavation equipment and multiple ambulances required immediately.': {
    ta: 'கனரக அகழ்வாராய்ச்சி உபகரணங்கள் மற்றும் பல ஆம்புலன்ஸ்கள் உடனடியாக தேவைப்படுகின்றன.',
    si: 'බැර කැණීම් උපකරණ සහ ගිලන් රථ කිහිපයක් වහාම අවශ්‍ය වේ.',
  },
  'Hazardous materials containment team needed. Evacuate 500m radius.': {
    ta: 'அபாயகரமான பொருட்கள் கட்டுப்பாட்டுக் குழு தேவை. 500மீ சுற்றளவை வெளியேற்றவும்.',
    si: 'අන්තරායකර ද්‍රව්‍ය පාලන කණ්ඩායමක් අවශ්‍යයි. මීටර් 500ක ප්‍රදේශය ඉවත් කරන්න.',
  },
  'Helicopter air-drop supplies and boat evacuation required.': {
    ta: 'ஹெலிகாப்டர் மூலம் நிவாரணப் பொருட்கள் மற்றும் படகு மூலம் வெளியேற்றம் தேவை.',
    si: 'හෙලිකොප්ටර් මගින් සහනාධාර දැමීම සහ බෝට්ටු මගින් ඉවත් කිරීම අවශ්‍යයි.',
  },
  'Mobile emergency generator dispatch urgent. Priority 1 critical.': {
    ta: 'அவசர மொபைல் ஜெனரேட்டரை உடனடியாக அனுப்பவும். முன்னுரிமை 1 தீவிரமானது.',
    si: 'හදිසි ජංගම ජනන යන්ත්‍රයක් පිටත් කර හැරීම අත්‍යවශ්‍යයි. ප්‍රමුඛතාවය 1 අතිශය හදිසි.',
  },

  // Timeline / Notes / Updates
  'Emergency report received from citizen.': {
    ta: 'குடிமகனிடமிருந்து அவசரப் புகார் பெறப்பட்டது.',
    si: 'පුරවැසියාගෙන් හදිසි ආපදා වාර්තාව ලැබිණි.',
  },
  'AI analysis complete. Severity: Critical. 5 affected.': {
    ta: 'AI பகுப்பாய்வு முடிந்தது. தீவிரம்: சிக்கலானது. 5 பேர் பாதிக்கப்பட்டுள்ளனர்.',
    si: 'AI විශ්ලේෂණය සම්පූර්ණයි. බරපතලකම: අතිශය හදිසි. 5 දෙනෙකුට බලපෑම්.',
  },
  'Team Bravo assigned to this incident.': {
    ta: 'பிராவோ குழு இந்த சம்பவத்திற்கு ஒதுக்கப்பட்டது.',
    si: 'මෙම සිදුවීම සඳහා බ්‍රාවෝ කණ්ඩායම පත් කරන ලදී.',
  },
  'Team Bravo is en route. ETA: 8 minutes.': {
    ta: 'பிராவோ குழு வழியில் உள்ளது. வருகை நேரம்: 8 நிமிடங்கள்.',
    si: 'බ්‍රාවෝ කණ්ඩායම ගමන් කරමින් සිටී. පැමිණීමේ කාලය: මිනිත්තු 8 යි.',
  },
  'Team Alpha assigned to this incident.': {
    ta: 'ஆல்பா குழு இந்த சம்பவத்திற்கு ஒதுக்கப்பட்டது.',
    si: 'මෙම සිදුවීම සඳහා ඇල්ෆා කණ්ඩායම පත් කරන ලදී.',
  },
  'Team Alpha is en route. ETA: 5 minutes.': {
    ta: 'ஆல்பா குழு வழியில் உள்ளது. வருகை நேரம்: 5 நிமிடங்கள்.',
    si: 'ඇල්ෆා කණ්ඩායම ගමන් කරමින් සිටී. පැමිණීමේ කාලය: මිනිත්තු 5 යි.',
  },
  'Critical incident flagged. Team Bravo recommended based on proximity and equipment.': {
    ta: 'தீவிர சம்பவம் கொடியிடப்பட்டது. தூரம் மற்றும் உபகரணங்களின் அடிப்படையில் பிராவோ குழு பரிந்துரைக்கப்பட்டது.',
    si: 'තීරණාත්මක සිදුවීමක් සලකුණු කර ඇත. සමීපත්වය සහ උපකරණ මත පදනම්ව බ්‍රාවෝ කණ්ඩායම නිර්දේශ කෙරේ.',
  },
  'Team Bravo confirmed and dispatched.': {
    ta: 'பிராவோ குழு உறுதிசெய்யப்பட்டு அனுப்பப்பட்டது.',
    si: 'බ්‍රාවෝ කණ්ඩායම තහවුරු කර පිටත් කර හරින ලදී.',
  },

  // Locations / Districts / Zones
  'Colombo': { ta: 'கொழும்பு', si: 'කොළඹ' },
  'Gampaha': { ta: 'கம்பஹா', si: 'ගම්පහ' },
  'Kalutara': { ta: 'களுத்துறை', si: 'කළුතර' },
  'Kandy': { ta: 'கண்டி', si: 'මහනුවර' },
  'Ratnapura': { ta: 'இரத்தினபுரி', si: 'රත්නපුර' },
  'Galle': { ta: 'காலி', si: 'ගාල්ල' },
  'Matara': { ta: 'மாத்தறை', si: 'මාතර' },
  'Jaffna': { ta: 'யாழ்ப்பாணம்', si: 'යාපනය' },
  'Zone 01': { ta: 'மண்டலம் 01', si: 'කලාපය 01' },
  'Zone 02': { ta: 'மண்டலம் 02', si: 'කලාපය 02' },
  'Zone 03': { ta: 'மண்டலம் 03', si: 'කලාපය 03' },
  'Zone 04': { ta: 'மண்டலம் 04', si: 'කලාපය 04' },
  'Zone 07': { ta: 'மண்டலம் 07', si: 'කලාපය 07' },

  // Team names
  'Team Alpha': { ta: 'ஆல்பா மீட்புக் குழு', si: 'ඇල්ෆා මුදාගැනීමේ කණ්ඩායම' },
  'Team Bravo': { ta: 'பிராவோ மீட்புக் குழு', si: 'බ්‍රාවෝ මුදාගැනීමේ කණ්ඩායම' },
  'Team Charlie': { ta: 'சார்லி மீட்புக் குழு', si: 'චාලි මුදාගැනීමේ කණ්ඩායම' },
  'Team Delta': { ta: 'டெல்டா மீட்புக் குழு', si: 'ඩෙල්ටා මුදාගැනීමේ කණ්ඩායම' },
  'Team Echo': { ta: 'எக்கோ மீட்புக் குழு', si: 'එකෝ මුදාගැනීමේ කණ්ඩායම' },

  // Hospital Names
  'National Hospital Sri Lanka': { ta: 'இலங்கை தேசிய மருத்துவமனை', si: 'ශ්‍රී ලංකා ජාතික රෝහල' },
  'Colombo South Teaching Hospital': { ta: 'கொழும்பு தெற்கு போதனா மருத்துவமனை', si: 'කොළඹ දකුණ ශික්ෂණ රෝහල' },
  'Kelaniya Base Hospital': { ta: 'களனி ஆதார மருத்துவமனை', si: 'කැලණිය මූලික රෝහල' },
  'Sri Jayewardenepura General Hospital': { ta: 'ஸ்ரீ ஜெயவர்த்தனபுர பொது மருத்துவமனை', si: 'ශ්‍රී ජයවර්ධනපුර මහා රෝහල' },
};

// ─── Translation Engine & Helpers ─────────────────────────────

export function localizeText(text: string | undefined | null, lang: string = 'en'): string {
  if (!text) return '';
  if (lang === 'en') return text;

  // Direct match in dynamic table
  if (DYNAMIC_TEXT_TRANSLATIONS[text]) {
    const entry = DYNAMIC_TEXT_TRANSLATIONS[text];
    if (lang === 'ta' && entry.ta) return entry.ta;
    if (lang === 'si' && entry.si) return entry.si;
  }

  // Check dictionary
  const dict = DICTIONARY[lang] || DICTIONARY.en;
  if (dict[text]) return dict[text];

  // Fuzzy substring matches for AI recommendations / prefixes
  for (const [key, val] of Object.entries(DYNAMIC_TEXT_TRANSLATIONS)) {
    if (text.startsWith(key)) {
      const trans = lang === 'ta' ? val.ta : val.si;
      return trans + text.slice(key.length);
    }
  }

  return text;
}

export function formatTimeAgo(dateStr: string, lang: string = 'en'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const dict = DICTIONARY[lang] || DICTIONARY.en;

  if (diffMins < 1) return dict['time.just_now'] || 'Just now';
  if (diffMins < 60) return `${diffMins} ${dict['time.m_ago'] || 'm ago'}`;
  if (diffHours < 24) return `${diffHours} ${dict['time.h_ago'] || 'h ago'}`;
  return `${diffDays} ${dict['time.d_ago'] || 'd ago'}`;
}

export function getSeverityLabel(severity: SeverityLevel, lang: string = 'en'): string {
  const dict = DICTIONARY[lang] || DICTIONARY.en;
  return dict[`severity.${severity}`] || severity.toUpperCase();
}

export function getStatusLabel(status: IncidentStatus | TeamStatus | string, lang: string = 'en'): string {
  const dict = DICTIONARY[lang] || DICTIONARY.en;
  return dict[`status.${status}`] || status.replace('_', ' ').toUpperCase();
}

export function getEmergencyTypeLabel(type: EmergencyType, lang: string = 'en'): string {
  const dict = DICTIONARY[lang] || DICTIONARY.en;
  return dict[`type.${type}`] || type;
}

export function getRiskLabel(riskPercent: number, lang: string = 'en'): string {
  if (riskPercent >= 80) return getSeverityLabel('critical', lang);
  if (riskPercent >= 60) return getSeverityLabel('high', lang);
  if (riskPercent >= 40) return getSeverityLabel('medium', lang);
  return getSeverityLabel('low', lang);
}

export function useTranslation() {
  const language = useNovaStore((state) => state.language) || 'en';

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translations = DICTIONARY[language] || DICTIONARY.en;
    let text = translations[key] || DICTIONARY.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return text;
  };

  const localize = (text: string | undefined | null) => localizeText(text, language);
  const timeAgo = (dateStr: string) => formatTimeAgo(dateStr, language);
  const severityLabel = (sev: SeverityLevel) => getSeverityLabel(sev, language);
  const statusLabel = (st: IncidentStatus | TeamStatus | string) => getStatusLabel(st, language);
  const emergencyTypeLabel = (type: EmergencyType) => getEmergencyTypeLabel(type, language);
  const riskLabel = (risk: number) => getRiskLabel(risk, language);

  return {
    t,
    localize,
    timeAgo,
    severityLabel,
    statusLabel,
    emergencyTypeLabel,
    riskLabel,
    language
  };
}
