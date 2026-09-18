'use client';

import { useEffect, useRef, useState } from 'react';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, MapPin, Users, Clock, Zap, Search, Crosshair } from 'lucide-react';
import type { Incident } from '@/types';
import { useTranslation } from '@/lib/i18n';

// ─── Map Popup Modal ──────────────────────────────────────────

function IncidentPopup({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const { t, localize, severityLabel } = useTranslation();
  return (
    <motion.div
      className="absolute bottom-6 left-6 w-80 em-card border rounded-xl p-4 z-[1000] shadow-2xl backdrop-blur-xl bg-white/95"
      style={{ borderColor: incident.severity === 'critical' ? 'rgba(255,59,59,0.5)' : 'rgba(0,212,255,0.4)' }}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-er-blue-light text-er-blue border border-er-blue/20">
            {incident.id}
          </span>
          <p className="text-sm font-bold text-nova-text mt-1.5 line-clamp-1">{localize(incident.title)}</p>
        </div>
        <button
          onClick={onClose}
          className="text-em-text-muted hover:text-nova-text p-1 rounded-lg hover:bg-em-subtle transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-em-text-muted">{severityLabel('critical')}</span>
          <SeverityBadge severity={incident.severity} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-em-text-muted">Location</span>
          <span className="text-nova-text font-medium">
            {localize(incident.location?.district || '')} {incident.location?.zone ? `· ${localize(incident.location.zone)}` : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-em-text-muted">{t('common.affected')}</span>
          <span className="text-nova-text font-semibold">{incident.peopleAffected} persons</span>
        </div>
        {incident.aiAnalysis && (
          <div className="flex items-center justify-between">
            <span className="text-em-text-muted">AI Confidence</span>
            <span className="text-purple-400 font-semibold">{incident.aiAnalysis.confidenceScore}%</span>
          </div>
        )}
        {incident.assignedTeamName && (
          <div className="flex items-center justify-between">
            <span className="text-em-text-muted">Assigned Team</span>
            <span className="text-er-blue font-medium">{localize(incident.assignedTeamName)}</span>
          </div>
        )}
        {incident.eta !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-em-text-muted">{t('common.eta')}</span>
            <span className="text-er-orange font-semibold">{incident.eta} {t('common.min')}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-em-border/70 text-xs text-em-text-dim">
        <p className="line-clamp-2">
          {incident.aiAnalysis?.recommendedAction ? localize(incident.aiAnalysis.recommendedAction) : 'Awaiting tactical responder update'}
        </p>
      </div>
    </motion.div>
  );
}

import dynamic from 'next/dynamic';

const LazyEmergencyMap = dynamic(
  () => import('@/components/map/EmergencyMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#070b14] flex flex-col items-center justify-center text-xs text-er-blue space-y-3 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-er-blue-light border border-er-blue/40 animate-spin" />
        <p className="font-semibold tracking-wider">INITIALIZING TACTICAL GIS MAP...</p>
      </div>
    ),
  }
);

export default function LiveMapPage() {
  const mapInstanceRef = useRef<any>(null);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['incidents', 'teams', 'hospitals', 'risk']);
  const [searchQuery, setSearchQuery] = useState('');

  const { incidents, rescueTeams, hospitals } = useNovaStore();
  const { t, localize, timeAgo } = useTranslation();

  // Center on specific incident
  const focusIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    if (mapInstanceRef.current && incident.location?.lat && incident.location?.lng) {
      mapInstanceRef.current.flyTo([incident.location.lat, incident.location.lng], 12, { animate: true, duration: 1.2 });
    }
  };

  // Reset Sri Lanka national view
  const resetNationalView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([7.8731, 80.7718], 8, { animate: true, duration: 1 });
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    if (i.status === 'resolved') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      (i.location?.district || '').toLowerCase().includes(q) ||
      (i.location?.zone || '').toLowerCase().includes(q)
    );
  });

  const critCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;
  const highCount = incidents.filter((i) => i.severity === 'high' && i.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-em-bg flex flex-col">
      <TopNav role="officer" />
      <DashboardShell role="officer">
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
          {/* Main Map Viewport */}
          <div className="flex-1 relative bg-[#070b14] overflow-hidden">
            {/* OpenStreetMap Leaflet Container */}
            <LazyEmergencyMap
              incidents={incidents}
              rescueTeams={rescueTeams}
              hospitals={hospitals}
              activeFilters={activeFilters}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              onMapReady={(map) => {
                mapInstanceRef.current = map;
              }}
            />

            {/* Top-Left Search & Filter Overlay */}
            <div className="absolute top-4 left-4 z-[999] flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-em-border rounded-xl px-3 py-1.5 shadow-lg">
                <Search className="w-3.5 h-3.5 text-em-text-muted" />
                <input
                  type="text"
                  placeholder="Search district, sector, incident..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-nova-text focus:outline-none w-48 placeholder:text-em-text-muted"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-em-text-muted hover:text-nova-text">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Layer Toggles */}
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-em-border rounded-xl p-1 shadow-lg">
                <Layers className="w-3.5 h-3.5 text-er-blue mx-1.5" />
                {['incidents', 'teams', 'hospitals', 'risk'].map((f) => (
                  <button
                    key={f}
                    onClick={() =>
                      setActiveFilters((prev) =>
                        prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f]
                      )
                    }
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all',
                      activeFilters.includes(f)
                        ? 'bg-nova-cyan text-nova-bg'
                        : 'text-em-text-muted hover:text-nova-text'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Re-center button */}
              <button
                onClick={resetNationalView}
                title="Reset to Sri Lanka view"
                className="p-2 bg-white/90 backdrop-blur-md border border-em-border rounded-xl text-em-text-muted hover:text-er-blue hover:border-er-blue/40 transition-all shadow-lg"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>

            {/* Top-Right Severity Stats Counter */}
            <div className="absolute top-4 right-14 z-[999] flex gap-2">
              <div className="bg-white/90 border border-red-500/30 backdrop-blur-lg rounded-xl px-3 py-1.5 text-center shadow-lg">
                <p className="text-lg font-bold font-mono text-red-400">{critCount}</p>
                <p className="text-[9px] text-em-text-muted">{t('stats.critical')}</p>
              </div>
              <div className="bg-white/90 border border-orange-500/30 backdrop-blur-lg rounded-xl px-3 py-1.5 text-center shadow-lg">
                <p className="text-lg font-bold font-mono text-orange-400">{highCount}</p>
                <p className="text-[9px] text-em-text-muted">High</p>
              </div>
            </div>

            {/* Selected Incident Popup Modal */}
            <AnimatePresence>
              {selectedIncident && (
                <IncidentPopup
                  incident={selectedIncident}
                  onClose={() => setSelectedIncident(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar — Live Incident Queue */}
          <div className="w-80 border-l border-em-border bg-white/50 overflow-y-auto p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Zap className="w-4 h-4 text-er-blue" />
              <p className="text-xs font-bold text-nova-text">{t('stats.active_incidents')}</p>
              <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {filteredIncidents.length}
              </span>
            </div>

            {filteredIncidents.length > 0 ? (
              filteredIncidents
                .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
                .map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => focusIncident(incident)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      selectedIncident?.id === incident.id
                        ? 'border-er-blue/30 bg-er-blue-light shadow-sm'
                        : 'border-em-border hover:border-em-border-strong hover:bg-em-subtle'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-em-text-muted">{incident.id}</span>
                      <SeverityBadge severity={incident.severity} size="sm" />
                    </div>
                    <p className="text-xs font-medium text-nova-text line-clamp-1">{localize(incident.title)}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-em-text-muted">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{localize(incident.location?.district || '')}</span>
                      <span>·</span>
                      <Users className="w-2.5 h-2.5" />
                      <span>{incident.peopleAffected}</span>
                      <span>·</span>
                      <Clock className="w-2.5 h-2.5" />
                      <span>{timeAgo(incident.reportedAt)}</span>
                    </div>
                  </button>
                ))
            ) : (
              <div className="text-center py-10 px-4 space-y-2">
                <MapPin className="w-8 h-8 text-em-text-muted mx-auto opacity-40" />
                <p className="text-xs font-semibold text-nova-text">No active incidents found</p>
                <p className="text-[10px] text-em-text-dim">Real reported incidents will be displayed and mapped here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
