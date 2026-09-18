'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Clock, CheckCircle2, XCircle, Package, MapPin, Phone, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { reliefMissionsApi } from '@/lib/api/client';
import type { ReliefMission, ReliefMissionStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { color: string; label: string; next?: string[] }> = {
  PENDING:    { color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', label: 'Pending', next: ['ASSIGNED', 'CANCELLED'] },
  ASSIGNED:   { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Assigned', next: ['ON_THE_WAY', 'CANCELLED'] },
  ON_THE_WAY: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/30 animate-pulse', label: 'On The Way', next: ['DELIVERED', 'CANCELLED'] },
  DELIVERED:  { color: 'bg-green-500/10 text-green-400 border-green-500/30', label: 'Delivered', next: ['COMPLETED'] },
  COMPLETED:  { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Completed', next: [] },
  CANCELLED:  { color: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Cancelled', next: [] },
};

const FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'On The Way', value: 'ON_THE_WAY' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function ReliefMissionsPage() {
  const [missions, setMissions] = useState<ReliefMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchMissions = async () => {
    try {
      const res = await reliefMissionsApi.getAll();
      const data = (res as any).data || res;
      setMissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Missions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
    const interval = setInterval(fetchMissions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMissions();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (missionId: string, newStatus: string) => {
    setUpdating(missionId);
    try {
      await reliefMissionsApi.updateStatus(missionId, newStatus);
      await fetchMissions();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const filteredMissions = missions.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['ASSIGNED', 'ON_THE_WAY'].includes(m.status);
    return m.status === filter;
  });

  const stats = {
    total: missions.length,
    active: missions.filter(m => ['ASSIGNED', 'ON_THE_WAY'].includes(m.status)).length,
    completed: missions.filter(m => m.status === 'COMPLETED').length,
    cancelled: missions.filter(m => m.status === 'CANCELLED').length,
  };

  return (
    <AuthGuard allowedRoles={['officer', 'admin']}>
      <DashboardShell role="officer">
        <TopNav role="officer" title="Relief Missions" subtitle="Track and manage all relief deliveries" />

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/relief" className="flex items-center gap-2 text-em-text-dim hover:text-em-text text-xs transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Relief
            </Link>
            <button onClick={handleRefresh} className="p-2 rounded-lg em-card border border-em-border hover:border-orange-500/50 transition-colors">
              <RefreshCw className={cn('w-4 h-4 text-em-text-dim', refreshing && 'animate-spin')} />
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-em-text font-black' },
              { label: 'Active', value: stats.active, color: 'text-er-orange font-black' },
              { label: 'Completed', value: stats.completed, color: 'text-er-green font-black' },
              { label: 'Cancelled', value: stats.cancelled, color: 'text-er-red font-black' },
            ].map(s => (
              <div key={s.label} className="em-card border border-em-border rounded-xl p-3 text-center shadow-em-xs">
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-em-text-muted font-bold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs transition-all border font-semibold shadow-xs',
                  filter === opt.value
                    ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold shadow-sm'
                    : 'bg-white border-em-border text-em-text-dim hover:text-em-text hover:bg-em-subtle'
                )}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span className="ml-1.5 text-[10px] opacity-80">
                    ({opt.value === 'active'
                      ? stats.active
                      : missions.filter(m => m.status === opt.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Missions List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="em-card border border-em-border rounded-xl p-5 h-32 animate-pulse" />
              ))}
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="em-card border border-em-border rounded-xl p-12 text-center">
              <Truck className="w-12 h-12 text-em-text-dim mx-auto mb-3 opacity-40" />
              <p className="text-sm text-em-text-dim">No missions found for this filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMissions.map((mission, i) => {
                const cfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG.PENDING;
                const nextStatuses = cfg.next || [];
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="em-card border border-em-border rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Mission info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-nova-text">{mission.vehicleName || mission.id}</span>
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', cfg.color)}>
                              {cfg.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div className="flex items-center gap-1 text-em-text-dim">
                              <Package className="w-3 h-3 text-orange-400" />
                              {mission.meals.toLocaleString()} meals
                            </div>
                            <div className="flex items-center gap-1 text-em-text-dim">
                              <Clock className="w-3 h-3 text-blue-400" />
                              ETA: {mission.eta > 0 ? `${mission.eta} min` : 'Arrived'}
                            </div>
                            {mission.driverName && (
                              <div className="flex items-center gap-1 text-em-text-dim">
                                <Phone className="w-3 h-3" />
                                {mission.driverName}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-em-text-dim">
                              <Package className="w-3 h-3 text-blue-400" />
                              {mission.waterBottles.toLocaleString()} water
                            </div>
                          </div>

                          {/* Route */}
                          <div className="flex items-center gap-2 text-[10px] text-em-text-dim">
                            <MapPin className="w-2.5 h-2.5 text-green-400" />
                            {mission.pickupLocation?.district || mission.foodSourceName || 'Source'}
                            <span className="text-nova-border">→</span>
                            <MapPin className="w-2.5 h-2.5 text-red-400" />
                            {mission.destination?.district || 'Disaster Zone'}
                            {mission.distanceKm != null && mission.distanceKm > 0 && ` (${mission.distanceKm.toFixed(1)} km)`}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status update actions */}
                      {nextStatuses.length > 0 && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          {nextStatuses.map(next => (
                            <button
                              key={next}
                              onClick={() => handleUpdateStatus(mission.id, next)}
                              disabled={updating === mission.id}
                              className={cn(
                                'text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-all',
                                next === 'CANCELLED'
                                  ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                  : 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10',
                                updating === mission.id && 'opacity-50'
                              )}
                            >
                              {updating === mission.id ? '…' : next === 'CANCELLED' ? '✕ Cancel' : `→ ${next.replace('_', ' ')}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
