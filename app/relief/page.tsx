'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Truck, UtensilsCrossed, Droplets, Package, CheckCircle2,
  AlertTriangle, Clock, MapPin, TrendingUp, Zap, RefreshCw,
  ChevronRight, Activity, Cpu, Plus, Eye
} from 'lucide-react';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { foodSourcesApi, reliefRequestsApi, reliefMissionsApi } from '@/lib/api/client';
import type { FoodSource, ReliefRequest, ReliefMission, ReliefStats } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  LOW: 'text-green-400 bg-green-500/10 border-green-500/30',
};

const MISSION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-gray-400 bg-gray-500/10',
  ASSIGNED: 'text-blue-400 bg-blue-500/10',
  ON_THE_WAY: 'text-orange-400 bg-orange-500/10 animate-pulse',
  DELIVERED: 'text-green-400 bg-green-500/10',
  COMPLETED: 'text-emerald-400 bg-emerald-500/10',
  CANCELLED: 'text-red-400 bg-red-500/10',
};

const SOURCE_TYPE_ICONS: Record<string, string> = {
  HOTEL: '🏨',
  RESTAURANT: '🍽️',
  SUPERMARKET: '🛒',
  WAREHOUSE: '🏭',
};

// ─── Stat Card Component ─────────────────────────────────────

function ReliefStatCard({
  label, value, unit, icon: Icon, color, sub
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="em-card border border-em-border rounded-xl p-5 flex items-center gap-4"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-em-text-dim truncate">{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-bold text-nova-text">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-xs text-em-text-dim">{unit}</span>}
        </div>
        {sub && <p className="text-[10px] text-em-text-dim mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Main Relief Page ────────────────────────────────────────

export default function ReliefPage() {
  const [stats, setStats] = useState<ReliefStats | null>(null);
  const [foodSources, setFoodSources] = useState<FoodSource[]>([]);
  const [reliefRequests, setReliefRequests] = useState<ReliefRequest[]>([]);
  const [activeMissions, setActiveMissions] = useState<ReliefMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'requests' | 'missions'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [createRequestModal, setCreateRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReliefRequest | null>(null);
  const [assignSourceId, setAssignSourceId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [driverName, setDriverName] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, sourcesRes, requestsRes, missionsRes] = await Promise.allSettled([
        reliefRequestsApi.getStats(),
        foodSourcesApi.getAll('active'),
        reliefRequestsApi.getAll(),
        reliefMissionsApi.getActive(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const data = (statsRes.value as any);
        setStats(data.data || data);
      }
      if (sourcesRes.status === 'fulfilled') {
        const data = (sourcesRes.value as any);
        setFoodSources(data.data || data || []);
      }
      if (requestsRes.status === 'fulfilled') {
        const data = (requestsRes.value as any);
        setReliefRequests(data.data || data || []);
      }
      if (missionsRes.status === 'fulfilled') {
        const data = (missionsRes.value as any);
        setActiveMissions(data.data || data || []);
      }
    } catch (err) {
      console.error('Relief data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAssignMission = async () => {
    if (!selectedRequest || !assignSourceId) return;
    try {
      await reliefMissionsApi.create({
        reliefRequestId: selectedRequest.id,
        foodSourceId: assignSourceId,
        vehicleName: vehicleName || 'Relief Vehicle',
        driverName: driverName || 'Driver',
      });
      setSelectedRequest(null);
      setAssignSourceId('');
      setVehicleName('');
      setDriverName('');
      await fetchData();
    } catch (err: any) {
      alert(`Failed to create mission: ${err.message}`);
    }
  };

  const pendingRequests = useMemo(() =>
    reliefRequests.filter(r => r.status === 'PENDING'), [reliefRequests]);
  const criticalRequests = useMemo(() =>
    pendingRequests.filter(r => r.priority === 'CRITICAL'), [pendingRequests]);
  const totalMeals = stats?.totalMealsAvailable ?? 0;
  const totalWater = stats?.totalWaterAvailable ?? 0;

  return (
    <AuthGuard allowedRoles={['officer', 'admin']}>
      <DashboardShell role="officer">
        <TopNav role="officer" title="Relief Logistics" subtitle="AI-Powered Food & Water Distribution" />

        <div className="p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-nova-text">AI Relief Logistics</h1>
                <p className="text-xs text-em-text-dim">Real-time food & water supply management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats?.aiServiceStatus === 'FALLBACK_ACTIVE' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <Cpu className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">AI Fallback Mode</span>
                </div>
              )}
              {stats?.aiServiceStatus === 'ONLINE' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Cpu className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">AI Online</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white border border-em-border hover:border-orange-500/50 transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4 text-em-text-dim', refreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Critical Alert Banner */}
          <AnimatePresence>
            {criticalRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/40"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-300">
                    {criticalRequests.length} Critical Relief Request{criticalRequests.length > 1 ? 's' : ''} Pending
                  </p>
                  <p className="text-xs text-red-400/80 mt-0.5">
                    Immediate action required — {criticalRequests.reduce((s, r) => s + r.peopleAffected, 0).toLocaleString()} people need supplies
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs text-red-300 hover:text-red-200 transition-colors flex items-center gap-1"
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Row */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="em-card border border-em-border rounded-xl p-5 h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ReliefStatCard
                label="Meals Available"
                value={totalMeals}
                icon={UtensilsCrossed}
                color="bg-orange-500/20 text-orange-400"
                sub={`${foodSources.length} active sources`}
              />
              <ReliefStatCard
                label="Water Bottles"
                value={totalWater}
                icon={Droplets}
                color="bg-blue-500/20 text-blue-400"
                sub="Potable water"
              />
              <ReliefStatCard
                label="Active Missions"
                value={stats?.activeMissions ?? activeMissions.length}
                icon={Truck}
                color="bg-green-500/20 text-green-400"
                sub="In transit"
              />
              <ReliefStatCard
                label="Critical Shortages"
                value={stats?.criticalShortages ?? criticalRequests.length}
                icon={AlertTriangle}
                color={criticalRequests.length > 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}
                sub={stats?.completedMissions ? `${stats.completedMissions} completed today` : 'None'}
              />
            </div>
          )}

          {/* Secondary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="em-card border border-em-border rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-nova-text">{stats?.completedMissions ?? 0}</p>
                <p className="text-xs text-em-text-dim">Completed Deliveries</p>
              </div>
            </div>
            <div className="em-card border border-em-border rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-nova-text">{stats?.pendingRequests ?? pendingRequests.length}</p>
                <p className="text-xs text-em-text-dim">Pending Requests</p>
              </div>
            </div>
            <div className="em-card border border-em-border rounded-xl p-4 flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-nova-text">{stats?.activeFoodSources ?? foodSources.length}</p>
                <p className="text-xs text-em-text-dim">Food Sources Active</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-white border border-em-border rounded-xl w-fit">
            {(['overview', 'sources', 'requests', 'missions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                  activeTab === tab
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-em-text-dim hover:text-nova-text'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Active Missions */}
                <div className="em-card border border-em-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-nova-text flex items-center gap-2">
                      <Truck className="w-4 h-4 text-orange-400" />
                      Active Missions
                    </h3>
                    <Link href="/relief/missions" className="text-xs text-orange-400 hover:underline">
                      View all →
                    </Link>
                  </div>
                  {activeMissions.length === 0 ? (
                    <p className="text-sm text-em-text-dim text-center py-6">No active missions</p>
                  ) : (
                    <div className="space-y-3">
                      {activeMissions.slice(0, 4).map(mission => (
                        <div key={mission.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-em-border">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                            <Truck className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-nova-text truncate">
                              {mission.vehicleName || mission.id}
                            </p>
                            <p className="text-[10px] text-em-text-dim">
                              {mission.meals > 0 && `${mission.meals.toLocaleString()} meals`}
                              {mission.meals > 0 && mission.waterBottles > 0 && ' + '}
                              {mission.waterBottles > 0 && `${mission.waterBottles.toLocaleString()} water`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              MISSION_STATUS_COLORS[mission.status] || 'text-gray-400 bg-gray-500/10'
                            )}>
                              {mission.status.replace('_', ' ')}
                            </span>
                            {mission.eta > 0 && (
                              <span className="text-[10px] text-em-text-dim flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {mission.eta}m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Requests */}
                <div className="em-card border border-em-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-nova-text flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      Pending Requests
                    </h3>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="text-xs text-yellow-400 hover:underline"
                    >
                      Manage →
                    </button>
                  </div>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-em-text-dim">All requests assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.slice(0, 4).map(req => (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-em-border">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                                PRIORITY_COLORS[req.priority] || 'text-gray-400'
                              )}>
                                {req.priority}
                              </span>
                              <span className="text-xs text-em-text-dim">
                                {req.peopleAffected} people
                              </span>
                            </div>
                            <p className="text-[10px] text-em-text-dim">
                              {req.requiredMeals.toLocaleString()} meals • {req.requiredWater.toLocaleString()} water
                              {req.disasterLocation?.district && ` • ${req.disasterLocation.district}`}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActiveTab('requests');
                            }}
                            className="text-[10px] text-orange-400 hover:underline flex-shrink-0"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Food Sources Tab */}
            {activeTab === 'sources' && (
              <motion.div
                key="sources"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-em-text-dim">{foodSources.length} active food sources</p>
                  <Link
                    href="/relief/food-sources"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 hover:bg-orange-500/20 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Manage Sources
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foodSources.map((source, i) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="em-card border border-em-border rounded-xl p-4 hover:border-orange-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{SOURCE_TYPE_ICONS[source.type] || '📦'}</span>
                          <div>
                            <p className="text-xs font-semibold text-nova-text">{source.name}</p>
                            <p className="text-[10px] text-em-text-dim">{source.type}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full',
                          source.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        )}>
                          {source.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                          <p className="text-[10px] text-orange-400/70 mb-0.5">Meals</p>
                          <p className="text-sm font-bold text-orange-300">{source.availableMeals.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="text-[10px] text-blue-400/70 mb-0.5">Water</p>
                          <p className="text-sm font-bold text-blue-300">{source.waterBottles.toLocaleString()}</p>
                        </div>
                      </div>
                      {source.location?.district && (
                        <div className="flex items-center gap-1 mt-2">
                          <MapPin className="w-2.5 h-2.5 text-em-text-dim" />
                          <p className="text-[10px] text-em-text-dim truncate">
                            {source.location.address || source.location.district}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-em-text-dim">{reliefRequests.length} total requests</p>
                </div>

                {/* Assign Mission Modal */}
                <AnimatePresence>
                  {selectedRequest && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/30 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-orange-300">
                          Assign Mission — {selectedRequest.peopleAffected} people
                        </h3>
                        <button onClick={() => setSelectedRequest(null)} className="text-em-text-dim hover:text-nova-text text-xs">
                          ✕ Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-em-text-dim mb-1 block">Food Source *</label>
                          <select
                            value={assignSourceId}
                            onChange={e => setAssignSourceId(e.target.value)}
                            className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none"
                          >
                            <option value="">Select source…</option>
                            {foodSources.filter(s => s.availableMeals >= selectedRequest.requiredMeals * 0.5).map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.availableMeals.toLocaleString()} meals)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-em-text-dim mb-1 block">Vehicle Name</label>
                          <input
                            type="text"
                            placeholder="Relief Truck Alpha"
                            value={vehicleName}
                            onChange={e => setVehicleName(e.target.value)}
                            className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-em-text-dim mb-1 block">Driver Name</label>
                          <input
                            type="text"
                            placeholder="Driver name"
                            value={driverName}
                            onChange={e => setDriverName(e.target.value)}
                            className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAssignMission}
                        disabled={!assignSourceId}
                        className="px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                      >
                        <Truck className="w-3 h-3 inline mr-1.5" />
                        Dispatch Mission
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="em-card border border-em-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-em-border bg-white/50">
                        <th className="text-left p-3 text-em-text-dim font-medium">Priority</th>
                        <th className="text-left p-3 text-em-text-dim font-medium">People</th>
                        <th className="text-left p-3 text-em-text-dim font-medium hidden md:table-cell">Required</th>
                        <th className="text-left p-3 text-em-text-dim font-medium">Status</th>
                        <th className="text-left p-3 text-em-text-dim font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reliefRequests.map(req => (
                        <tr key={req.id} className="border-b border-em-border hover:bg-white/30 transition-colors">
                          <td className="p-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] border font-medium', PRIORITY_COLORS[req.priority])}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="p-3 text-nova-text">{req.peopleAffected.toLocaleString()}</td>
                          <td className="p-3 text-em-text-dim hidden md:table-cell">
                            {req.requiredMeals.toLocaleString()} meals
                            <br />
                            {req.requiredWater.toLocaleString()} water
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full',
                              req.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                              req.status === 'ASSIGNED' ? 'bg-blue-500/10 text-blue-400' :
                              req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-gray-500/10 text-gray-400'
                            )}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {req.status === 'PENDING' && (
                              <button
                                onClick={() => setSelectedRequest(req)}
                                className="text-orange-400 hover:underline text-[10px]"
                              >
                                Assign →
                              </button>
                            )}
                            {req.status !== 'PENDING' && (
                              <span className="text-em-text-dim text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {reliefRequests.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center p-8 text-em-text-dim">
                            No relief requests found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Missions Tab */}
            {activeTab === 'missions' && (
              <motion.div
                key="missions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Link
                  href="/relief/missions"
                  className="flex items-center justify-between p-5 rounded-xl em-card border border-em-border hover:border-orange-500/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-8 h-8 text-orange-400" />
                    <div>
                      <p className="text-sm font-semibold text-nova-text">Full Mission Dashboard</p>
                      <p className="text-xs text-em-text-dim">Track all relief deliveries with live GPS</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-em-text-dim group-hover:text-orange-400 transition-colors" />
                </Link>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  {activeMissions.map(mission => (
                    <div key={mission.id} className="em-card border border-em-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-medium text-nova-text">
                            {mission.vehicleName || mission.id}
                          </span>
                        </div>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-medium',
                          MISSION_STATUS_COLORS[mission.status]
                        )}>
                          {mission.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-em-text-dim">Meals</p>
                          <p className="text-nova-text font-medium">{mission.meals.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-em-text-dim">Water</p>
                          <p className="text-nova-text font-medium">{mission.waterBottles.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-em-text-dim">ETA</p>
                          <p className="text-nova-text font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-400" />
                            {mission.eta > 0 ? `${mission.eta} min` : 'Arrived'}
                          </p>
                        </div>
                      </div>
                      {mission.destination && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-em-text-dim">
                          <MapPin className="w-2.5 h-2.5" />
                          {mission.destination.address || mission.destination.district || 'Disaster Zone'}
                        </div>
                      )}
                    </div>
                  ))}
                  {activeMissions.length === 0 && (
                    <div className="em-card border border-em-border rounded-xl p-8 text-center">
                      <Truck className="w-10 h-10 text-em-text-dim mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-em-text-dim">No active relief missions</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
